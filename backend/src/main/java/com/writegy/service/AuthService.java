package com.writegy.service;

import com.writegy.model.User;
import com.writegy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    /**
     * Sync Supabase user to local PostgreSQL database
     * This ensures users authenticated by Supabase exist in our local database
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

        // Check if user already exists
        User existingUser = userRepository.findByEmail(email).orElse(null);

        if (existingUser != null) {
            // Update user info if changed
            if (fullName != null && !fullName.equals(existingUser.getFullName())) {
                existingUser.setFullName(fullName);
                return userRepository.save(existingUser);
            }
            return existingUser;
        }

        // Create new user from Supabase data
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setFullName(fullName != null ? fullName : email); // Fallback to email if no name
        newUser.setSupabaseId(sub); // Store Supabase user ID

        return userRepository.save(newUser);
    }
}
