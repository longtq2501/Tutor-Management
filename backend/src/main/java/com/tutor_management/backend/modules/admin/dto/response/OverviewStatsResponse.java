package com.tutor_management.backend.modules.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for overview statistics in the admin dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OverviewStatsResponse {
    private long totalTutors;
    private long activeTutors;
    private long inactiveTutors;
    private long suspendedTutors;
    private long totalStudents;
    private long activeStudents;
    private String totalRevenueThisMonth;
    private String totalRevenueAllTime;
    private String totalDebtThisMonth;
    private String totalDebtAllTime;
    private long totalRevenue;
    private long totalDebt;
    private long totalSessions;
    private long proAccounts;
    private long freeAccounts;
    private int pendingIssues;
}
