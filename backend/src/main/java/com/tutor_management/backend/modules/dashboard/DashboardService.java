package com.tutor_management.backend.modules.dashboard;

import java.util.List;
import java.time.YearMonth;
import java.time.LocalDateTime;

import com.tutor_management.backend.modules.dashboard.dto.response.StudentDashboardStats;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;

import com.tutor_management.backend.modules.dashboard.dto.response.DashboardStats;
import com.tutor_management.backend.modules.finance.LessonStatus;
import com.tutor_management.backend.modules.finance.dto.response.MonthlyStats;
import com.tutor_management.backend.modules.document.repository.DocumentRepository;
import com.tutor_management.backend.util.FormatterUtils;

import lombok.RequiredArgsConstructor;

/**
 * Service for calculating and aggregating dashboard metrics.
 * Provides separate logic for tutor/admin and student dashboards.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final StudentRepository studentRepository;
    private final SessionRecordRepository sessionRecordRepository;
    private final DocumentRepository documentRepository;
    private final com.tutor_management.backend.modules.lesson.repository.LessonAssignmentRepository lessonAssignmentRepository;
    private final com.tutor_management.backend.util.SecurityContextUtils securityContextUtils;

    /**
     * Retrieves overall system statistics for a specific month.
     * Includes all-time totals, monthly totals, revenue trends, and new student growth.
     * 
     * @param currentMonth The month to query (YYYY-MM format)
     * @return DashboardStats containing aggregated metrics
     */
    @Cacheable(value = "dashboardStats", key = "{#currentMonth, T(org.springframework.security.core.context.SecurityContextHolder).getContext().getAuthentication().getName()}")
    public DashboardStats getDashboardStats(String currentMonth) {
        Long tutorId = securityContextUtils.getCurrentTutorId();
        
        // 1. Fetch raw financial summary from repository
        DashboardStats stats;
        if (tutorId != null) {
            stats = sessionRecordRepository.getFinanceSummaryByTutorId(currentMonth, tutorId);
        } else {
            stats = sessionRecordRepository.getFinanceSummary(currentMonth);
        }

        if (stats == null) {
            stats = new DashboardStats(0, 0L, 0L, 0L, 0L);
        }

        // Fix: Query actual active students count instead of relying on aggregation
        if (tutorId != null) {
            stats.setTotalStudents((int) studentRepository.countByTutorIdAndActiveTrue(tutorId));
        } else {
            stats.setTotalStudents((int) studentRepository.countByActiveTrue());
        }

        // 2. Format currencies for display
        stats.setTotalPaidAllTime(FormatterUtils.formatCurrency(stats.getTotalPaidRaw()));
        stats.setTotalUnpaidAllTime(FormatterUtils.formatCurrency(stats.getTotalUnpaidRaw()));
        stats.setCurrentMonthTotal(FormatterUtils.formatCurrency(stats.getCurrentMonthTotalRaw()));

        // 3. Calculate revenue growth trend compared to previous month
        calculateRevenueTrend(stats, tutorId, currentMonth);

        // 4. Calculate new student signups for the current month
        calculateNewStudentGrowth(stats, currentMonth, tutorId);

        return stats;
    }

    // Helper method to calculate revenue growth trend compared to previous month
    private void calculateRevenueTrend(DashboardStats stats, Long tutorId, String currentMonth) {
        List<MonthlyStats> monthlyList;
        if (tutorId != null) {
            monthlyList = sessionRecordRepository.findMonthlyStatsAggregatedByTutorId(tutorId);
        } else {
            monthlyList = sessionRecordRepository.findAllMonthlyStatsAggregated();
        }
        
        java.time.YearMonth currentYM = java.time.YearMonth.parse(currentMonth);
        String previousMonth = currentYM.minusMonths(1).toString();

        long currentRevenue = 0;
        long previousRevenue = 0;

        for (MonthlyStats ms : monthlyList) {
            if (currentMonth.equals(ms.getMonth())) {
                currentRevenue = ms.getTotalPaid() + ms.getTotalUnpaid();
            } else if (previousMonth.equals(ms.getMonth())) {
                previousRevenue = ms.getTotalPaid() + ms.getTotalUnpaid();
            }
        }
        
        if (previousRevenue > 0) {
            double growthPercentage = ((double) (currentRevenue - previousRevenue) / previousRevenue) * 100;
            stats.setRevenueTrendValue(Math.abs(Math.round(growthPercentage * 10.0) / 10.0));
            stats.setRevenueTrendDirection(growthPercentage >= 0 ? "up" : "down");
        } else if (currentRevenue > 0) {
            stats.setRevenueTrendValue(100.0);
            stats.setRevenueTrendDirection("up");
        } else {
            stats.setRevenueTrendValue(0.0);
            stats.setRevenueTrendDirection("up");
        }
    }

    // Helper method to calculate new student signups for the current month
    private void calculateNewStudentGrowth(DashboardStats stats, String monthStr, Long tutorId) {
        try {
            YearMonth yearMonth = YearMonth.parse(monthStr);
            LocalDateTime monthStart = yearMonth.atDay(1).atStartOfDay();
            LocalDateTime monthEnd = yearMonth.atEndOfMonth().atTime(23, 59, 59);
            
            if (tutorId != null) {
                stats.setNewStudentsCurrentMonth((int) studentRepository.countByCreatedAtBetweenAndTutorId(monthStart, monthEnd, tutorId));
            } else {
                stats.setNewStudentsCurrentMonth((int) studentRepository.countByCreatedAtBetween(monthStart, monthEnd));
            }
        } catch (Exception e) {
            stats.setNewStudentsCurrentMonth(0);
        }
    }

    /**
     * Retrieves personalized dashboard stats for a student.
     * Includes attendance tracking, financial state, and motivational feedback.
     * 
     * @param studentId Primary ID of the student
     * @param month The month to query (YYYY-MM format)
     * @return StudentDashboardStats for the specified user and period
     */
    public StudentDashboardStats getStudentDashboardStats(Long studentId, String month) {
        // 1. Fetch session records and shared documents
        var records = sessionRecordRepository.findByStudentIdAndMonth(studentId, month);
        
        // Find the tutor for this student to filter shared documents correctly (Multi-tenancy)
        Long studentTutorId = studentRepository.findById(studentId)
                .map(com.tutor_management.backend.modules.student.entity.Student::getTutorId)
                .orElse(null);
                 
        int documentCount = documentRepository.countByStudentIdAndTutor(studentId, studentTutorId).intValue();

        // 2. Aggregate metrics in memory
        int totalSessions = 0;
        int completedSessions = 0;
        double totalHours = 0.0;
        long totalPaid = 0;
        long totalUnpaid = 0;
        long totalAmount = 0;

        for (var record : records) {
            if (isCancelled(record.getStatus())) {
                continue;
            }

            totalSessions++;
            if (isCompleted(record.getStatus())) {
                completedSessions++;
                
                if (record.getHours() != null) {
                    totalHours += record.getHours();
                }
                
                if (record.getTotalAmount() != null) {
                    long amount = record.getTotalAmount();
                    totalAmount += amount;
                    if (Boolean.TRUE.equals(record.getPaid())) {
                        totalPaid += amount;
                    } else {
                        totalUnpaid += amount;
                    }
                }
            }
        }

        // 3. Construct response with gamification elements
        String quote = getMotivationalQuote(completedSessions, totalSessions);
        boolean shouldShowCelebration = totalSessions > 0 && completedSessions == totalSessions;

        // 4. Calculate lesson progress
        long totalLessonsRaw = lessonAssignmentRepository.countByStudentId(studentId);
        long completedLessonsRaw = lessonAssignmentRepository.countByStudentIdAndIsCompletedTrue(studentId);
        double lessonProgressPercentage = totalLessonsRaw > 0 ? (completedLessonsRaw * 100.0 / totalLessonsRaw) : 0.0;

        return StudentDashboardStats.builder()
                .totalSessionsRaw(totalSessions)
                .completedSessionsRaw(completedSessions)
                .totalHoursRaw(totalHours)
                .totalPaidRaw(totalPaid)
                .totalUnpaidRaw(totalUnpaid)
                .totalAmountRaw(totalAmount)
                .totalDocumentsRaw(documentCount)
                .totalLessonsRaw(totalLessonsRaw)
                .completedLessonsRaw(completedLessonsRaw)
                .lessonProgressPercentage(lessonProgressPercentage)
                .totalHoursFormatted(String.format("%.1f giờ", totalHours))
                .totalPaidFormatted(FormatterUtils.formatCurrency(totalPaid))
                .totalUnpaidFormatted(FormatterUtils.formatCurrency(totalUnpaid))
                .totalAmountFormatted(FormatterUtils.formatCurrency(totalAmount))
                .motivationalQuote(quote)
                .showConfetti(shouldShowCelebration)
                .build();
    }

    private boolean isCancelled(LessonStatus status) {
        return status == LessonStatus.CANCELLED_BY_STUDENT ||
                status == LessonStatus.CANCELLED_BY_TUTOR;
    }

    private boolean isCompleted(LessonStatus status) {
        return status == LessonStatus.COMPLETED || status == LessonStatus.PAID;
    }

    // Helper method to generate motivational quotes based on attendance progress
    private String getMotivationalQuote(int completed, int total) {
        if (total == 0) {
            return "Hãy kiểm tra lịch học sắp tới nhé!";
        }
        
        double progressRatio = (double) completed / total;
        if (progressRatio >= 1.0) {
            return "Xuất sắc! Bạn đã hoàn thành tất cả buổi học.";
        }
        if (progressRatio >= 0.8) {
            return "Tuyệt vời! Sắp về đích rồi.";
        }
        if (progressRatio >= 0.5) {
            return "Cố lên! Bạn đã đi được một nửa chặng đường.";
        }
        return "Khởi đầu tốt! Hãy tiếp tục phát huy.";
    }

    /**
     * Retrieves aggregated monthly statistics for financial reporting.
     * Results are cached for 5 minutes to optimize repeated chart rendering.
     * 
     * @return List of MonthlyStats records
     */
    @Cacheable(value = "monthlyStats", key = "T(org.springframework.security.core.context.SecurityContextHolder).getContext().getAuthentication().getName()")
    public List<MonthlyStats> getMonthlyStats() {
        Long tutorId = securityContextUtils.getCurrentTutorId();
        if (tutorId != null) {
            return sessionRecordRepository.findMonthlyStatsAggregatedByTutorId(tutorId);
        }
        return sessionRecordRepository.findAllMonthlyStatsAggregated();
    }
}
