package com.tutor_management.backend.modules.notification.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

/**
 * Fired when a TUTOR or STUDENT sends a new message in a support conversation.
 * Consumed by {@code NotificationListener} to push an SSE notification to online admins.
 */
@Getter
@AllArgsConstructor
@Builder
public class SupportMessageReceivedEvent {

    private final Long conversationId;
    private final Long messageId;
    private final String senderName;
    private final String senderRole;
    private final String previewContent;
}
