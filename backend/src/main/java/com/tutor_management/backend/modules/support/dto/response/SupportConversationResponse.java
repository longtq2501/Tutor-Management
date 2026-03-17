package com.tutor_management.backend.modules.support.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportConversationResponse {

    private Long id;
    private Long userId;
    private String userName;
    private String userRole;
    private String status;
    private Integer unreadCountAdmin;
    private LocalDateTime lastMessageAt;

    /** Preview of the last message sent in this conversation. */
    private SupportMessageResponse lastMessage;
}
