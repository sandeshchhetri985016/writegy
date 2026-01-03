package com.writegy.config;

import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @Autowired
    private Bucket grammarCheckBucket;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String requestURI = request.getRequestURI();

        // Allow preflight requests to bypass rate limiting
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        // Apply rate limiting only to grammar check endpoint
        if (requestURI.startsWith("/api/grammar/check")) {
            ConsumptionProbe probe = grammarCheckBucket.tryConsumeAndReturnRemaining(1);

            if (probe.isConsumed()) {
                // Add rate limit headers
                response.setHeader("X-Rate-Limit-Remaining", String.valueOf(probe.getRemainingTokens()));
                response.setHeader("X-Rate-Limit-Retry-After-Seconds",
                    String.valueOf(probe.getNanosToWaitForRefill() / 1_000_000_000));

                filterChain.doFilter(request, response);
            } else {
                // Rate limit exceeded
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Try again later.\",\"retryAfter\":" +
                    (probe.getNanosToWaitForRefill() / 1_000_000_000) + "}");
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }
}
