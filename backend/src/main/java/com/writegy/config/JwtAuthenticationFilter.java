package com.writegy.config;

import com.writegy.security.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @SuppressWarnings("unchecked")
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String email = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                // Extract email from JWT claims (stateless, no DB hit)
                Map<String, Object> claims = jwtUtil.extractAllClaims(jwt);
                email = (String) claims.get("email");
                
                if (email == null) {
                    email = jwtUtil.extractUsername(jwt);
                }
                
                logger.debug("Extracted email from JWT: {}", email);
            } catch (Exception e) {
                logger.error("JWT Token extraction failed: {}", e.getMessage());
            }
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                // Validate JWT signature (stateless verification)
                if (jwtUtil.validateToken(jwt, email)) {
                    logger.debug("JWT validation successful for user: {}", email);
                    
                    // Extract roles from JWT claims (stateless, no DB hit)
                    Map<String, Object> claims = jwtUtil.extractAllClaims(jwt);
                    List<SimpleGrantedAuthority> authorities;
                    
                    Object rolesObj = claims.get("role");
                    if (rolesObj instanceof List) {
                        @SuppressWarnings("unchecked")
                        List<String> roles = (List<String>) rolesObj;
                        authorities = roles.stream()
                                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                                .toList();
                    } else if (rolesObj instanceof String role) {
                        authorities = Collections.singletonList(
                                new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
                    } else {
                        authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
                    }
                    
                    // Wrap email in a standard User object so controllers expecting UserDetails work correctly
                    org.springframework.security.core.userdetails.User principal = 
                            new org.springframework.security.core.userdetails.User(
                                    email, "", authorities);
                    
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            principal, null, authorities);
                    authToken.setDetails(new org.springframework.security.web.authentication.WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    logger.warn("SECURITY: JWT signature verification failed for user: {} - authentication rejected", email);
                }
                
            } catch (Exception e) {
                logger.error("SECURITY: JWT authentication failed - {}", e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }
}