package com.tutor_management.backend.modules.report.repository;

import com.tutor_management.backend.modules.report.entity.MonthlyReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MonthlyReportRepository extends JpaRepository<MonthlyReport, Long> {

    Optional<MonthlyReport> findByTutorIdAndStudentIdAndReportMonthAndReportYear(
            Long tutorId,
            Long studentId,
            Integer reportMonth,
            Integer reportYear
    );

    List<MonthlyReport> findByTutorIdAndStudentIdOrderByReportYearDescReportMonthDesc(Long tutorId, Long studentId);
}
