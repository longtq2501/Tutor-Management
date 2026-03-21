package com.tutor_management.backend.modules.submission.service;

import com.tutor_management.backend.modules.exercise.domain.Question;
import com.tutor_management.backend.modules.exercise.domain.QuestionType;
import com.tutor_management.backend.modules.exercise.repository.ExerciseRepository;
import com.tutor_management.backend.modules.exercise.repository.QuestionRepository;
import com.tutor_management.backend.modules.exercise.repository.ExerciseAssignmentRepository;
import com.tutor_management.backend.modules.submission.dto.request.CreateSubmissionRequest;
import com.tutor_management.backend.modules.submission.dto.request.AnswerRequest;
import com.tutor_management.backend.modules.submission.dto.request.EssayGradeRequest;
import com.tutor_management.backend.modules.submission.dto.request.GradeSubmissionRequest;
import com.tutor_management.backend.modules.submission.entity.StudentAnswer;
import com.tutor_management.backend.modules.submission.entity.Submission;
import com.tutor_management.backend.modules.submission.entity.SubmissionStatus;
import com.tutor_management.backend.modules.submission.repository.SubmissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SubmissionServiceTest {

    @Mock
    private SubmissionRepository submissionRepository;

    @Mock
    private AutoGradingService autoGradingService;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private ExerciseRepository exerciseRepository;

    @Mock
    private ExerciseAssignmentRepository assignmentRepository;

    @Mock
    private com.tutor_management.backend.modules.auth.UserRepository userRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private SubmissionServiceImpl submissionService;

    private final String exerciseId = "ex1";
    private final String studentId = "42";

    @BeforeEach
    void setUp() {
        // common stubs
        lenient().when(submissionRepository.findByExerciseIdAndStudentId(eq(exerciseId), eq(studentId)))
                .thenReturn(Optional.empty());
        lenient().when(submissionRepository.save(any(Submission.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        lenient().when(exerciseRepository.findById(eq(exerciseId)))
                .thenReturn(Optional.of(new com.tutor_management.backend.modules.exercise.domain.Exercise()));
        // mock assignment repository to avoid null pointer
        lenient().when(assignmentRepository.findByExerciseIdAndStudentId(any(), any()))
                .thenReturn(Optional.empty());
        lenient().when(submissionRepository.findExpiredByStatuses(any(LocalDateTime.class), anyList()))
            .thenReturn(List.of());
    }

    @Test
    void submit_onlyMcq_shouldBeGradedImmediately() {
        // Arrange
        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setExerciseId(exerciseId);
        request.setAnswers(List.of(new AnswerRequest("q1", "A", null)));

        // exercise has one MCQ question only
        when(questionRepository.findByExerciseIdOrderByOrderIndex(eq(exerciseId)))
            .thenReturn(List.of(Question.builder().id("q1").type(QuestionType.MCQ).points(5.0).build()));

        // auto grader just returns 5 points and mutates submission
        doAnswer(inv -> {
            Submission sub = inv.getArgument(0);
            sub.setMcqScore(5.0);
            sub.setTotalScore(5.0);
            return 5.0;
        }).when(autoGradingService).gradeSubmission(any(Submission.class));

        // Act
        var response = submissionService.submit(request, studentId);

        // Assert
        assertEquals(SubmissionStatus.GRADED, response.getStatus(), "Status should be GRADED when only MCQ");
        assertEquals(5.0, response.getMcqScore());
        assertEquals(5.0, response.getTotalScore());
    }

    @Test
    void submit_withEssay_remainsSubmitted() {
        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setExerciseId(exerciseId);
        request.setAnswers(List.of(new AnswerRequest("q1", null, "some text")));

        when(questionRepository.findByExerciseIdOrderByOrderIndex(eq(exerciseId)))
            .thenReturn(List.of(Question.builder().id("q1").type(QuestionType.ESSAY).points(10.0).build()));

        doAnswer(inv -> {
            Submission sub = inv.getArgument(0);
            sub.setMcqScore(0.0);
            sub.setTotalScore(0.0);
            return 0.0;
        }).when(autoGradingService).gradeSubmission(any(Submission.class));

        var response = submissionService.submit(request, studentId);
        assertEquals(SubmissionStatus.SUBMITTED, response.getStatus());
    }

    @Test
    void gradeSubmission_withDecimalEssayPoints_shouldClampPerQuestionAndRecalculateTotals() {
        Submission submission = Submission.builder()
            .id("sub-1")
            .exerciseId(exerciseId)
            .studentId(studentId)
            .status(SubmissionStatus.SUBMITTED)
            .mcqScore(5.0)
            .essayScore(0.0)
            .totalScore(5.0)
            .answers(new ArrayList<>())
            .build();

        submission.addAnswer(StudentAnswer.builder().questionId("qEssay1").essayText("Essay 1").points(0.0).build());
        submission.addAnswer(StudentAnswer.builder().questionId("qEssay2").essayText("Essay 2").points(0.0).build());

        when(submissionRepository.findByIdWithAnswers(eq("sub-1"))).thenReturn(Optional.of(submission));
        when(questionRepository.findByExerciseIdOrderByOrderIndex(eq(exerciseId))).thenReturn(List.of(
            Question.builder().id("qEssay1").type(QuestionType.ESSAY).points(2.5).build(),
            Question.builder().id("qEssay2").type(QuestionType.ESSAY).points(3.0).build()
        ));

        com.tutor_management.backend.modules.exercise.domain.Exercise ex = new com.tutor_management.backend.modules.exercise.domain.Exercise();
        ex.setTotalPoints(10);
        ex.setId(exerciseId);
        ex.setTitle("Exercise 1");
        when(exerciseRepository.findById(eq(exerciseId))).thenReturn(Optional.of(ex));

        GradeSubmissionRequest request = GradeSubmissionRequest.builder()
            .essayGrades(List.of(
                EssayGradeRequest.builder().questionId("qEssay1").points(2.25).feedback("Good").build(),
                EssayGradeRequest.builder().questionId("qEssay2").points(4.75).feedback("Too high").build()
            ))
            .teacherComment("Well done")
            .build();

        var response = submissionService.gradeSubmission("sub-1", request);

        assertEquals(SubmissionStatus.GRADED, response.getStatus());
        assertEquals(5.0, response.getMcqScore());
        assertEquals(5.25, response.getEssayScore());
        assertEquals(10.0, response.getTotalScore());

        StudentAnswer essay1 = submission.getAnswers().stream()
            .filter(a -> "qEssay1".equals(a.getQuestionId()))
            .findFirst()
            .orElseThrow();
        StudentAnswer essay2 = submission.getAnswers().stream()
            .filter(a -> "qEssay2".equals(a.getQuestionId()))
            .findFirst()
            .orElseThrow();

        assertEquals(2.25, essay1.getPoints());
        assertEquals(3.0, essay2.getPoints());
    }

    @Test
    void gradeSubmission_withFourEssayAnswersEach12_shouldTotal48() {
        Submission submission = Submission.builder()
            .id("sub-48")
            .exerciseId(exerciseId)
            .studentId(studentId)
            .status(SubmissionStatus.SUBMITTED)
            .mcqScore(0.0)
            .essayScore(0.0)
            .totalScore(0.0)
            .answers(new ArrayList<>())
            .build();

        submission.addAnswer(StudentAnswer.builder().questionId("q1").essayText("a1").points(0.0).build());
        submission.addAnswer(StudentAnswer.builder().questionId("q2").essayText("a2").points(0.0).build());
        submission.addAnswer(StudentAnswer.builder().questionId("q3").essayText("a3").points(0.0).build());
        submission.addAnswer(StudentAnswer.builder().questionId("q4").essayText("a4").points(0.0).build());

        when(submissionRepository.findByIdWithAnswers(eq("sub-48"))).thenReturn(Optional.of(submission));
        when(questionRepository.findByExerciseIdOrderByOrderIndex(eq(exerciseId))).thenReturn(List.of(
            Question.builder().id("q1").type(QuestionType.ESSAY).points(12.0).build(),
            Question.builder().id("q2").type(QuestionType.ESSAY).points(12.0).build(),
            Question.builder().id("q3").type(QuestionType.ESSAY).points(12.0).build(),
            Question.builder().id("q4").type(QuestionType.ESSAY).points(12.0).build()
        ));

        com.tutor_management.backend.modules.exercise.domain.Exercise ex = new com.tutor_management.backend.modules.exercise.domain.Exercise();
        ex.setTotalPoints(100);
        ex.setId(exerciseId);
        ex.setTitle("Exercise 48");
        when(exerciseRepository.findById(eq(exerciseId))).thenReturn(Optional.of(ex));

        GradeSubmissionRequest request = GradeSubmissionRequest.builder()
            .essayGrades(List.of(
                EssayGradeRequest.builder().questionId("q1").points(12.0).build(),
                EssayGradeRequest.builder().questionId("q2").points(12.0).build(),
                EssayGradeRequest.builder().questionId("q3").points(12.0).build(),
                EssayGradeRequest.builder().questionId("q4").points(12.0).build()
            ))
            .teacherComment("ok")
            .build();

        var response = submissionService.gradeSubmission("sub-48", request);

        assertEquals(48.0, response.getEssayScore());
        assertEquals(48.0, response.getTotalScore());
    }

    @Test
    void gradeSubmission_shouldSumMcqAndEssayScores() {
        Submission submission = Submission.builder()
            .id("sub-mix")
            .exerciseId(exerciseId)
            .studentId(studentId)
            .status(SubmissionStatus.SUBMITTED)
            .mcqScore(0.0)
            .essayScore(0.0)
            .totalScore(0.0)
            .answers(new ArrayList<>())
            .build();

        submission.addAnswer(StudentAnswer.builder().questionId("qMcq").selectedOption("A").points(7.0).build());
        submission.addAnswer(StudentAnswer.builder().questionId("qEssay").essayText("essay").points(0.0).build());

        when(submissionRepository.findByIdWithAnswers(eq("sub-mix"))).thenReturn(Optional.of(submission));
        when(questionRepository.findByExerciseIdOrderByOrderIndex(eq(exerciseId))).thenReturn(List.of(
            Question.builder().id("qMcq").type(QuestionType.MCQ).points(10.0).build(),
            Question.builder().id("qEssay").type(QuestionType.ESSAY).points(10.0).build()
        ));

        com.tutor_management.backend.modules.exercise.domain.Exercise ex = new com.tutor_management.backend.modules.exercise.domain.Exercise();
        ex.setTotalPoints(100);
        ex.setId(exerciseId);
        ex.setTitle("Mixed Exercise");
        when(exerciseRepository.findById(eq(exerciseId))).thenReturn(Optional.of(ex));

        GradeSubmissionRequest request = GradeSubmissionRequest.builder()
            .essayGrades(List.of(
                EssayGradeRequest.builder().questionId("qEssay").points(8.0).feedback("Good").build()
            ))
            .teacherComment("mixed")
            .build();

        var response = submissionService.gradeSubmission("sub-mix", request);

        assertEquals(7.0, response.getMcqScore());
        assertEquals(8.0, response.getEssayScore());
        assertEquals(15.0, response.getTotalScore());
    }

        @Test
        void autoSubmitExpiredSubmissions_onlyMcq_shouldAutoSubmitAndPersistResult() {
        Submission expiredDraft = Submission.builder()
            .id("sub-expired-mcq")
            .exerciseId(exerciseId)
            .studentId(studentId)
            .status(SubmissionStatus.DRAFT)
            .answers(new ArrayList<>())
            .build();

        com.tutor_management.backend.modules.exercise.domain.Exercise ex = new com.tutor_management.backend.modules.exercise.domain.Exercise();
        ex.setId(exerciseId);
        ex.setTitle("Bai kiem tra MCQ");
        ex.setCreatedBy("10");
        ex.setTotalPoints(10);

        com.tutor_management.backend.modules.exercise.domain.ExerciseAssignment assignment =
            com.tutor_management.backend.modules.exercise.domain.ExerciseAssignment.builder()
                .exerciseId(exerciseId)
                .studentId(studentId)
                .assignedBy("10")
                .status(com.tutor_management.backend.modules.exercise.domain.AssignmentStatus.PENDING)
                .build();

        when(submissionRepository.findExpiredByStatuses(any(LocalDateTime.class), anyList()))
            .thenReturn(List.of(expiredDraft));
        when(questionRepository.findByExerciseIdOrderByOrderIndex(eq(exerciseId)))
            .thenReturn(List.of(Question.builder().id("q1").type(QuestionType.MCQ).points(10.0).build()));
        when(exerciseRepository.findById(eq(exerciseId))).thenReturn(Optional.of(ex));
        when(assignmentRepository.findByExerciseIdAndStudentId(eq(exerciseId), eq(studentId)))
            .thenReturn(Optional.of(assignment));

        doAnswer(invocation -> {
            Submission submission = invocation.getArgument(0);
            submission.setMcqScore(0.0);
            submission.setEssayScore(0.0);
            submission.setTotalScore(0.0);
            return 0.0;
        }).when(autoGradingService).gradeSubmission(any(Submission.class));

        submissionService.autoSubmitExpiredSubmissions();

        assertEquals(SubmissionStatus.GRADED, expiredDraft.getStatus());
        assertNotNull(expiredDraft.getSubmittedAt());
        assertNotNull(expiredDraft.getGradedAt());

        verify(submissionRepository, atLeastOnce()).save(any(Submission.class));
        verify(assignmentRepository).save(any(com.tutor_management.backend.modules.exercise.domain.ExerciseAssignment.class));
        assertEquals(com.tutor_management.backend.modules.exercise.domain.AssignmentStatus.GRADED, assignment.getStatus());
        }

        @Test
        void autoSubmitExpiredSubmissions_withEssay_shouldRemainSubmittedAndPersistResult() {
        Submission expiredPending = Submission.builder()
            .id("sub-expired-essay")
            .exerciseId(exerciseId)
            .studentId(studentId)
            .status(SubmissionStatus.PENDING)
            .answers(new ArrayList<>())
            .build();

        com.tutor_management.backend.modules.exercise.domain.Exercise ex = new com.tutor_management.backend.modules.exercise.domain.Exercise();
        ex.setId(exerciseId);
        ex.setTitle("Bai kiem tra Essay");
        ex.setCreatedBy("10");
        ex.setTotalPoints(10);

        com.tutor_management.backend.modules.exercise.domain.ExerciseAssignment assignment =
            com.tutor_management.backend.modules.exercise.domain.ExerciseAssignment.builder()
                .exerciseId(exerciseId)
                .studentId(studentId)
                .assignedBy("10")
                .status(com.tutor_management.backend.modules.exercise.domain.AssignmentStatus.PENDING)
                .build();

        when(submissionRepository.findExpiredByStatuses(any(LocalDateTime.class), anyList()))
            .thenReturn(List.of(expiredPending));
        when(questionRepository.findByExerciseIdOrderByOrderIndex(eq(exerciseId)))
            .thenReturn(List.of(Question.builder().id("qEssay").type(QuestionType.ESSAY).points(10.0).build()));
        when(exerciseRepository.findById(eq(exerciseId))).thenReturn(Optional.of(ex));
        when(assignmentRepository.findByExerciseIdAndStudentId(eq(exerciseId), eq(studentId)))
            .thenReturn(Optional.of(assignment));

        doAnswer(invocation -> {
            Submission submission = invocation.getArgument(0);
            submission.setMcqScore(0.0);
            submission.setEssayScore(0.0);
            submission.setTotalScore(0.0);
            return 0.0;
        }).when(autoGradingService).gradeSubmission(any(Submission.class));

        submissionService.autoSubmitExpiredSubmissions();

        assertEquals(SubmissionStatus.SUBMITTED, expiredPending.getStatus());
        assertNotNull(expiredPending.getSubmittedAt());
        assertNull(expiredPending.getGradedAt());

        verify(submissionRepository, atLeastOnce()).save(any(Submission.class));
        verify(assignmentRepository).save(any(com.tutor_management.backend.modules.exercise.domain.ExerciseAssignment.class));
        assertEquals(com.tutor_management.backend.modules.exercise.domain.AssignmentStatus.SUBMITTED, assignment.getStatus());
        }
}
