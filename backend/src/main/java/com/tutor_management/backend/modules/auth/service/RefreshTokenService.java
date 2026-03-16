package com.tutor_management.backend.modules.auth.service;

import com.tutor_management.backend.modules.auth.RefreshToken;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.exception.TokenRefreshException;
import com.tutor_management.backend.modules.auth.RefreshTokenRepository;
import com.tutor_management.backend.modules.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing refresh tokens.
 * <p>
 * This service provides methods to create, verify, and delete refresh tokens.
 * It ensures that token creation is atomic and handles token expiration properly.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${jwt.refresh-expiration}")
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    // Creates or updates a refresh token for the given user ID
    @Transactional
    public RefreshToken createRefreshToken(Long userId) {
        String token = UUID.randomUUID().toString();
        Instant expiryDate = Instant.now().plusMillis(refreshTokenDurationMs);

        // ATOMIC: Single database operation, no race condition possible
        refreshTokenRepository.upsert(userId, token, expiryDate);

        // Return the created/updated token
        return refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Failed to create refresh token"));
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            refreshTokenRepository.delete(token);
            throw new TokenRefreshException(token.getToken(),
                    "Refresh token was expired. Please make a new signin request");
        }
        return token;
    }

    // Deletes all refresh tokens associated with a user
    @Transactional
    public void deleteByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        refreshTokenRepository.deleteByUser(user);
    }
}