package com.tutor_management.backend.modules.notification.dto.response;

import com.tutor_management.backend.modules.notification.enums.NotificationType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/**
 * Data transfer object for notification information.
 * Used for both REST responses and SSE payloads.
 */
@Data
@Builder
public class NotificationResponse {
    /** Primary ID of the notification */
    private Long id;
    
    /** Short summary text */
    private String title;
    
    /** Full content message */
    private String content;
    
    /** Current read status */
    private boolean isRead;
    
    /** Type for UI icon and color categorization */
    private NotificationType type;
    
    /** Timestamp of when the notification was generated */
    private Instant createdAt;
}
