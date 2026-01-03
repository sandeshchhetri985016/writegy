package com.writegy.security;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.RSASSAVerifier;
import com.nimbusds.jose.jwk.JWK;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.net.URL;
import java.security.interfaces.RSAPublicKey;
import java.text.ParseException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${jwt.validation.strict:false}")
    private boolean strictValidation;

    private JWKSet jwkSet;
    private final Environment environment;

    public JwtUtil(Environment environment) {
        this.environment = environment;
        // Initialize JWK set for Supabase JWT validation
        // Note: This will be loaded lazily when first needed to avoid startup issues
    }

    private boolean isProductionProfile() {
        String[] activeProfiles = environment.getActiveProfiles();
        for (String profile : activeProfiles) {
            if (profile.equalsIgnoreCase("prod") || profile.equalsIgnoreCase("production")) {
                return true;
            }
        }
        return false;
    }

    private JWKSet getJwkSet() {
        // Skip JWK loading in test environment
        if (isTestProfile()) {
            System.out.println("Test environment detected - skipping JWK loading");
            return null;
        }

        if (jwkSet == null) {
            try {
                if (supabaseUrl == null || supabaseUrl.trim().isEmpty()) {
                    throw new RuntimeException("Supabase URL is not configured");
                }
                // Try the correct Supabase JWK endpoint
                URL jwkUrl = new URL(supabaseUrl + "/auth/v1/.well-known/jwks.json");
                this.jwkSet = JWKSet.load(jwkUrl);
                System.out.println("Successfully loaded Supabase JWK set from: " + jwkUrl);
            } catch (Exception e) {
                // Log the error but don't throw exception to allow requests to continue
                // This allows the system to work even if JWK loading fails temporarily
                System.err.println("Failed to load Supabase JWK set: " + e.getMessage());
                System.err.println("Supabase URL: " + supabaseUrl);

                // In production with strict validation, we want to fail loudly
                if (isProductionProfile() && (strictValidation || isProductionProfile())) {
                    throw new RuntimeException("PRODUCTION SECURITY: JWK endpoint is required but not accessible. Authentication disabled for security.", e);
                }

                // Return null to indicate JWK set is not available
                return null;
            }
        }
        return jwkSet;
    }

    private boolean isTestProfile() {
        String[] activeProfiles = environment.getActiveProfiles();
        for (String profile : activeProfiles) {
            if (profile.equalsIgnoreCase("test")) {
                return true;
            }
        }
        return false;
    }

    public String extractUsername(String token) {
        try {
            JWTClaimsSet claims = getClaimsFromToken(token);
            // Supabase JWT tokens use "email" claim for user identification
            String email = claims.getStringClaim("email");
            return email != null ? email : claims.getSubject();
        } catch (ParseException e) {
            throw new RuntimeException("Failed to extract username from token", e);
        }
    }

    public Date extractExpiration(String token) {
        try {
            JWTClaimsSet claims = getClaimsFromToken(token);
            return claims.getExpirationTime();
        } catch (ParseException e) {
            throw new RuntimeException("Failed to extract expiration from token", e);
        }
    }

    public <T> T extractClaim(String token, Function<JWTClaimsSet, T> claimsResolver) {
        try {
            final JWTClaimsSet claims = getClaimsFromToken(token);
            return claimsResolver.apply(claims);
        } catch (ParseException e) {
            throw new RuntimeException("Failed to extract claim from token", e);
        }
    }

    private JWTClaimsSet getClaimsFromToken(String token) throws ParseException {
        try {
            SignedJWT signedJWT = SignedJWT.parse(token);
            
            // Try to validate with JWK set first
            JWKSet jwkSet = getJwkSet();
            if (jwkSet != null) {
                // Get the key ID from the token header
                String keyId = signedJWT.getHeader().getKeyID();
                
                // Find the matching JWK
                JWK jwk = jwkSet.getKeyByKeyId(keyId);
                if (jwk != null) {
                    // Convert JWK to RSA public key
                    RSAKey rsaKey = jwk.toRSAKey();
                    if (rsaKey != null) {
                        RSAPublicKey publicKey = rsaKey.toRSAPublicKey();
                        JWSVerifier verifier = new RSASSAVerifier(publicKey);

                        // Verify the token signature
                        if (signedJWT.verify(verifier)) {
                            System.out.println("JWT signature verified successfully for key ID: " + keyId);
                            return signedJWT.getJWTClaimsSet();
                        } else {
                            System.err.println("SECURITY WARNING: JWT signature verification failed for key ID: " + keyId);
                            
                            // In production with strict validation, fail on signature verification failure
                            if (isProductionProfile() && (strictValidation || isProductionProfile())) {
                                throw new RuntimeException("PRODUCTION SECURITY: JWT signature verification failed. Authentication rejected.", null);
                            }
                        }
                    }
                } else {
                    System.err.println("SECURITY WARNING: No matching JWK found for key ID: " + keyId);
                    
                    // In production with strict validation, fail on missing key
                    if (isProductionProfile() && (strictValidation || isProductionProfile())) {
                        throw new RuntimeException("PRODUCTION SECURITY: JWT signing key not found. Authentication rejected.", null);
                    }
                }
            } else {
                System.err.println("SECURITY WARNING: JWK set is not available");
                
                // In production with strict validation, fail when JWK set is unavailable
                if (isProductionProfile() && (strictValidation || isProductionProfile())) {
                    throw new RuntimeException("PRODUCTION SECURITY: JWK set not available. Authentication rejected.", null);
                }
            }
            
            // If JWK validation fails or is not available, check if we should allow fallback
            boolean allowFallback = !isProductionProfile() && !strictValidation;
            
            if (allowFallback) {
                // This allows the system to work in development or when JWK endpoint is not accessible
                System.err.println("Warning: Falling back to unvalidated JWT claims extraction (DEVELOPMENT/DEBUG MODE ONLY)");
                return signedJWT.getJWTClaimsSet();
            } else {
                // In production or strict mode, don't allow fallback
                throw new RuntimeException("SECURITY: JWT validation failed and fallback is disabled in production/strict mode", null);
            }
            
        } catch (com.nimbusds.jose.JOSEException e) {
            // If signature verification fails, check if we should allow fallback
            boolean allowFallback = !isProductionProfile() && !strictValidation;
            
            if (allowFallback) {
                // This allows the system to work in development or when JWK endpoint is not accessible
                System.err.println("Warning: JWT signature verification failed, extracting claims anyway (DEVELOPMENT/DEBUG MODE ONLY): " + e.getMessage());
                try {
                    SignedJWT signedJWT = SignedJWT.parse(token);
                    return signedJWT.getJWTClaimsSet();
                } catch (ParseException pe) {
                    throw new RuntimeException("Failed to extract claims from JWT", pe);
                }
            } else {
                // In production or strict mode, don't allow fallback on JOSE exceptions
                throw new RuntimeException("PRODUCTION SECURITY: JWT signature verification failed with JOSE exception. Authentication rejected.", e);
            }
        }
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Note: We don't generate tokens anymore since we're using Supabase
    public String generateToken(UserDetails userDetails) {
        throw new UnsupportedOperationException("Token generation is not supported. Use Supabase authentication.");
    }

    // Note: We don't create custom tokens anymore
    private String createToken(Map<String, Object> claims, String subject) {
        throw new UnsupportedOperationException("Token creation is not supported. Use Supabase authentication.");
    }

    public Boolean validateToken(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
        } catch (Exception e) {
            // In production or strict mode, log validation failures for security monitoring
            if (isProductionProfile() || strictValidation) {
                System.err.println("PRODUCTION SECURITY: Token validation failed - " + e.getMessage());
            }
            return false;
        }
    }

    // New method to validate Supabase JWT without user details (for initial validation)
    public Boolean validateSupabaseToken(String token) {
        try {
            getClaimsFromToken(token);
            return !isTokenExpired(token);
        } catch (Exception e) {
            // In production or strict mode, log validation failures for security monitoring
            if (isProductionProfile() || strictValidation) {
                System.err.println("PRODUCTION SECURITY: Supabase token validation failed - " + e.getMessage());
            }
            return false;
        }
    }

    // Get user ID from Supabase token
    public String extractUserId(String token) {
        try {
            JWTClaimsSet claims = getClaimsFromToken(token);
            return claims.getStringClaim("sub");
        } catch (ParseException e) {
            throw new RuntimeException("Failed to extract user ID from token", e);
        }
    }
}
