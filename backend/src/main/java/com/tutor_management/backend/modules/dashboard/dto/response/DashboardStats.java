package com.tutor_management.backend.modules.dashboard.dto.response;

import lombok.*;

/**
 * Aggregate statistics for the system-wide dashboard.
 * Includes financial data, student growth, and revenue trends.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    /** Total number of students registered in the system */
    private Integer totalStudents;

    /** Number of students currently active (đang học) */
    private Integer activeStudents;

    /** Total revenue collected across all time, formatted as currency */
    private String totalPaidAllTime;
    
    /** Total pending revenue across all time, formatted as currency */
    private String totalUnpaidAllTime;
    
    /** Total revenue for the current month (paid + unpaid), formatted as currency */
    private String currentMonthTotal;
    
    /** Raw unpaid amount for the current month */
    private Long currentMonthUnpaid;

    /** Percentage value of the revenue trend compared to previous month */
    private Double revenueTrendValue;
    
    /** Direction of the trend: "up" or "down" */
    private String revenueTrendDirection;

    /** Raw total paid amount for internal calculations or charts */
    private Long totalPaidRaw;
    
    /** Raw total unpaid amount for internal calculations or charts */
    private Long totalUnpaidRaw;
    
    /** Raw total revenue for the current month */
    private Long currentMonthTotalRaw;
    
    /** Number of new students registered in the specified month */
    private Integer newStudentsCurrentMonth;

    /**
     * Standard constructor mapping for JPQL aggregate queries.
     * 
     * @param totalStudents Total student count
     * @param totalPaidRaw Sum of all-time paid amounts
     * @param totalUnpaidRaw Sum of all-time unpaid amounts
     * @param currentMonthTotalRaw Sum of current month total amount
     * @param currentMonthUnpaid Sum of current month unpaid amount
     */
    public DashboardStats(Integer totalStudents, Long totalPaidRaw, Long totalUnpaidRaw, Long currentMonthTotalRaw, Long currentMonthUnpaid) {
        this.totalStudents = totalStudents;
        this.activeStudents = 0;
        this.totalPaidRaw = totalPaidRaw != null ? totalPaidRaw : 0L;
        this.totalUnpaidRaw = totalUnpaidRaw != null ? totalUnpaidRaw : 0L;
        this.currentMonthTotalRaw = currentMonthTotalRaw != null ? currentMonthTotalRaw : 0L;
        this.currentMonthUnpaid = currentMonthUnpaid != null ? currentMonthUnpaid : 0L;
    }
}