package com.tutor_management.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private Integer totalStudents;
    private Long totalPaidAllTime;
    private Long totalUnpaidAllTime;
    private Long currentMonthTotal;
    private Long currentMonthUnpaid;
}
