package com.writegy.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Configuration class to load .env file before Spring Boot starts.
 * This ensures environment variables from .env are available to @Value annotations.
 */
public class DotEnvConfig implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        try {
            // Load .env file - try multiple possible locations
            Dotenv dotenv = null;
            
            // Try current directory first (when running from backend/)
            try {
                dotenv = Dotenv.configure()
                        .directory(".")
                        .ignoreIfMalformed()
                        .ignoreIfMissing()
                        .load();
            } catch (Exception e) {
                // Try backend subdirectory (when running from root)
                dotenv = Dotenv.configure()
                        .directory("./backend")
                        .ignoreIfMalformed()
                        .ignoreIfMissing()
                        .load();
            }

            // Create a map of environment variables from .env
            Map<String, Object> envMap = new HashMap<>();
            dotenv.entries().forEach(entry -> {
                envMap.put(entry.getKey(), entry.getValue());
                // Also set as system property for @Value to work
                System.setProperty(entry.getKey(), entry.getValue());
            });

            // Add to Spring environment
            ConfigurableEnvironment environment = applicationContext.getEnvironment();
            environment.getPropertySources().addFirst(new MapPropertySource("dotenvProperties", envMap));

            System.out.println("DEBUG: Loaded .env file with " + envMap.size() + " properties");
            
            // Debug: Check if OPENROUTER_API_KEY is loaded
            String apiKey = dotenv.get("OPENROUTER_API_KEY");
            if (apiKey != null && !apiKey.isEmpty()) {
                System.out.println("DEBUG: OPENROUTER_API_KEY loaded successfully (length: " + apiKey.length() + ")");
            } else {
                System.out.println("DEBUG: OPENROUTER_API_KEY not found in .env file");
            }
            
        } catch (Exception e) {
            System.err.println("WARNING: Could not load .env file: " + e.getMessage());
            // Don't fail startup if .env is missing - system env vars may be used instead
        }
    }
}