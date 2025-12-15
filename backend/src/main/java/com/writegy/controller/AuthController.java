package com.writegy.controller;

import com.writegy.dto.AuthResponse;
import com.writegy.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/sync")
    public ResponseEntity<?> syncUser(Authentication authentication) {
        // Extract user info from JWT and sync to local database
        authService.syncSupabaseUser(authentication);
        return ResponseEntity.ok("User synced successfully");
    }

    // Optional: Endpoint to get current user info
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        // Extract user info from JWT
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String email = jwt.getClaimAsString("email");
        String name = jwt.getClaimAsString("full_name");

        return ResponseEntity.ok(new AuthResponse(null, email, name));
    }
}
