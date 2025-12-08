package com.tutor_management.backend.service;

import com.tutor_management.backend.dto.response.DashboardStats;
import com.tutor_management.backend.dto.response.MonthlyStats;
import com.tutor_management.backend.repository.SessionRecordRepository;
import com.tutor_management.backend.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

// ============= Dashboard Service =============
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final StudentRepository studentRepository;
    private final SessionRecordRepository sessionRecordRepository;

    public DashboardStats getDashboardStats(String currentMonth) {
        int totalStudents = (int) studentRepository.count();

        // SỬ DỤNG PHƯƠNG THỨC @Query MỚI (sumTotalPaid thay vì sumTotalAmountByPaidTrue)
        Long totalPaid = sessionRecordRepository.sumTotalPaid();
        Long totalUnpaid = sessionRecordRepository.sumTotalUnpaid();

        // SỬ DỤNG PHƯƠNG THỨC @Query MỚI
        Long currentMonthTotalPaid = sessionRecordRepository.sumTotalPaidByMonth(currentMonth);
        Long currentMonthTotalUnpaid = sessionRecordRepository.sumTotalUnpaidByMonth(currentMonth);

        return DashboardStats.builder()
                .totalStudents(totalStudents)
                .totalPaidAllTime(totalPaid != null ? totalPaid : 0L)
                .totalUnpaidAllTime(totalUnpaid != null ? totalUnpaid : 0L)
                .currentMonthTotal(currentMonthTotalPaid != null ? currentMonthTotalPaid : 0L)
                .currentMonthUnpaid(currentMonthTotalUnpaid != null ? currentMonthTotalUnpaid : 0L)
                .build();
    }

    public List<MonthlyStats> getMonthlyStats() {
        // Phương thức này không cần thay đổi vì nó sử dụng @Query
        List<String> months = sessionRecordRepository.findDistinctMonths();

        return months.stream()
                .map(month -> {
                    // SỬ DỤNG PHƯƠNG THỨC @Query MỚI
                    Long totalPaid = sessionRecordRepository.sumTotalPaidByMonth(month);
                    Long totalUnpaid = sessionRecordRepository.sumTotalUnpaidByMonth(month);
                    Integer totalSessions = sessionRecordRepository.sumSessionsByMonth(month);

                    return MonthlyStats.builder()
                            .month(month)
                            .totalPaid(totalPaid != null ? totalPaid : 0L)
                            .totalUnpaid(totalUnpaid != null ? totalUnpaid : 0L)
                            .totalSessions(totalSessions != null ? totalSessions : 0)
                            .build();
                })
                .collect(Collectors.toList());
    }
}