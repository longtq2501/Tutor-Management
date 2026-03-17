package com.tutor_management.backend.modules.support.service.impl;

import com.tutor_management.backend.exception.ResourceNotFoundException;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.notification.event.SupportMessageReceivedEvent;
import com.tutor_management.backend.modules.support.dto.response.SupportConversationResponse;
import com.tutor_management.backend.modules.support.dto.response.SupportMessageResponse;
import com.tutor_management.backend.modules.support.entity.SupportConversation;
import com.tutor_management.backend.modules.support.entity.SupportMessage;
import com.tutor_management.backend.modules.support.repository.SupportConversationRepository;
import com.tutor_management.backend.modules.support.repository.SupportMessageRepository;
import com.tutor_management.backend.modules.support.service.SupportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class SupportServiceImpl implements SupportService {

    private final SupportConversationRepository conversationRepo;
    private final SupportMessageRepository messageRepo;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    // ─── Read ─────────────────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<SupportMessageResponse> getMessages(Long conversationId, int page, int size) {
        return messageRepo.findByConversationIdOrderByCreatedAtAsc(
                        conversationId, PageRequest.of(page, size))
                .stream()
                .map(this::mapMessageToResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SupportConversationResponse> getAllConversations() {
        return conversationRepo.findAllByOrderByLastMessageAtDesc()
                .stream()
                .map(this::mapConversationToResponse)
                .toList();
    }

    // ─── Write ────────────────────────────────────────────────────────────────

    @Override
    @Transactional
    public SupportConversationResponse getOrCreateConversation(Long userId) {
        SupportConversation conv = conversationRepo.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
                    return conversationRepo.save(SupportConversation.builder()
                            .userId(userId)
                            .userName(user.getFullName())
                            .userRole(user.getRole().getName())
                            .build());
                });
        return mapConversationToResponse(conv);
    }

    @Override
    @Transactional
    public SupportMessageResponse sendMessage(Long conversationId, Long senderId,
                                               String senderRole, String senderName,
                                               String content, String type) {
        SupportConversation conv = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));

        SupportMessage message = SupportMessage.builder()
                .conversationId(conversationId)
                .senderId(senderId)
                .senderRole(senderRole)
                .content(content)
                .type(type != null ? type : "TEXT")
                .build();

        SupportMessage saved = messageRepo.save(message);

        // ─── Update conversation metadata ─────────────────────────────────
        conv.setLastMessageAt(LocalDateTime.now());

        if (!"ADMIN".equals(senderRole)) {
            conv.setUnreadCountAdmin(conv.getUnreadCountAdmin() + 1);

            // Notify online admins via SSE
            String preview = content.length() > 80 ? content.substring(0, 80) + "…" : content;
            eventPublisher.publishEvent(SupportMessageReceivedEvent.builder()
                    .conversationId(conversationId)
                    .messageId(saved.getId())
                    .senderName(senderName)
                    .senderRole(senderRole)
                    .previewContent(preview)
                    .build());
        }

        conversationRepo.save(conv);

        return mapMessageToResponse(saved, senderName);
    }

    @Override
    @Transactional
    public void markAsRead(Long conversationId) {
        SupportConversation conv = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));
        conv.setUnreadCountAdmin(0);
        conversationRepo.save(conv);
        messageRepo.markAllAsReadByConversationId(conversationId);
    }

    @Override
    @Transactional
    public SupportConversationResponse updateStatus(Long conversationId, String status) {
        SupportConversation conv = conversationRepo.findById(conversationId)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation not found: " + conversationId));
        conv.setStatus(status);
        return mapConversationToResponse(conversationRepo.save(conv));
    }

    // ─── Mapping ──────────────────────────────────────────────────────────────

    private SupportMessageResponse mapMessageToResponse(SupportMessage msg) {
        // senderName lookup only when we don't already have it (history load path)
        String name = userRepository.findById(msg.getSenderId())
                .map(User::getFullName)
                .orElse("Unknown");
        return mapMessageToResponse(msg, name);
    }

    private SupportMessageResponse mapMessageToResponse(SupportMessage msg, String senderName) {
        return SupportMessageResponse.builder()
                .id(msg.getId())
                .conversationId(msg.getConversationId())
                .senderId(msg.getSenderId())
                .senderRole(msg.getSenderRole())
                .senderName(senderName)
                .content(msg.getContent())
                .type(msg.getType())
                .isRead(msg.getIsRead())
                .createdAt(msg.getCreatedAt())
                .build();
    }

    private SupportConversationResponse mapConversationToResponse(SupportConversation conv) {
        SupportMessageResponse lastMsg = messageRepo
                .findTop1ByConversationIdOrderByCreatedAtDesc(conv.getId())
                .stream()
                .map(this::mapMessageToResponse)
                .findFirst()
                .orElse(null);

        return SupportConversationResponse.builder()
                .id(conv.getId())
                .userId(conv.getUserId())
                .userName(conv.getUserName())
                .userRole(conv.getUserRole())
                .status(conv.getStatus())
                .unreadCountAdmin(conv.getUnreadCountAdmin())
                .lastMessageAt(conv.getLastMessageAt())
                .lastMessage(lastMsg)
                .build();
    }
}
