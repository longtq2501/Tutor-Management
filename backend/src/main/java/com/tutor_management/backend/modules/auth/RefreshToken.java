package com.tutor_management.backend.modules.auth;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Represents a refresh token for user authentication.
 * Each user can have multiple refresh tokens to support multi-device login.
 * The token is associated with a user and has an expiry date.
 */
@Entity
@Table(name = "refresh_tokens",
       uniqueConstraints = @UniqueConstraint(columnNames = "user_id")) // Ensure one active token per user, can be relaxed for multi-device support
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    // ✅ CHANGE: @ManyToOne instead of @OneToOne to support future multi-device
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Instant expiryDate;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
    }
}