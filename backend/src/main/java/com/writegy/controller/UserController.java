package com.writegy.controller;

import com.writegy.model.entity.User;
import com.writegy.model.entity.UserProfile;
import com.writegy.repository.UserProfileRepository;
import com.writegy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository profileRepository;

    @PutMapping("/avatar")
    public ResponseEntity<Map<String, Object>> updateAvatar(
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        String avatarUrl = body.get("avatar");
        
        // Update user profile with the avatar URL
        UserProfile profile = profileRepository.findByUserId(user.getId());
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
        }
        profile.setAvatar(avatarUrl);
        profileRepository.save(profile);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Avatar updated successfully");
        response.put("avatar", avatarUrl);
        
        return ResponseEntity.ok(response);
    }
}