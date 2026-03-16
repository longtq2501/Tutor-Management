package com.tutor_management.backend.modules.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;

/**
 * Repository for managing RefreshToken entities.
 * Provides methods to find, delete, and upsert refresh tokens.
 */
@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    
    Optional<RefreshToken> findByToken(String token);
    
    Optional<RefreshToken> findByUser(User user);
    
    @Modifying
    void deleteByUser(User user);
    
    // NEW: MySQL UPSERT using ON DUPLICATE KEY UPDATE
    @Modifying
    @Query(value = """
        INSERT INTO refresh_tokens (user_id, token, expiry_date, created_at)
        VALUES (:userId, :token, :expiryDate, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
            token = VALUES(token),
            expiry_date = VALUES(expiry_date),
            created_at = CURRENT_TIMESTAMP
        """, nativeQuery = true)
    void upsert(@Param("userId") Long userId,
                @Param("token") String token,
                @Param("expiryDate") Instant expiryDate);
}