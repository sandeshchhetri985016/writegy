package com.writegy.controller;

import com.writegy.dto.AdminUserDTO;
import com.writegy.model.entity.User;
import com.writegy.model.enums.UserRole;
import com.writegy.repository.DocumentRepository;
import com.writegy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private boolean isAdmin(Authentication auth) {
        if (auth == null) return false;
        String email = auth.getName();
        Optional<User> user = userRepository.findByEmail(email);
        return user.map(u -> u.getRole() == UserRole.ADMIN).orElse(false);
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        Map<String, Object> stats = new HashMap<>();

        // Total users
        stats.put("totalUsers", userRepository.count());

        // Total documents
        stats.put("totalDocuments", documentRepository.count());

        // Users by role
        List<User> allUsers = userRepository.findAll();
        Map<String, Long> usersByRole = allUsers.stream()
                .collect(Collectors.groupingBy(u -> u.getRole().name(), Collectors.counting()));
        stats.put("usersByRole", usersByRole);

        // Recent registrations (last 7 days)
        long recentUsers = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null && 
                        u.getCreatedAt().isAfter(java.time.LocalDateTime.now().minusDays(7)))
                .count();
        stats.put("recentUsers", recentUsers);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        List<User> users = userRepository.findAll();
        List<AdminUserDTO> dtos = users.stream().map(user -> {
            AdminUserDTO dto = new AdminUserDTO();
            dto.setId(user.getId());
            dto.setEmail(user.getEmail());
            dto.setName(user.getName());
            dto.setRole(user.getRole());
            dto.setCreatedAt(user.getCreatedAt());
            dto.setLastLoginAt(user.getLastLoginAt());

            // Count documents - fix Long to Integer conversion
            dto.setDocumentCount((int) documentRepository.countByUserId(user.getId()));
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        User user = userOpt.get();
        try {
            user.setRole(UserRole.valueOf(request.get("role")));
            userRepository.save(user);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "User role updated successfully");
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Invalid role: " + request.get("role"));
            return ResponseEntity.badRequest().body(response);
        }
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        userRepository.deleteById(id);
        Map<String, Object> response = new HashMap<>();
        response.put("message", "User deleted successfully");
        return ResponseEntity.ok(response);
    }
}