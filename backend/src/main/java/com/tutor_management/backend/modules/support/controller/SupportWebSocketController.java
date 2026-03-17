package com.tutor_management.backend.modules.support.controller;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.support.dto.request.SupportMessageRequest;
import com.tutor_management.backend.modules.support.dto.response.SupportMessageResponse;
import com.tutor_management.backend.modules.support.service.SupportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * STOMP WebSocket controller for real-time support chat.
 *
 * <p>Client subscribes to {@code /topic/support/{conversationId}} to receive messages.
 * Admin also subscribes to {@code /topic/support/admin/new} for new-message badge updates.
 *
 * <p>Principal name is the userId string, set by {@code WebSocketAuthInterceptor}.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class SupportWebSocketController {

    private final SupportService supportService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    /**
     * Handles a chat message send.
     * Destination: {@code /app/support/{conversationId}/send}
     */
    @MessageMapping("/support/{conversationId}/send")
    public void sendMessage(
            @DestinationVariable Long conversationId,
            @Payload SupportMessageRequest request,
            Principal principal) {

        if (principal == null) {
            log.warn("Support message received without authentication for conversation: {}", conversationId);
            return;
        }

        try {
            Long senderId = Long.parseLong(principal.getName());
            User sender = userRepository.findById(senderId)
                    .orElseThrow(() -> new IllegalStateException("Sender not found: " + senderId));

            String senderRole = sender.getRole().getName();

            SupportMessageResponse response = supportService.sendMessage(
                    conversationId,
                    senderId,
                    senderRole,
                    sender.getFullName(),
                    request.getContent(),
                    request.getType()
            );

            // Broadcast to both user and admin watching this conversation
            messagingTemplate.convertAndSend("/topic/support/" + conversationId, response);

            // Broadcast to admin notification channel when it's a user message
            if (!"ADMIN".equals(senderRole)) {
                messagingTemplate.convertAndSend("/topic/support/admin/new", response);
            }
        } catch (NumberFormatException e) {
            log.error("Invalid userId in principal for conversation {}: {}", conversationId, principal.getName());
        } catch (Exception e) {
            log.error("Error processing support message for conversation {}: {}", conversationId, e.getMessage());
        }
    }
}
