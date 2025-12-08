package com.tutor_management.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyStats {
    private String month;
    private Long totalPaid;
    private Long totalUnpaid;
    private Integer totalSessions;
}
