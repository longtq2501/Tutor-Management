package com.tutor_management.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private String createdAt;
    private Long totalPaid;
    private Long totalUnpaid;
}
