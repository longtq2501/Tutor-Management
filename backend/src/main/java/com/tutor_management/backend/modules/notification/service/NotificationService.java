package com.tutor_management.backend.modules.notification.service;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.notification.dto.response.NotificationResponse;
import com.tutor_management.backend.modules.notification.entity.Notification;
import com.tutor_management.backend.modules.notification.enums.NotificationType;
import com.tutor_management.backend.modules.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Business service for managing user notifications.
 * 
 * Handles persistence of notification records and facilitates real-time
 * delivery via the SSE (Server-Sent Events) subsystem.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SseEmittersManager sseEmittersManager;

    /**
     * Retrieves all notifications for a specific user, sorted by date descending.
     * @param userId Internal ID of the recipient user
     * @return List of formatted notification responses
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> getNotifications(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Unified method to create a new notification, persist it, and broadcast it 
     * to the user's active SSE connection if available.
     * 
     * @param recipient The targeted user entity
     * @param title Short summary of the notification
     * @param content Full message body
     * @param type Categorization for UI display
     */
    @Transactional
    public void createAndSend(User recipient, String title, String content, NotificationType type) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .title(title)
                .content(content)
                .type(type)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Persisted {} notification for user {}", type, recipient.getId());
        
        // Asynchronous delivery attempt via SSE (best effort)
        sseEmittersManager.send(recipient.getId(), mapToResponse(saved));
    }

    /**
     * Counts the current number of unviewed notifications for a user.
     * @param userId The recipient user ID
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    /**
     * Updates a specific notification's status to 'read'.
     * Ownership check is performed before update.
     * 
     * @param notificationId ID of the notification to update
     * @param userId ID of the user performing the action (for validation)
     */
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            if (notification.getRecipient().getId().equals(userId)) {
                notification.setRead(true);
                notificationRepository.save(notification);
                log.debug("Marked notification {} as read for user {}", notificationId, userId);
            }
        });
    }

    /**
     * Batch updates all unread notifications for a user to 'read'.
     * @param userId The targeted user ID
     */
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndIsReadOrderByCreatedAtDesc(userId, false);
        if (!unread.isEmpty()) {
            unread.forEach(n -> n.setRead(true));
            notificationRepository.saveAll(unread);
            log.info("Batch marked {} notifications as read for user {}", unread.size(), userId);
        }
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .content(notification.getContent())
                .isRead(notification.isRead())
                .type(notification.getType())
                .createdAt(notification.getCreatedAt().toInstant(ZoneOffset.UTC))
                .build();
    }
}
