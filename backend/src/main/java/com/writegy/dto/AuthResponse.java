package com.writegy.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;  // For legacy compatibility, but Supabase handles JWT
    private String email;
    private String fullName;  // For legacy compatibility with existing code

    // Explicit constructor for AuthController compatibility
    public AuthResponse(String token, String email, String fullName) {
        this.token = token;
        this.email = email;
        this.fullName = fullName;
    }
}
