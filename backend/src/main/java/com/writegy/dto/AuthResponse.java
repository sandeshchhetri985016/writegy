package com.writegy.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AuthResponse {
    private String token;  // For legacy compatibility, but Supabase handles JWT
    private String email;
    private String fullName;
}
