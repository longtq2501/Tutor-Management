package com.tutor_management.backend.modules.student.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Comprehensive view of a student record, including billing history and parent contact.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentResponse {
    
    private Long id;
    private String name;
    private String phone;
    private String schedule;
    private Long pricePerHour;
    private String notes;
    private Boolean active;
    
    /**
     * Enrollment month (YYYY-MM).
     */
    private String startMonth;
    
    /**
     * Last month with lesson records (YYYY-MM).
     */
    private String lastActiveMonth;
    
    /**
     * Cumulative count of months with instruction.
     */
    private Integer monthsLearned;
    
    /**
     * Human-readable duration summary (e.g., "Bắt đầu: 01/2024 • 12 tháng").
     */
    private String learningDuration;
    
    private String createdAt;
    
    /**
     * Total tuition amount collected.
     */
    private Long totalPaid;
    
    /**
     * Current outstanding tuition balance.
     */
    private Long totalUnpaid;

    /**
     * Outstanding balance for sessions already taught (COMPLETED or PENDING_PAYMENT).
     */
    private Long totalUnpaidTaught;

    // --- Parent Information ---
    private Long parentId;
    private String parentName;
    private String parentEmail;
    private String parentPhone;

    // --- Account Information ---
    private String accountEmail;
    private String accountId;
    private String avatarUrl;
}
