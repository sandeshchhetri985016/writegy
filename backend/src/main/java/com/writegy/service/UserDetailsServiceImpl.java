package com.writegy.service;

import com.writegy.model.entity.User;
import com.writegy.model.enums.UserRole;
import com.writegy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .map(user -> org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                        .password(user.getPassword() != null ? user.getPassword() : "")
                        .authorities(new ArrayList<>())
                        .build())
                .orElseGet(() -> {
                    // Auto-create user on first login
                    User newUser = createUserFromEmail(email);
                    return org.springframework.security.core.userdetails.User.withUsername(newUser.getEmail())
                            .password(newUser.getPassword() != null ? newUser.getPassword() : "")
                            .authorities(new ArrayList<>())
                            .build();
                });
    }

    private User createUserFromEmail(String email) {
        try {
            User user = new User();
            user.setEmail(email);

            // Extract name from email (before @)
            String name = email.split("@")[0];
            // Capitalize first letter
            name = name.substring(0, 1).toUpperCase() + name.substring(1);
            user.setName(name);

            // Generate a unique Supabase ID based on email
            user.setSupabaseId("supabase-" + email.replace("@", "-").replace(".", "-"));

            user.setRole(UserRole.FREE);
            user.setIsEmailVerified(true); // Since they authenticated with Supabase

            User savedUser = userRepository.save(user);
            System.out.println("Auto-created user: " + email);
            return savedUser;

        } catch (Exception e) {
            System.err.println("Failed to create user for email: " + email + " - " + e.getMessage());
            throw new UsernameNotFoundException("Failed to create user account");
        }
    }
}
