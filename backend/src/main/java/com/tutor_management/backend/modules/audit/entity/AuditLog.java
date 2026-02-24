package com.tutor_management.backend.modules.audit.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entity for tracking security-sensitive actions and system changes.
 */
@Entity
@Table(name = "audit_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action; // e.g., "USER_LOGIN", "ROLE_UPDATE", "PERMISSION_DENIED"

    @Column(nullable = false)
    private String actorId; // ID of the user who performed the action

    @Column(nullable = false)
    private String actorName;

    @Column(nullable = false)
    private String actorRole;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(columnDefinition = "JSON")
    private String metadata; // Additional structured context

    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
