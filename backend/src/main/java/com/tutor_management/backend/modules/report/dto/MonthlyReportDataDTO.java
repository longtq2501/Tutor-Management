package com.tutor_management.backend.modules.report.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
public class MonthlyReportDataDTO {

    private String studentName;
    private String tutorName;
    private Integer month;
    private Integer year;

    private Integer totalSessions;
    private Integer attendedSessions;
    private Integer absentSessions;
    private Double attendanceRate;

    private Integer totalAssessments;
    private Double averageScore;
    private Double previousMonthAvgScore;
    private Double scoreImprovement;
    private List<AssessmentSummary> assessments;

    private List<SessionFeedback> sessionFeedbacks;

    private Long totalFee;
    private Long paidAmount;
    private Long remainingAmount;
    private String paymentStatus;

    private String tutorComment;

    @Data
    @Builder
    public static class AssessmentSummary {
        private String title;
        private Double score;
        private Double maxScore;
        private LocalDate date;
    }

    @Data
    @Builder
    public static class SessionFeedback {
        private LocalDate sessionDate;
        private String feedback;
    }
}
