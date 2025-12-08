package com.tutor_management.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionRecordResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String month;
    private Integer sessions;
    private Integer hours;
    private Long pricePerHour;
    private Long totalAmount;
    private Boolean paid;
    private String paidAt;
    private String notes;
    private String createdAt;
}
