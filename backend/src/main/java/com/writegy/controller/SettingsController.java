package com.writegy.controller;

import com.writegy.dto.SettingsRequest;
import com.writegy.model.entity.User;
import com.writegy.model.entity.UserPreferences;
import com.writegy.model.entity.UserProfile;
import com.writegy.repository.UserPreferencesRepository;
import com.writegy.repository.UserProfileRepository;
import com.writegy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserProfileRepository profileRepository;

    @Autowired
    private UserPreferencesRepository preferencesRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getSettings(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
        Map<String, Object> response = new HashMap<>();

        // Get user info
        response.put("name", user.getName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());

        // Get profile
        UserProfile profile = profileRepository.findByUserId(user.getId());
        if (profile != null) {
            response.put("bio", profile.getBio());
            response.put("avatar", profile.getAvatar());
            response.put("timezone", profile.getTimezone());
        }

        // Get preferences
        UserPreferences preferences = preferencesRepository.findByUserId(user.getId());
        if (preferences != null) {
            response.put("theme", preferences.getTheme());
            response.put("language", preferences.getLanguage());
            response.put("autoSaveEnabled", preferences.getAutoSaveEnabled());
            response.put("grammarCheckEnabled", preferences.getGrammarCheckEnabled());
            response.put("spellCheckEnabled", preferences.getSpellCheckEnabled());
        }

        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> updateSettings(
            @RequestBody SettingsRequest request,
            Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));

        // Update user name
        if (request.getName() != null) {
            user.setName(request.getName());
            userRepository.save(user);
        }

        // Update profile
        UserProfile profile = profileRepository.findByUserId(user.getId());
        if (profile == null) {
            profile = new UserProfile();
            profile.setUser(user);
        }
        if (request.getBio() != null) profile.setBio(request.getBio());
        if (request.getAvatar() != null) profile.setAvatar(request.getAvatar());
        if (request.getTimezone() != null) profile.setTimezone(request.getTimezone());
        profileRepository.save(profile);

        // Update preferences
        UserPreferences preferences = preferencesRepository.findByUserId(user.getId());
        if (preferences == null) {
            preferences = new UserPreferences();
            preferences.setUser(user);
        }
        if (request.getTheme() != null) preferences.setTheme(request.getTheme());
        if (request.getLanguage() != null) preferences.setLanguage(request.getLanguage());
        if (request.getAutoSaveEnabled() != null) preferences.setAutoSaveEnabled(request.getAutoSaveEnabled());
        if (request.getGrammarCheckEnabled() != null) preferences.setGrammarCheckEnabled(request.getGrammarCheckEnabled());
        if (request.getSpellCheckEnabled() != null) preferences.setSpellCheckEnabled(request.getSpellCheckEnabled());
        preferencesRepository.save(preferences);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Settings updated successfully");
        return ResponseEntity.ok(response);
    }
}