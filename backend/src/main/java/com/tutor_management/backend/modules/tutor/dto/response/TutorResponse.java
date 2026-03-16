package com.tutor_management.backend.modules.tutor.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TutorResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String subscriptionPlan;
    private String subscriptionStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String avatarUrl;
}
