package com.tutor_management.backend.modules.report.service;

import com.tutor_management.backend.exception.ResourceNotFoundException;
import com.tutor_management.backend.modules.feedback.entity.SessionFeedback;
import com.tutor_management.backend.modules.feedback.repository.SessionFeedbackRepository;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.finance.LessonStatus;
import com.tutor_management.backend.modules.finance.entity.SessionRecord;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.report.dto.MonthlyReportDataDTO;
import com.tutor_management.backend.modules.report.entity.MonthlyReport;
import com.tutor_management.backend.modules.report.repository.MonthlyReportRepository;
import com.tutor_management.backend.modules.schedule.entity.RecurringSchedule;
import com.tutor_management.backend.modules.schedule.repository.RecurringScheduleRepository;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.submission.repository.SubmissionRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service("monthlyReportService")
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final MonthlyReportRepository monthlyReportRepository;
    private final SessionRecordRepository sessionRecordRepository;
    private final SessionFeedbackRepository sessionFeedbackRepository;
    private final SubmissionRepository submissionRepository;
    private final RecurringScheduleRepository recurringScheduleRepository;
    private final StudentRepository studentRepository;
    private final TutorRepository tutorRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public MonthlyReportDataDTO getReportData(Long tutorUserId, Long studentId, Integer month, Integer year) {
        validateMonthYear(month, year);

        Tutor tutor = tutorRepository.findByUserId(tutorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor không tồn tại"));
        Student student = studentRepository.findByIdAndTutorId(studentId, tutor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Học sinh không tồn tại hoặc không thuộc gia sư này"));

        YearMonth currentYearMonth = YearMonth.of(year, month);
        LocalDate startDate = currentYearMonth.atDay(1);
        LocalDate endDate = currentYearMonth.atEndOfMonth();
        LocalDateTime startDateTime = startDate.atStartOfDay();
        LocalDateTime endDateTime = endDate.atTime(23, 59, 59);
        String monthKey = currentYearMonth.toString();

        List<SessionRecord> sessions = sessionRecordRepository.findByTutorIdAndStudentIdAndSessionDateBetween(
                tutor.getId(),
                studentId,
                startDate,
                endDate
        );

        int totalSessions = sessions.stream().mapToInt(s -> nvlInt(s.getSessions())).sum();
        int absentSessions = sessions.stream()
                .filter(this::isAbsentSession)
                .mapToInt(s -> nvlInt(s.getSessions()))
                .sum();
        int attendedSessions = Math.max(totalSessions - absentSessions, 0);

        int plannedSessions = calculatePlannedSessionsForMonth(tutor.getId(), studentId, currentYearMonth);
        if (plannedSessions > 0) {
            totalSessions = Math.max(plannedSessions, attendedSessions + absentSessions);
        }
        double attendanceRate = totalSessions > 0 ? (attendedSessions * 100.0) / totalSessions : 0.0;

        String submissionStudentId = userRepository.findByStudentId(studentId)
            .map(user -> String.valueOf(user.getId()))
            .orElse(String.valueOf(studentId));

        List<Object[]> currentAssessmentRows = submissionRepository.findGradedSummariesForMonthlyReport(
            submissionStudentId, tutor.getId(), startDateTime, endDateTime
        );
        List<MonthlyReportDataDTO.AssessmentSummary> assessments = mapAssessments(currentAssessmentRows);

        Double averageScore = assessments.isEmpty()
                ? null
                : roundOneDecimal(assessments.stream().mapToDouble(a -> nvlDouble(a.getScore())).average().orElse(0.0));

        YearMonth previousYearMonth = currentYearMonth.minusMonths(1);
        List<Object[]> previousAssessmentRows = submissionRepository.findGradedSummariesForMonthlyReport(
            submissionStudentId,
                tutor.getId(),
                previousYearMonth.atDay(1).atStartOfDay(),
                previousYearMonth.atEndOfMonth().atTime(23, 59, 59)
        );
        Double previousMonthAvgScore = previousAssessmentRows.isEmpty()
                ? null
                : roundOneDecimal(previousAssessmentRows.stream()
                        .mapToDouble(row -> ((Number) row[1]).doubleValue())
                        .average()
                        .orElse(0.0));

        Double scoreImprovement = null;
        if (averageScore != null && previousMonthAvgScore != null && previousMonthAvgScore > 0) {
            scoreImprovement = roundOneDecimal(((averageScore - previousMonthAvgScore) / previousMonthAvgScore) * 100.0);
        }

        List<MonthlyReportDataDTO.SessionFeedback> feedbacks = mapSessionFeedbacks(
                sessionFeedbackRepository.findByTutorIdAndStudentIdAndMonth(tutor.getId(), studentId, monthKey)
        );

        long totalFee = sessions.stream()
                .filter(this::isFinanciallyCounted)
                .mapToLong(s -> nvlLong(s.getTotalAmount()))
                .sum();
        long paidAmount = sessions.stream()
                .filter(this::isFinanciallyCounted)
                .filter(s -> Boolean.TRUE.equals(s.getPaid()) || s.getStatus() == LessonStatus.PAID)
                .mapToLong(s -> nvlLong(s.getTotalAmount()))
                .sum();
        long remainingAmount = Math.max(totalFee - paidAmount, 0L);
        String paymentStatus = resolvePaymentStatus(totalFee, paidAmount, remainingAmount);

        Optional<MonthlyReport> existingReport = monthlyReportRepository
                .findByTutorIdAndStudentIdAndReportMonthAndReportYear(tutor.getId(), studentId, month, year);

        return MonthlyReportDataDTO.builder()
                .studentName(student.getName())
                .tutorName(tutor.getFullName())
                .month(month)
                .year(year)
                .totalSessions(totalSessions)
                .attendedSessions(attendedSessions)
                .absentSessions(absentSessions)
                .attendanceRate(roundOneDecimal(attendanceRate))
                .totalAssessments(assessments.size())
                .averageScore(averageScore)
                .previousMonthAvgScore(previousMonthAvgScore)
                .scoreImprovement(scoreImprovement)
                .assessments(assessments)
                .sessionFeedbacks(feedbacks)
                .totalFee(totalFee)
                .paidAmount(paidAmount)
                .remainingAmount(remainingAmount)
                .paymentStatus(paymentStatus)
                .tutorComment(existingReport.map(MonthlyReport::getTutorComment).orElse(""))
                .build();
    }

    @Transactional
    public void saveTutorComment(Long tutorUserId, Long studentId, Integer month, Integer year, String comment) {
        validateMonthYear(month, year);

        Tutor tutor = tutorRepository.findByUserId(tutorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Tutor không tồn tại"));

        if (!studentRepository.existsByIdAndTutorId(studentId, tutor.getId())) {
            throw new ResourceNotFoundException("Học sinh không tồn tại hoặc không thuộc gia sư này");
        }

        MonthlyReport report = monthlyReportRepository
                .findByTutorIdAndStudentIdAndReportMonthAndReportYear(tutor.getId(), studentId, month, year)
                .orElse(MonthlyReport.builder()
                        .tutorId(tutor.getId())
                        .studentId(studentId)
                        .reportMonth(month)
                        .reportYear(year)
                        .build());

        report.setTutorComment(comment == null ? "" : comment.trim());
        monthlyReportRepository.save(report);
    }

    private List<MonthlyReportDataDTO.AssessmentSummary> mapAssessments(List<Object[]> rows) {
        List<MonthlyReportDataDTO.AssessmentSummary> assessments = new ArrayList<>();
        for (Object[] row : rows) {
            LocalDateTime gradedAt = (LocalDateTime) row[3];
            assessments.add(MonthlyReportDataDTO.AssessmentSummary.builder()
                    .title((String) row[0])
                    .score(roundOneDecimal(((Number) row[1]).doubleValue()))
                    .maxScore(roundOneDecimal(((Number) row[2]).doubleValue()))
                    .date(gradedAt != null ? gradedAt.toLocalDate() : null)
                    .build());
        }
        return assessments;
    }

    private List<MonthlyReportDataDTO.SessionFeedback> mapSessionFeedbacks(List<SessionFeedback> raw) {
        Map<Long, SessionFeedback> latestBySession = new LinkedHashMap<>();
        for (SessionFeedback feedback : raw) {
            Long sessionId = feedback.getSessionRecord() != null ? feedback.getSessionRecord().getId() : null;
            if (sessionId != null && !latestBySession.containsKey(sessionId)) {
                latestBySession.put(sessionId, feedback);
            }
        }

        List<MonthlyReportDataDTO.SessionFeedback> result = new ArrayList<>();
        for (SessionFeedback feedback : latestBySession.values()) {
            String mergedFeedback = firstNotBlank(
                    feedback.getAbsorptionComment(),
                    feedback.getAttitudeComment(),
                    feedback.getLessonContent(),
                    feedback.getKnowledgeGaps(),
                    feedback.getSolutions()
            );
            result.add(MonthlyReportDataDTO.SessionFeedback.builder()
                    .sessionDate(feedback.getSessionRecord() != null ? feedback.getSessionRecord().getSessionDate() : null)
                    .feedback(mergedFeedback)
                    .build());
        }
        return result;
    }

    private boolean isFinanciallyCounted(SessionRecord sessionRecord) {
        LessonStatus status = sessionRecord.getStatus();
        if (status == null) {
            return true;
        }
        return status != LessonStatus.CANCELLED_BY_STUDENT && status != LessonStatus.CANCELLED_BY_TUTOR;
    }

    private boolean isAbsentSession(SessionRecord sessionRecord) {
        LessonStatus status = sessionRecord.getStatus();
        return status == LessonStatus.CANCELLED_BY_STUDENT || status == LessonStatus.CANCELLED_BY_TUTOR;
    }

    private String resolvePaymentStatus(long totalFee, long paidAmount, long remainingAmount) {
        if (totalFee <= 0L) {
            return "UNPAID";
        }
        if (remainingAmount == 0L) {
            return "PAID";
        }
        if (paidAmount > 0L) {
            return "PARTIAL";
        }
        return "UNPAID";
    }

    private void validateMonthYear(Integer month, Integer year) {
        if (month == null || month < 1 || month > 12) {
            throw new IllegalArgumentException("Tháng không hợp lệ");
        }
        if (year == null || year < 2000 || year > 2100) {
            throw new IllegalArgumentException("Năm không hợp lệ");
        }
    }

    private double roundOneDecimal(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private int nvlInt(Integer value) {
        return value == null ? 0 : value;
    }

    private long nvlLong(Long value) {
        return value == null ? 0L : value;
    }

    private double nvlDouble(Double value) {
        return value == null ? 0.0 : value;
    }

    private String firstNotBlank(String... candidates) {
        for (String candidate : candidates) {
            if (candidate != null && !candidate.isBlank()) {
                return candidate.trim();
            }
        }
        return "";
    }

    private int calculatePlannedSessionsForMonth(Long tutorId, Long studentId, YearMonth targetMonth) {
        List<RecurringSchedule> schedules = recurringScheduleRepository
                .findByStudentIdAndTutorIdAndActiveTrue(studentId, tutorId);

        int planned = 0;
        for (RecurringSchedule schedule : schedules) {
            if (!isScheduleActiveInMonth(schedule, targetMonth)) {
                continue;
            }
            for (Integer day : schedule.getDaysOfWeekArray()) {
                planned += countWeekdayOccurrences(targetMonth, day);
            }
        }
        return planned;
    }

    private boolean isScheduleActiveInMonth(RecurringSchedule schedule, YearMonth targetMonth) {
        YearMonth startMonth = parseYearMonth(schedule.getStartMonth());
        if (startMonth != null && targetMonth.isBefore(startMonth)) {
            return false;
        }

        YearMonth endMonth = parseYearMonth(schedule.getEndMonth());
        return endMonth == null || !targetMonth.isAfter(endMonth);
    }

    private YearMonth parseYearMonth(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return YearMonth.parse(value.trim());
        } catch (Exception ex) {
            log.warn("Invalid year-month format in recurring schedule: {}", value);
            return null;
        }
    }

    private int countWeekdayOccurrences(YearMonth month, Integer dayValue) {
        if (dayValue == null || dayValue < 1 || dayValue > 7) {
            return 0;
        }

        int occurrences = 0;
        LocalDate cursor = month.atDay(1);
        LocalDate last = month.atEndOfMonth();

        while (!cursor.isAfter(last)) {
            int currentIsoDay = cursor.getDayOfWeek().getValue();
            if (currentIsoDay == dayValue) {
                occurrences++;
            }
            cursor = cursor.plusDays(1);
        }

        return occurrences;
    }
}
