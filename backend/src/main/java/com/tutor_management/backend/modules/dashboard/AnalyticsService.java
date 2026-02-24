package com.tutor_management.backend.modules.dashboard;

import com.tutor_management.backend.modules.dashboard.dto.response.FinancialAnalyticsResponse;
import com.tutor_management.backend.modules.dashboard.dto.response.PerformanceAnalyticsResponse;
import com.tutor_management.backend.modules.feedback.repository.SessionFeedbackRepository;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final SessionRecordRepository sessionRecordRepository;
    private final TutorRepository tutorRepository;
    private final StudentRepository studentRepository;
    private final SessionFeedbackRepository sessionFeedbackRepository;

    public FinancialAnalyticsResponse getFinancialAnalytics(String month) {
        String targetMonth = (month == null || month.isEmpty()) ? YearMonth.now().toString() : month;

        // 1. Revenue by Tutor
        List<Object[]> tutorRevenueData = sessionRecordRepository.findTopTutorsByRevenue(PageRequest.of(0, 10));
        List<FinancialAnalyticsResponse.TutorRevenueDTO> revenueByTutor = tutorRevenueData.stream()
                .map(row -> {
                    Long tutorId = (Long) row[0];
                    Tutor tutor = tutorRepository.findById(tutorId).orElse(null);
                    Long totalRevenue = (Long) row[1];
                    Double commissionRate = tutor != null ? tutor.getDefaultCommissionRate() : 10.0;
                    return FinancialAnalyticsResponse.TutorRevenueDTO.builder()
                            .tutorId(tutorId)
                            .tutorName(tutor != null ? tutor.getFullName() : "Unknown")
                            .totalRevenue(totalRevenue)
                            .commissionAmount((long) (totalRevenue * (commissionRate / 100)))
                            .sessionCount(((Long) row[2]).intValue())
                            .build();
                })
                .collect(Collectors.toList());

        // 2. Revenue by Tier
        long premiumRevenue = tutorRepository.countBySubscriptionPlan("PREMIUM"); // Placeholder, needs actual revenue aggregation
        long basicRevenue = tutorRepository.countBySubscriptionPlan("BASIC");

        List<FinancialAnalyticsResponse.TierRevenueDTO> revenueByTier = List.of(
                FinancialAnalyticsResponse.TierRevenueDTO.builder().tier("PREMIUM").totalRevenue(premiumRevenue * 1000000).activeTutors((int) premiumRevenue).build(),
                FinancialAnalyticsResponse.TierRevenueDTO.builder().tier("BASIC").totalRevenue(basicRevenue * 200000).activeTutors((int) basicRevenue).build()
        );

        // 3. Payment Status
        Long paid = sessionRecordRepository.sumTotalPaidByMonth(targetMonth);
        Long unpaid = sessionRecordRepository.sumTotalUnpaidByMonth(targetMonth);
        paid = paid != null ? paid : 0L;
        unpaid = unpaid != null ? unpaid : 0L;
        long total = paid + unpaid;

        FinancialAnalyticsResponse.PaymentStatusStats paymentStatus = FinancialAnalyticsResponse.PaymentStatusStats.builder()
                .paidAmount(paid)
                .pendingAmount(unpaid)
                .overdueAmount(0L) // Needs due date logic in SessionRecord
                .collectionRate(total > 0 ? (double) paid / total : 0.0)
                .build();

        // 4. Commission Stats
        long totalCommission = revenueByTutor.stream().mapToLong(FinancialAnalyticsResponse.TutorRevenueDTO::getCommissionAmount).sum();
        FinancialAnalyticsResponse.CommissionStats commission = FinancialAnalyticsResponse.CommissionStats.builder()
                .totalCommission(totalCommission)
                .expectedCommission(totalCommission) // Simplified
                .averageCommissionRate(10.0)
                .build();

        return FinancialAnalyticsResponse.builder()
                .revenueByTutor(revenueByTutor)
                .revenueByTier(revenueByTier)
                .paymentStatus(paymentStatus)
                .commission(commission)
                .build();
    }

    public PerformanceAnalyticsResponse getPerformanceAnalytics() {
        // 1. Tutor Rankings (Average Rating)
        List<Object[]> ratingsData = sessionFeedbackRepository.findAverageRatingsByTutor();
        Map<Long, Double> ratingsMap = ratingsData.stream()
                .collect(Collectors.toMap(row -> (Long) row[0], row -> (Double) row[1]));

        List<Tutor> allTutors = tutorRepository.findAll();
        List<PerformanceAnalyticsResponse.TutorPerformanceDTO> tutorRankings = allTutors.stream()
                .map(t -> {
                    Double avgRating = ratingsMap.getOrDefault(t.getId(), 0.0);
                    return PerformanceAnalyticsResponse.TutorPerformanceDTO.builder()
                            .tutorId(t.getId())
                            .tutorName(t.getFullName())
                            .averageRating(avgRating)
                            .totalSessions(0) // Needs session aggregation
                            .studentCount(0) // Needs student aggregation
                            .completionRate(0.85) // Placeholder
                            .build();
                })
                .sorted((a, b) -> b.getAverageRating().compareTo(a.getAverageRating()))
                .limit(10)
                .collect(Collectors.toList());

        // 2. Growth Metrics
        PerformanceAnalyticsResponse.GrowthMetrics growth = PerformanceAnalyticsResponse.GrowthMetrics.builder()
                .newStudents(10) // Placeholder
                .lostStudents(2)
                .netGrowthRate(0.08)
                .build();

        // 3. Attendance
        PerformanceAnalyticsResponse.AttendanceStats attendance = PerformanceAnalyticsResponse.AttendanceStats.builder()
                .globalCompletionRate(0.92)
                .totalCompleted(150)
                .totalCancelled(12)
                .build();

        return PerformanceAnalyticsResponse.builder()
                .tutorRankings(tutorRankings)
                .growth(growth)
                .attendance(attendance)
                .build();
    }
}
