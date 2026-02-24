package com.tutor_management.backend.modules.onlinesession.security;


import com.tutor_management.backend.modules.onlinesession.exception.InvalidTokenException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;
import java.util.Base64;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("RoomTokenService Unit Tests")
class RoomTokenServiceTest {

    private RoomTokenService roomTokenService;
    private final String testSecret = Base64.getEncoder().encodeToString(
            "test-secret-key-min-256-bits-long-for-hs256-algorithm".getBytes()
        );
    @BeforeEach
    void setUp() {
        roomTokenService = new RoomTokenService();

        ReflectionTestUtils.setField(roomTokenService, "secretKey", testSecret);
        ReflectionTestUtils.setField(roomTokenService, "jwtExpiration", 300000L);
    }

    @Test
    @DisplayName("Should generate a valid token with correct claims")
    void generateToken_Success() {
        // Given
        String roomId = "room-123";
        Long userId = 1L;
        String role = "TUTOR";

        // When
        String token = roomTokenService.generateToken(roomId, userId, role);

        // Then
        assertNotNull(token);

        Claims claims = Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        assertEquals(userId.toString(), claims.getSubject());
        assertEquals(roomId, claims.get("roomId"));
        assertEquals(userId.intValue(), ((Number) claims.get("userId")).intValue());
        assertEquals(role, claims.get("role"));
        
        Date exp = claims.getExpiration();
        assertTrue(exp.after(new Date()));
        // Expiration should be roughly now + 5 mins
        long diff = exp.getTime() - System.currentTimeMillis();
        assertTrue(diff > 0 && diff <= 300000);
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(testSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    @Test
    @DisplayName("Should validate token successfully")
    void validateToken_Success() {
        // Given
        String roomId = "room-123";
        Long userId = 1L;
        String role = "TUTOR";
        String token = roomTokenService.generateToken(roomId, userId, role);

        // When
        Claims claims = roomTokenService.validateToken(token);

        // Then
        assertNotNull(claims);
        assertEquals(roomId, claims.get("roomId"));
        assertEquals(userId.intValue(), ((Number) claims.get("userId")).intValue());
    }

    @Test
    @DisplayName("Should throw InvalidTokenException for invalid signature")
    void validateToken_InvalidSignature() {
        // Given
        String fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

        // When/Then
        assertThrows(InvalidTokenException.class, () -> roomTokenService.validateToken(fakeToken));
    }

    @Test
    @DisplayName("Should throw InvalidTokenException for expired token")
    void validateToken_ExpiredToken() throws InterruptedException {
        // Given
        ReflectionTestUtils.setField(roomTokenService, "jwtExpiration", 1L); // ✅ Keep 1L
        String token = roomTokenService.generateToken("room-123", 1L, "TUTOR");
        Thread.sleep(10); // Wait for token to expire

        // When/Then
        assertThrows(InvalidTokenException.class, () -> roomTokenService.validateToken(token));

        // Cleanup
        ReflectionTestUtils.setField(roomTokenService, "jwtExpiration", 300000L); // ✅ Change to 300000L
    }

    @Test
    @DisplayName("Should extract roomId correctly")
    void extractRoomId_Success() {
        // Given
        String roomId = "room-abc-123";
        String token = roomTokenService.generateToken(roomId, 1L, "TUTOR");

        // When
        String extractedRoomId = roomTokenService.extractRoomId(token);

        // Then
        assertEquals(roomId, extractedRoomId);
    }

    @Test
    @DisplayName("Should extract userId correctly")
    void extractUserId_Success() {
        // Given
        Long userId = 42L;
        String token = roomTokenService.generateToken("room-123", userId, "STUDENT");

        // When
        Long extractedUserId = roomTokenService.extractUserId(token);

        // Then
        assertEquals(userId, extractedUserId);
    }

    @Test
    @DisplayName("Should extract role correctly")
    void extractRole_Success() {
        // Given
        String role = "ADMIN";
        String token = roomTokenService.generateToken("room-123", 1L, role);

        // When
        String extractedRole = roomTokenService.extractRole(token);

        // Then
        assertEquals(role, extractedRole);
    }

    @Test
    @DisplayName("Should detect expired token")
    void isTokenExpired_ExpiredToken() throws InterruptedException {
        // Given
        ReflectionTestUtils.setField(roomTokenService, "jwtExpiration", 1L);
        String token = roomTokenService.generateToken("room-123", 1L, "TUTOR");
        Thread.sleep(10);

        // When
        boolean isExpired = roomTokenService.isTokenExpired(token);

        // Then
        assertTrue(isExpired);

        // Cleanup
        ReflectionTestUtils.setField(roomTokenService, "jwtExpiration", 300000L); // ✅ Change to 300000L
    }

    @Test
    @DisplayName("Should detect valid token as not expired")
    void isTokenExpired_ValidToken() {
        // Given
        String token = roomTokenService.generateToken("room-123", 1L, "TUTOR");

        // When
        boolean isExpired = roomTokenService.isTokenExpired(token);

        // Then
        assertFalse(isExpired);
    }
}
