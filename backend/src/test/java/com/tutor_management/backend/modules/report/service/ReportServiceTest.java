package com.tutor_management.backend.modules.report.service;

import com.tutor_management.backend.modules.feedback.repository.SessionFeedbackRepository;
import com.tutor_management.backend.modules.finance.LessonStatus;
import com.tutor_management.backend.modules.finance.entity.SessionRecord;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.report.dto.MonthlyReportDataDTO;
import com.tutor_management.backend.modules.report.entity.MonthlyReport;
import com.tutor_management.backend.modules.report.repository.MonthlyReportRepository;
import com.tutor_management.backend.modules.schedule.repository.RecurringScheduleRepository;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.submission.repository.SubmissionRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private MonthlyReportRepository monthlyReportRepository;
    @Mock
    private SessionRecordRepository sessionRecordRepository;
    @Mock
    private SessionFeedbackRepository sessionFeedbackRepository;
    @Mock
    private SubmissionRepository submissionRepository;
        @Mock
        private RecurringScheduleRepository recurringScheduleRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private TutorRepository tutorRepository;

    @InjectMocks
    private ReportService reportService;

    private Tutor tutor;
    private Student student;

    @BeforeEach
    void setUp() {
        tutor = Tutor.builder().id(10L).fullName("Gia su A").build();
        student = Student.builder().id(20L).tutorId(10L).name("Hoc sinh A").build();
    }

    @Test
    void getReportData_returnsCorrectAttendance() {
        SessionRecord attended = SessionRecord.builder()
                .id(1L)
                .sessions(1)
                .status(LessonStatus.COMPLETED)
                .totalAmount(200_000L)
                .paid(true)
                .sessionDate(LocalDate.of(2026, 3, 5))
                .build();

        SessionRecord absent = SessionRecord.builder()
                .id(2L)
                .sessions(1)
                .status(LessonStatus.CANCELLED_BY_STUDENT)
                .totalAmount(200_000L)
                .paid(false)
                .sessionDate(LocalDate.of(2026, 3, 8))
                .build();

        when(tutorRepository.findByUserId(100L)).thenReturn(Optional.of(tutor));
        when(studentRepository.findByIdAndTutorId(20L, 10L)).thenReturn(Optional.of(student));
        when(sessionRecordRepository.findByTutorIdAndStudentIdAndSessionDateBetween(eq(10L), eq(20L), any(), any()))
                .thenReturn(List.of(attended, absent));
        when(submissionRepository.findGradedSummariesForMonthlyReport(eq("20"), eq(10L), any(), any()))
                .thenReturn(List.of());
        when(sessionFeedbackRepository.findByTutorIdAndStudentIdAndMonth(10L, 20L, "2026-03"))
                .thenReturn(List.of());
        when(recurringScheduleRepository.findByStudentIdAndTutorIdAndActiveTrue(20L, 10L))
                .thenReturn(List.of());
        when(monthlyReportRepository.findByTutorIdAndStudentIdAndReportMonthAndReportYear(10L, 20L, 3, 2026))
                .thenReturn(Optional.empty());

        MonthlyReportDataDTO result = reportService.getReportData(100L, 20L, 3, 2026);

        assertNotNull(result);
        assertEquals(2, result.getTotalSessions());
        assertEquals(1, result.getAttendedSessions());
        assertEquals(1, result.getAbsentSessions());
        assertEquals(50.0, result.getAttendanceRate());
    }

    @Test
    void saveTutorComment_upsertCorrectly() {
        when(tutorRepository.findByUserId(100L)).thenReturn(Optional.of(tutor));
        when(studentRepository.existsByIdAndTutorId(20L, 10L)).thenReturn(true);
        when(monthlyReportRepository.findByTutorIdAndStudentIdAndReportMonthAndReportYear(10L, 20L, 3, 2026))
                .thenReturn(Optional.empty());

        reportService.saveTutorComment(100L, 20L, 3, 2026, "Nhận xét lần 1");

        ArgumentCaptor<MonthlyReport> captor = ArgumentCaptor.forClass(MonthlyReport.class);
        verify(monthlyReportRepository).save(captor.capture());
        assertEquals(10L, captor.getValue().getTutorId());
        assertEquals(20L, captor.getValue().getStudentId());
        assertEquals(3, captor.getValue().getReportMonth());
        assertEquals(2026, captor.getValue().getReportYear());
        assertEquals("Nhận xét lần 1", captor.getValue().getTutorComment());
    }
}
