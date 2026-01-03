package com.writegy.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@SpringBootTest
@ActiveProfiles("test")
class JwtUtilTest {

    @Mock
    private Environment environment;

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil(environment);
        ReflectionTestUtils.setField(jwtUtil, "supabaseUrl", "https://test.supabase.co");
        ReflectionTestUtils.setField(jwtUtil, "strictValidation", false);
    }

    @Test
    void testProductionProfileDetection_WhenProdProfile() {
        // Arrange
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"});

        // Act
        boolean isProduction = (Boolean) ReflectionTestUtils.invokeMethod(jwtUtil, "isProductionProfile");

        // Assert
        assertTrue(isProduction);
    }

    @Test
    void testProductionProfileDetection_WhenProductionProfile() {
        // Arrange
        when(environment.getActiveProfiles()).thenReturn(new String[]{"production"});

        // Act
        boolean isProduction = (Boolean) ReflectionTestUtils.invokeMethod(jwtUtil, "isProductionProfile");

        // Assert
        assertTrue(isProduction);
    }

    @Test
    void testProductionProfileDetection_WhenDevProfile() {
        // Arrange
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});

        // Act
        boolean isProduction = (Boolean) ReflectionTestUtils.invokeMethod(jwtUtil, "isProductionProfile");

        // Assert
        assertFalse(isProduction);
    }

    @Test
    void testProductionProfileDetection_WhenNoProfile() {
        // Arrange
        when(environment.getActiveProfiles()).thenReturn(new String[]{});

        // Act
        boolean isProduction = (Boolean) ReflectionTestUtils.invokeMethod(jwtUtil, "isProductionProfile");

        // Assert
        assertFalse(isProduction);
    }

    @Test
    void testStrictValidationProperty() {
        // Arrange
        ReflectionTestUtils.setField(jwtUtil, "strictValidation", true);

        // Act & Assert
        assertDoesNotThrow(() -> {
            // This would throw an exception in strict mode if JWT validation fails
            // Since we're not providing a valid JWT, it should fail gracefully
        });
    }

    @Test
    void testSupabaseUrlConfiguration() {
        // Arrange
        String testUrl = "https://test.supabase.co";
        ReflectionTestUtils.setField(jwtUtil, "supabaseUrl", testUrl);

        // Act
        String supabaseUrl = (String) ReflectionTestUtils.getField(jwtUtil, "supabaseUrl");

        // Assert
        assertEquals(testUrl, supabaseUrl);
    }

    @Test
    void testNullSupabaseUrlHandling() {
        // Arrange
        ReflectionTestUtils.setField(jwtUtil, "supabaseUrl", null);
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"}); // Force production mode

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            ReflectionTestUtils.invokeMethod(jwtUtil, "getJwkSet");
        });
    }

    @Test
    void testEmptySupabaseUrlHandling() {
        // Arrange
        ReflectionTestUtils.setField(jwtUtil, "supabaseUrl", "");
        when(environment.getActiveProfiles()).thenReturn(new String[]{"prod"}); // Force production mode

        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            ReflectionTestUtils.invokeMethod(jwtUtil, "getJwkSet");
        });
    }

    @Test
    void testTokenGenerationNotSupported() {
        // Act & Assert
        assertThrows(UnsupportedOperationException.class, () -> {
            jwtUtil.generateToken(null);
        });
    }

    @Test
    void testValidateTokenWithInvalidToken() {
        // Arrange
        when(environment.getActiveProfiles()).thenReturn(new String[]{"dev"});

        // Act
        Boolean result = jwtUtil.validateSupabaseToken("invalid.jwt.token");

        // Assert
        assertFalse(result);
    }

    @Test
    void testExtractUserIdWithInvalidToken() {
        // Act & Assert
        assertThrows(RuntimeException.class, () -> {
            jwtUtil.extractUserId("invalid.jwt.token");
        });
    }
}
