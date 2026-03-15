package com.tutor_management.backend.modules.student.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight summary of a student record for list views.
 * Reduces memory usage and response payload by excluding detailed histories and notes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentSummaryResponse {
    
    private Long id;
    private String name;
    private String phone;
    private String schedule;
    private Long pricePerHour;
    private Boolean active;
    
    /**
     * Total tuition amount collected.
     */
    private Long totalPaid;

    /**
     * Current outstanding tuition balance.
     * Calculated value, not stored directly in the student table.
     */
    private Long totalUnpaid;

    /**
     * Outstanding balance for sessions already taught (COMPLETED or PENDING_PAYMENT).
     */
    private Long totalUnpaidTaught;

    /**
     * Enrollment month (YYYY-MM).
     */
    private String startMonth;

    /**
     * Human-readable duration summary (e.g., "Bắt đầu: 01/2024 • 12 tháng").
     */
    private String learningDuration;

    private String accountId;
    private String accountEmail;

    // --- Parent Information ---
    private Long parentId;
    private String parentName;
    private String parentEmail;
    private String parentPhone;
    private String avatarUrl;
}
