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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class AdminStatsService {

    private final TutorRepository tutorRepository;
    private final StudentRepository studentRepository;
    private final SessionRecordRepository sessionRecordRepository;
    private final ActivityLogRepository activityLogRepository;

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
                .totalRevenue(totalRevenue)
                .totalSessions(totalSessions)
                .proAccounts(proAccounts)
                .freeAccounts(freeAccounts)
                .pendingIssues(0) // Default for now
                .build();
    }

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

    public List<StudentGrowthResponse> getStudentGrowth() {
        List<Object[]> results = studentRepository.countByMonth();
        return results.stream()
                .map(r -> StudentGrowthResponse.builder()
                        .month((String) r[0])
                        .count((Long) r[1])
                        .build())
                .collect(Collectors.toList());
    }

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

    public Page<ActivityLogResponse> getActivityLogs(Pageable pageable) {
        return activityLogRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

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
