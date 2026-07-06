package com.writegy.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    // This pulls your SUPABASE_JWT_SECRET from the .env file!
    @Value("${supabase.jwt.secret:}")
    private String jwtSecret;

    private String getSanitizedSecret() {
        if (jwtSecret == null) {
            return "";
        }

        String trimmed = jwtSecret.trim();
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            return trimmed.substring(1, trimmed.length() - 1).trim();
        }

        return trimmed;
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = getSanitizedSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    private Claims getClaimsFromToken(String token) {
        // This cryptographically verifies the token using your HS256 secret.
        // It throws an exception immediately if the signature is invalid.
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractUsername(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            String email = claims.get("email", String.class);
            return email != null ? email : claims.getSubject();
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract username: " + e.getMessage());
        }
    }

    public Date extractExpiration(String token) {
        return getClaimsFromToken(token).getExpiration();
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    public Map<String, Object> extractAllClaims(String token) {
        try {
            Claims claims = getClaimsFromToken(token);
            return new HashMap<>(claims);
        } catch (Exception e) {
            return new HashMap<>();
        }
    }

    private Boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    public boolean validateToken(String token, String expectedEmail) {
        try {
            String email = extractUsername(token);
            return (expectedEmail != null && expectedEmail.equals(email) && !isTokenExpired(token));
        } catch (Exception e) {
            System.err.println("JWT Validation Failed: " + e.getMessage());
            return false;
        }
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (Exception e) {
            System.err.println("JWT Validation Failed: " + e.getMessage());
            return false;
        }
    }

    public Boolean validateSupabaseToken(String token) {
        try {
            getClaimsFromToken(token);
            return !isTokenExpired(token);
        } catch (Exception e) {
            System.err.println("Supabase JWT Validation Failed: " + e.getMessage());
            return false;
        }
    }

    public String extractUserId(String token) {
        try {
            return getClaimsFromToken(token).getSubject();
        } catch (Exception e) {
            throw new RuntimeException("Failed to extract user ID: " + e.getMessage());
        }
    }

    public String generateToken(UserDetails userDetails) {
        throw new UnsupportedOperationException("Token generation is not supported. Use Supabase authentication.");
    }
}