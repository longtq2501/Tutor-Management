package com.tutor_management.backend.modules.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for representing student information in the admin dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStudentResponse {
    private Long id;
    private String name;
    private Long tutorId;
    private String tutorName;
    private String phone;
    private String schedule;
    private Long pricePerHour;
    private Boolean active;
    private Long totalDebt;
    private String createdAt;
    private String avatarUrl;
}
