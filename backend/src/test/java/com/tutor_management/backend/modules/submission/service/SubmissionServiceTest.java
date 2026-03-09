package com.tutor_management.backend.modules.submission.service;

import com.tutor_management.backend.modules.exercise.domain.Question;
import com.tutor_management.backend.modules.exercise.domain.QuestionType;
import com.tutor_management.backend.modules.exercise.repository.ExerciseRepository;
import com.tutor_management.backend.modules.exercise.repository.QuestionRepository;
import com.tutor_management.backend.modules.exercise.repository.ExerciseAssignmentRepository;
import com.tutor_management.backend.modules.submission.dto.request.CreateSubmissionRequest;
import com.tutor_management.backend.modules.submission.dto.request.AnswerRequest;
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
        when(submissionRepository.findByExerciseIdAndStudentId(eq(exerciseId), eq(studentId)))
                .thenReturn(Optional.empty());
        when(submissionRepository.save(any(Submission.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(exerciseRepository.findById(eq(exerciseId)))
                .thenReturn(Optional.of(new com.tutor_management.backend.modules.exercise.domain.Exercise()));
        // mock assignment repository to avoid null pointer
        when(assignmentRepository.findByExerciseIdAndStudentId(any(), any()))
                .thenReturn(Optional.empty());
    }

    @Test
    void submit_onlyMcq_shouldBeGradedImmediately() {
        // Arrange
        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setExerciseId(exerciseId);
        request.setAnswers(List.of(new AnswerRequest("q1", "A", null)));

        // exercise has one MCQ question only
        when(questionRepository.findByExerciseIdOrderByOrderIndex(eq(exerciseId)))
                .thenReturn(List.of(Question.builder().id("q1").type(QuestionType.MCQ).points(5).build()));

        // auto grader just returns 5 points and mutates submission
        doAnswer(inv -> {
            Submission sub = inv.getArgument(0);
            sub.setMcqScore(5);
            sub.setTotalScore(5);
            return 5;
        }).when(autoGradingService).gradeSubmission(any(Submission.class));

        // Act
        var response = submissionService.submit(request, studentId);

        // Assert
        assertEquals(SubmissionStatus.GRADED, response.getStatus(), "Status should be GRADED when only MCQ");
        assertEquals(5, response.getMcqScore());
        assertEquals(5, response.getTotalScore());
    }

    @Test
    void submit_withEssay_remainsSubmitted() {
        CreateSubmissionRequest request = new CreateSubmissionRequest();
        request.setExerciseId(exerciseId);
        request.setAnswers(List.of(new AnswerRequest("q1", null, "some text")));

        when(questionRepository.findByExerciseIdOrderByOrderIndex(eq(exerciseId)))
                .thenReturn(List.of(Question.builder().id("q1").type(QuestionType.ESSAY).points(10).build()));

        doAnswer(inv -> {
            Submission sub = inv.getArgument(0);
            sub.setMcqScore(0);
            sub.setTotalScore(0);
            return 0;
        }).when(autoGradingService).gradeSubmission(any(Submission.class));

        var response = submissionService.submit(request, studentId);
        assertEquals(SubmissionStatus.SUBMITTED, response.getStatus());
    }
}
