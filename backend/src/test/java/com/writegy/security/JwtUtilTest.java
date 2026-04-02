package com.writegy.security;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class JwtUtilTest {

    @Test
    void contextLoads() {
        // The old JWKS URL tests have been removed because the application 
        // has been upgraded to use secure symmetric HS256 JWT validation.
        // This placeholder ensures the test context loads successfully.
    }
}