package com.writegy.service;

import com.writegy.model.entity.User;
import com.writegy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Sync Supabase user to local PostgreSQL database
     * This ensures users authenticated by Supabase exist in our local database
     * Uses "Get or Create" pattern for concurrency safety
     */
    public User syncSupabaseUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt)) {
            throw new IllegalArgumentException("Invalid authentication");
        }

        Jwt jwt = (Jwt) authentication.getPrincipal();

        // Extract user claims from Supabase JWT
        String email = jwt.getClaimAsString("email");
        String fullName = jwt.getClaimAsString("full_name");
        String sub = jwt.getClaimAsString("sub"); // Supabase user ID

        if (email == null) {
            throw new IllegalArgumentException("Email claim missing from JWT");
        }

        // First, try to find by supabase_id (most reliable for existing users)
        if (sub != null) {
            Optional<User> existingBySupabaseId = userRepository.findBySupabaseId(sub);
            if (existingBySupabaseId.isPresent()) {
                User existingUser = existingBySupabaseId.get();
                // Update email and name if changed
                if (!email.equals(existingUser.getEmail()) || 
                    (fullName != null && !fullName.equals(existingUser.getName()))) {
                    existingUser.setEmail(email);
                    if (fullName != null) {
                        existingUser.setName(fullName);
                    }
                    return userRepository.save(existingUser);
                }
                return existingUser;
            }
        }

        // Second, try to find by email (for users without supabase_id set)
        return userRepository.findByEmail(email)
                .map(existingUser -> {
                    // Update supabase_id if not set
                    if (sub != null && existingUser.getSupabaseId() == null) {
                        existingUser.setSupabaseId(sub);
                    }
                    // Update name if changed
                    if (fullName != null && !fullName.equals(existingUser.getName())) {
                        existingUser.setName(fullName);
                    }
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    // Create new user from Supabase data
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setName(fullName != null ? fullName : email); // Fallback to email if no name
                    newUser.setSupabaseId(sub); // Store Supabase user ID
                    return userRepository.save(newUser);
                });
    }
}
