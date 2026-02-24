package com.tutor_management.backend.modules.tutor.entity;

import com.tutor_management.backend.modules.auth.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity representing a Tutor in the system.
 * Linked strictly OneToOne with a User account.
 */
@Entity
@Table(name = "tutors", indexes = {
    @Index(name = "idx_tutor_user_id", columnList = "user_id"),
    @Index(name = "idx_tutor_email", columnList = "email"),
    @Index(name = "idx_tutor_subscription_status", columnList = "subscriptionStatus")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Tutor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String subscriptionPlan; // e.g., "BASIC", "PREMIUM"

    @Column(nullable = false)
    private String subscriptionStatus; // e.g., "ACTIVE", "EXPIRED"

    @Column(name = "default_commission_rate", nullable = false)
    @Builder.Default
    private Double defaultCommissionRate = 10.0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
