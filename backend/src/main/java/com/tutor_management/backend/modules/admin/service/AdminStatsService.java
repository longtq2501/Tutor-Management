package com.tutor_management.backend.modules.admin.service;

import com.tutor_management.backend.modules.admin.dto.response.ActivityLogResponse;
import com.tutor_management.backend.modules.admin.dto.response.MonthlyRevenueResponse;
import com.tutor_management.backend.modules.admin.dto.response.OverviewStatsResponse;
import com.tutor_management.backend.modules.admin.dto.response.StudentGrowthResponse;
import com.tutor_management.backend.modules.admin.dto.response.TopTutorResponse;
import com.tutor_management.backend.modules.admin.entity.ActivityLog;
import com.tutor_management.backend.modules.admin.repository.ActivityLogRepository;
import com.tutor_management.backend.modules.finance.dto.response.MonthlyStats;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import com.tutor_management.backend.util.FormatterUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for admin statistics and activity logging.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AdminStatsService {

    private final TutorRepository tutorRepository;
    private final StudentRepository studentRepository;
    private final SessionRecordRepository sessionRecordRepository;
    private final ActivityLogRepository activityLogRepository;

    /**
     * Get an overview of key statistics for the admin dashboard.
     * @return OverviewStatsResponse containing various counts and financial metrics.
     */
    public OverviewStatsResponse getOverviewStats() {
        String currentMonth = YearMonth.now().toString();

        long totalTutors = tutorRepository.count();
        long activeTutors = tutorRepository.countBySubscriptionStatus("ACTIVE");
        long inactiveTutors = tutorRepository.countBySubscriptionStatus("EXPIRED");
        long suspendedTutors = 0; // Suspend logic might depend on user.enabled, but we use status for now

        long totalStudents = studentRepository.count();
        long activeStudents = studentRepository.countByActiveTrue();

        long proAccounts = tutorRepository.countBySubscriptionPlan("PREMIUM");
        long freeAccounts = tutorRepository.countBySubscriptionPlan("BASIC");

        Long totalPaid = sessionRecordRepository.sumTotalPaid();
        Long totalPaidMonth = sessionRecordRepository.sumTotalPaidByMonth(currentMonth);
        Long totalUnpaid = sessionRecordRepository.sumTotalUnpaid();
        Long totalUnpaidMonth = sessionRecordRepository.sumTotalUnpaidByMonth(currentMonth);
        
        long totalRevenue = sessionRecordRepository.sumNonCancelledTotalAmount();
        long totalSessions = sessionRecordRepository.countNonCancelledSessions();

        return OverviewStatsResponse.builder()
                .totalTutors(totalTutors)
                .activeTutors(activeTutors)
                .inactiveTutors(inactiveTutors)
                .suspendedTutors(suspendedTutors)
                .totalStudents(totalStudents)
                .activeStudents(activeStudents)
                .totalRevenueThisMonth(FormatterUtils.formatCurrency(totalPaidMonth != null ? totalPaidMonth : 0L))
                .totalRevenueAllTime(FormatterUtils.formatCurrency(totalPaid != null ? totalPaid : 0L))
                .totalDebtThisMonth(FormatterUtils.formatCurrency(totalUnpaidMonth != null ? totalUnpaidMonth : 0L))
                .totalDebtAllTime(FormatterUtils.formatCurrency(totalUnpaid != null ? totalUnpaid : 0L))
                .totalRevenue(totalRevenue)
                .totalDebt(totalUnpaid != null ? totalUnpaid : 0L)
                .totalSessions(totalSessions)
                .proAccounts(proAccounts)
                .freeAccounts(freeAccounts)
                .pendingIssues(0) // Default for now
                .build();
    }

    /**
     * Get monthly revenue data for the past N months.
     * @param months Number of months to retrieve data for.
     * @return List of MonthlyRevenueResponse containing month and total revenue.
     */
    public List<MonthlyRevenueResponse> getMonthlyRevenue(int months) {
        List<MonthlyStats> stats = sessionRecordRepository.findAllMonthlyStatsAggregated();
        
        return stats.stream()
                .limit(months)
                .map(s -> MonthlyRevenueResponse.builder()
                        .month(s.getMonth())
                        .totalRevenue(s.getTotalPaid())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get student growth data by month.
     * @return List of StudentGrowthResponse containing month and student count.
     */
    public List<StudentGrowthResponse> getStudentGrowth() {
        List<Object[]> results = studentRepository.countByMonth();
        return results.stream()
                .map(r -> StudentGrowthResponse.builder()
                        .month((String) r[0])
                        .count((Long) r[1])
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Get top tutors by revenue.
     * @param limit Number of top tutors to retrieve.
     * @return List of TopTutorResponse containing tutor details and revenue.
     */
    public List<TopTutorResponse> getTopTutors(int limit) {
        List<Object[]> results = sessionRecordRepository.findTopTutorsByRevenue(org.springframework.data.domain.PageRequest.of(0, limit));
        return results.stream()
                .map(r -> {
                    Long tutorId = (Long) r[0];
                    String name = tutorRepository.findById(tutorId)
                            .map(Tutor::getFullName)
                            .orElse("Unknown");
                    return TopTutorResponse.builder()
                            .tutorId(tutorId)
                            .tutorName(name)
                            .totalRevenue((Long) r[1])
                            .sessionCount((Long) r[2])
                            .build();
                })
                .collect(Collectors.toList());
    }

    /**
     * Get paginated activity logs for admin review.
     * @param pageable Pagination information.
     * @return Page of ActivityLogResponse containing activity details.
     */
    public Page<ActivityLogResponse> getActivityLogs(Pageable pageable) {
        return activityLogRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    /**
     * Log an admin activity for auditing purposes.
     * @param type Type of activity (e.g., "USER_MANAGEMENT", "FINANCE", etc.).
     * @param actorName Name of the admin performing the action.
     * @param actorRole Role of the admin (e.g., "SUPER_ADMIN", "ADMIN").
     * @param description Detailed description of the activity.
     */
    @Transactional
    public void logActivity(String type, String actorName, String actorRole, String description) {
        ActivityLog log = ActivityLog.builder()
                .type(type)
                .actorName(actorName)
                .actorRole(actorRole)
                .description(description)
                .build();
        activityLogRepository.save(log);
    }

    /**
     * Map an ActivityLog entity to an ActivityLogResponse DTO.
     * @param log ActivityLog entity to map.
     * @return ActivityLogResponse DTO containing log details.
     */
    private ActivityLogResponse mapToResponse(ActivityLog log) {
        return ActivityLogResponse.builder()
                .id(log.getId())
                .type(log.getType())
                .actorName(log.getActorName())
                .actorRole(log.getActorRole())
                .description(log.getDescription())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
