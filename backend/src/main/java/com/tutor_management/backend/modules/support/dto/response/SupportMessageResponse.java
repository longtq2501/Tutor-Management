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
public class SupportMessageResponse {

    private Long id;
    private Long conversationId;
    private Long senderId;
    private String senderRole;
    private String senderName;
    private String content;
    private String type;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
