package com.tutor_management.backend.modules.support.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Represents a persistent support thread between one user (TUTOR or STUDENT) and the Admin team.
 * Enforces a 1-conversation-per-user constraint so all messages stay in a single chat.
 */
@Entity
@Table(name = "support_conversations", indexes = {
        @Index(name = "idx_sc_user_id", columnList = "user_id"),
        @Index(name = "idx_sc_status", columnList = "status"),
        @Index(name = "idx_sc_last_message", columnList = "last_message_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK to the user who owns this conversation (TUTOR or STUDENT). */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "user_name")
    private String userName;

    @Column(name = "user_role", length = 50)
    private String userRole;

    /** OPEN or RESOLVED. */
    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "OPEN";

    /** Number of unread messages for the Admin — reset to 0 when Admin opens the conversation. */
    @Builder.Default
    @Column(name = "unread_count_admin", nullable = false)
    private Integer unreadCountAdmin = 0;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
