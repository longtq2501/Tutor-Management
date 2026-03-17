package com.tutor_management.backend.modules.support.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * A single chat message inside a {@link SupportConversation}.
 * senderRole is stored as a plain string (TUTOR, STUDENT, ADMIN) for portability.
 */
@Entity
@Table(name = "support_messages", indexes = {
        @Index(name = "idx_sm_conversation", columnList = "conversation_id"),
        @Index(name = "idx_sm_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @Column(name = "sender_id", nullable = false)
    private Long senderId;

    /** TUTOR, STUDENT, or ADMIN. */
    @Column(name = "sender_role", nullable = false, length = 50)
    private String senderRole;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    /** TEXT, BUG_REPORT, or FEATURE_REQUEST. */
    @Builder.Default
    @Column(length = 30)
    private String type = "TEXT";

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
