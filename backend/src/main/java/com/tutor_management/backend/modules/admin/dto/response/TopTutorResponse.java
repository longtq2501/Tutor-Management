package com.tutor_management.backend.modules.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for top tutors based on revenue and session count.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopTutorResponse {
    private Long tutorId;
    private String tutorName;
    private Long totalRevenue;
    private Long sessionCount;
}
