package com.tutor_management.backend.modules.support.service;

import com.tutor_management.backend.modules.support.dto.response.SupportConversationResponse;
import com.tutor_management.backend.modules.support.dto.response.SupportMessageResponse;

import java.util.List;

public interface SupportService {

    SupportConversationResponse getOrCreateConversation(Long userId);

    SupportMessageResponse sendMessage(Long conversationId, Long senderId,
                                       String senderRole, String senderName,
                                       String content, String type);

    List<SupportMessageResponse> getMessages(Long conversationId, int page, int size);

    List<SupportConversationResponse> getAllConversations();

    void markAsRead(Long conversationId);

    SupportConversationResponse updateStatus(Long conversationId, String status);
}
