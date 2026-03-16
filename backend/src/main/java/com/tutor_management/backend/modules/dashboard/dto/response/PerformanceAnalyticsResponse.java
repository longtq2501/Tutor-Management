package com.tutor_management.backend.modules.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO for performance analytics data to be displayed on the dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceAnalyticsResponse {
    private List<TutorPerformanceDTO> tutorRankings;
    private GrowthMetrics growth;
    private AttendanceStats attendance;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TutorPerformanceDTO {
        private Long tutorId;
        private String tutorName;
        private Double averageRating;
        private Double completionRate;
        private Integer totalSessions;
        private Integer studentCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GrowthMetrics {
        private Integer newStudents;
        private Integer lostStudents; // Churn
        private Double netGrowthRate;
        private List<MonthlyGrowthDTO> monthlyGrowth;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyGrowthDTO {
        private String month;
        private Integer newStudents;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AttendanceStats {
        private Double globalCompletionRate;
        private Integer totalCancelled;
        private Integer totalCompleted;
    }
}
