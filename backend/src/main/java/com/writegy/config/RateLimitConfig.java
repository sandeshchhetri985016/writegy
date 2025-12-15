package com.writegy.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class RateLimitConfig {

    @Bean
    public Bucket grammarCheckBucket() {
        // Allow 20 grammar checks per hour per user
        Bandwidth limit = Bandwidth.classic(20, Refill.intervally(20, Duration.ofHours(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    @Bean
    public Bucket strictBucket() {
        // Strict limit for sensitive operations (5 requests per minute)
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
