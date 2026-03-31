package com.writegy.service;

import com.writegy.model.entity.User;
import com.writegy.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;

    /**
     * Sync Supabase user to local PostgreSQL database
     * This ensures users authenticated by Supabase exist in our local database
     * Uses "Get or Create" pattern with race condition handling
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

        try {
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
            Optional<User> existingByEmail = userRepository.findByEmail(email);
            if (existingByEmail.isPresent()) {
                User existingUser = existingByEmail.get();
                // Update supabase_id if not set
                if (sub != null && existingUser.getSupabaseId() == null) {
                    existingUser.setSupabaseId(sub);
                }
                // Update name if changed
                if (fullName != null && !fullName.equals(existingUser.getName())) {
                    existingUser.setName(fullName);
                }
                return userRepository.save(existingUser);
            }

            // Create new user from Supabase data
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setName(fullName != null ? fullName : email); // Fallback to email if no name
            newUser.setSupabaseId(sub); // Store Supabase user ID
            return userRepository.save(newUser);

        } catch (DataIntegrityViolationException e) {
            // Handle race condition: another concurrent request created the user
            logger.warn("Race condition detected for user sync (email: {}, supabase_id: {}). Fetching existing user.", email, sub);
            
            // Try to fetch the user that was created by the concurrent request
            if (sub != null) {
                Optional<User> userBySupabaseId = userRepository.findBySupabaseId(sub);
                if (userBySupabaseId.isPresent()) {
                    logger.info("Successfully retrieved user after race condition (supabase_id: {})", sub);
                    return userBySupabaseId.get();
                }
            }
            
            Optional<User> userByEmail = userRepository.findByEmail(email);
            if (userByEmail.isPresent()) {
                logger.info("Successfully retrieved user after race condition (email: {})", email);
                return userByEmail.get();
            }
            
            // If we still can't find the user, re-throw the exception
            logger.error("Failed to recover from race condition for user (email: {})", email, e);
            throw e;
        }
    }
}
