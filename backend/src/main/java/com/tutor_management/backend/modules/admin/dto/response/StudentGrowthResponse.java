package com.tutor_management.backend.modules.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for student growth data.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentGrowthResponse {
    private String month;
    private Long count;
}
