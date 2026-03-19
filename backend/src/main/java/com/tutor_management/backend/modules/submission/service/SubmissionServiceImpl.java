package com.tutor_management.backend.modules.submission.service;

import com.tutor_management.backend.exception.ResourceNotFoundException;
import com.tutor_management.backend.modules.exercise.domain.Question;
import com.tutor_management.backend.modules.exercise.domain.QuestionType;
import com.tutor_management.backend.modules.submission.entity.StudentAnswer;
import com.tutor_management.backend.modules.submission.entity.Submission;
import com.tutor_management.backend.modules.submission.entity.SubmissionStatus;
import com.tutor_management.backend.modules.submission.dto.request.AnswerRequest;
import com.tutor_management.backend.modules.submission.dto.request.CreateSubmissionRequest;
import com.tutor_management.backend.modules.submission.dto.request.EssayGradeRequest;
import com.tutor_management.backend.modules.submission.dto.request.GradeSubmissionRequest;
import com.tutor_management.backend.modules.submission.dto.response.StudentAnswerResponse;
import com.tutor_management.backend.modules.submission.dto.response.SubmissionListItemResponse;
import com.tutor_management.backend.modules.submission.dto.response.SubmissionResponse;
import com.tutor_management.backend.modules.submission.repository.SubmissionRepository;
import com.tutor_management.backend.modules.exercise.repository.ExerciseRepository;
import com.tutor_management.backend.modules.exercise.repository.QuestionRepository;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.notification.event.ExamGradedEvent;
import com.tutor_management.backend.modules.notification.event.ExamSubmittedEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Standard implementation of {@link SubmissionService}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SubmissionServiceImpl implements SubmissionService {
    
    private final SubmissionRepository submissionRepository;
    private final AutoGradingService autoGradingService;
    private final UserRepository userRepository;
    private final ExerciseRepository exerciseRepository;
    private final QuestionRepository questionRepository;
    private final com.tutor_management.backend.modules.exercise.repository.ExerciseAssignmentRepository assignmentRepository;
    private final ApplicationEventPublisher eventPublisher;
    
    // --- Public API Implementations ---
    @Override
    public SubmissionResponse saveDraft(CreateSubmissionRequest request, String studentId) {
        log.info("Saving submission draft | Exercise: {} | Student: {}", request.getExerciseId(), studentId);
        Submission submission = syncDraftEntity(request, studentId);
        syncAssignmentStatus(submission);
        return mapToSubmissionResponse(submission);
    }
    
    // Submits the student's answers, triggers auto-grading, and updates statuses accordingly.
    @Override
    public SubmissionResponse submit(CreateSubmissionRequest request, String studentId) {
        log.info("Finalizing submission | Exercise: {} | Student: {}", request.getExerciseId(), studentId);
        
        Submission submission = syncDraftEntity(request, studentId);
        submission.setStatus(SubmissionStatus.SUBMITTED);
        submission.setSubmittedAt(LocalDateTime.now());
        
        // coordinated auto-grading phase
        autoGradingService.gradeSubmission(submission);
        
        // if the exercise contained no essay questions we can finalize grading immediately
        List<Question> questions = questionRepository.findByExerciseIdOrderByOrderIndex(submission.getExerciseId());
        boolean hasEssay = questions.stream().anyMatch(q -> q.getType() == QuestionType.ESSAY);
        if (!hasEssay) {
            submission.setStatus(SubmissionStatus.GRADED);
            submission.setGradedAt(LocalDateTime.now());
        }
        
        Submission saved = submissionRepository.save(submission);
        syncAssignmentStatus(saved);
        publishSubmissionEvent(saved, studentId);

        // if we auto-graded completely, also fire grading event so student/tutor get notified right away
        if (!hasEssay) {
            publishGradingEvent(saved);
        }
        
        return mapToSubmissionResponse(saved);
    }
    
    // Retrieves a submission by its ID, including all associated answers and metadata.
    @Override
    @Transactional(readOnly = true)
    public SubmissionResponse getSubmission(String id) {
        Submission submission = submissionRepository.findByIdWithAnswers(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài nộp với ID: " + id));
        return mapToSubmissionResponse(submission);
    }
    
    // Retrieves a student's submission for a specific exercise, if it exists.
    @Override
    @Transactional(readOnly = true)
    public SubmissionResponse getSubmissionByExerciseAndStudent(String exerciseId, String studentId) {
        Submission submission = submissionRepository.findByExerciseIdAndStudentId(exerciseId, studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Học sinh chưa có bài nộp cho bài tập này."));
        return mapToSubmissionResponse(submission);
    }
    
    // Lists all submissions for a given exercise, providing summary information for each.
    @Override
    @Transactional(readOnly = true)
    public List<SubmissionListItemResponse> listSubmissionsByExercise(String exerciseId) {
        List<Submission> submissions = submissionRepository.findByExerciseId(exerciseId);
        if (submissions.isEmpty()) return List.of();

        Map<Long, User> studentMap = fetchStudentMap(submissions);
        return submissions.stream()
            .map(s -> mapToListItemResponse(s, studentMap))
            .collect(Collectors.toList());
    }
    
    // Lists all submissions made by a specific student across all exercises.
    @Override
    @Transactional(readOnly = true)
    public List<SubmissionResponse> listSubmissionsByStudent(String studentId) {
        return submissionRepository.findByStudentId(studentId).stream()
            .map(this::mapToSubmissionResponse)
            .collect(Collectors.toList());
    }
    
    // Grades a submission based on manual input from the tutor, updating scores and statuses accordingly.
    @Override
    public SubmissionResponse gradeSubmission(String id, GradeSubmissionRequest request) {
        log.info("⚖️ Grading submission: {}", id);
        
        Submission submission = submissionRepository.findByIdWithAnswers(id)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài nộp với ID: " + id));
        
        applyManualGrades(submission, request);
        recalculateAndCapScores(submission);
        
        submission.setTeacherComment(request.getTeacherComment());
        submission.setStatus(SubmissionStatus.GRADED);
        submission.setGradedAt(LocalDateTime.now());
        
        Submission graded = submissionRepository.save(submission);
        syncAssignmentStatus(graded);
        publishGradingEvent(graded);
        
        return mapToSubmissionResponse(graded);
    }

    /**
     * Synchronizes the exercise assignment status with the submission status.
     * Ensures that the tutor dashboard and student views are consistent.
     */
    private void syncAssignmentStatus(Submission s) {
        assignmentRepository.findByExerciseIdAndStudentId(s.getExerciseId(), s.getStudentId())
            .ifPresent(assignment -> {
                switch (s.getStatus()) {
                    case DRAFT -> assignment.setStatus(com.tutor_management.backend.modules.exercise.domain.AssignmentStatus.STARTED);
                    case SUBMITTED -> assignment.setStatus(com.tutor_management.backend.modules.exercise.domain.AssignmentStatus.SUBMITTED);
                    case GRADED -> assignment.setStatus(com.tutor_management.backend.modules.exercise.domain.AssignmentStatus.GRADED);
                    case PENDING -> assignment.setStatus(com.tutor_management.backend.modules.exercise.domain.AssignmentStatus.PENDING);
                }
                assignmentRepository.save(assignment);
                log.info("Linked ExerciseAssignment {} synchronized to status {}", assignment.getId(), assignment.getStatus());
            });
    }

    // --- Private Processors ---

    private Submission syncDraftEntity(CreateSubmissionRequest r, String studentId) {
        Submission submission = submissionRepository.findByExerciseIdAndStudentId(r.getExerciseId(), studentId)
                .orElseGet(() -> Submission.builder()
                        .exerciseId(r.getExerciseId())
                        .studentId(studentId)
                        .status(SubmissionStatus.DRAFT)
                        .answers(new ArrayList<>())
                        .build());
        
        submission.getAnswers().clear();
        for (AnswerRequest req : r.getAnswers()) {
            submission.addAnswer(StudentAnswer.builder()
                .questionId(req.getQuestionId())
                .selectedOption(req.getSelectedOption())
                .essayText(req.getEssayText())
                .build());
        }
        
        return submissionRepository.save(submission);
    }

    private void applyManualGrades(Submission s, GradeSubmissionRequest r) {
        if (r.getEssayGrades() == null) return;

        int appliedCount = 0;

        for (EssayGradeRequest g : r.getEssayGrades()) {
            Optional<StudentAnswer> answerOpt = s.getAnswers().stream()
                .filter(a -> a.getQuestionId().equals(g.getQuestionId()))
                .findFirst();

            if (answerOpt.isEmpty()) {
                log.warn("Skipping essay grade for question {} because no matching student answer was found in submission {}",
                        g.getQuestionId(), s.getId());
                continue;
            }

            StudentAnswer answer = answerOpt.get();
            answer.setPoints(g.getPoints());
            answer.setFeedback(g.getFeedback());
            appliedCount++;
        }

        if (!r.getEssayGrades().isEmpty() && appliedCount == 0) {
            throw new ResourceNotFoundException("Không thể áp điểm tự luận: không khớp câu trả lời của học sinh");
        }
    }

    private void recalculateAndCapScores(Submission s) {
        List<Question> questions = questionRepository.findByExerciseIdOrderByOrderIndex(s.getExerciseId());
        Map<String, QuestionType> typeMap = questions.stream()
            .collect(Collectors.toMap(Question::getId, Question::getType));

        double previousMcq = Optional.ofNullable(s.getMcqScore()).orElse(0.0);
        double previousEssay = Optional.ofNullable(s.getEssayScore()).orElse(0.0);

        double mcq = 0.0;
        double essay = 0.0;
        int mappedMcqAnswers = 0;
        int mappedEssayAnswers = 0;

        for (StudentAnswer a : s.getAnswers()) {
            QuestionType type = typeMap.get(a.getQuestionId());
            double pts = Optional.ofNullable(a.getPoints()).orElse(0.0);
            if (type == QuestionType.MCQ) {
                mcq += pts;
                mappedMcqAnswers++;
            } else if (type == QuestionType.ESSAY) {
                essay += pts;
                mappedEssayAnswers++;
            }
        }

        if (mappedMcqAnswers == 0 && previousMcq > 0) {
            log.warn("No mappable MCQ answers found while grading submission {}. Preserving previous MCQ score {}",
                    s.getId(), previousMcq);
            mcq = previousMcq;
        }

        if (mappedEssayAnswers == 0 && previousEssay > 0) {
            log.warn("No mappable essay answers found while grading submission {}. Preserving previous essay score {}",
                    s.getId(), previousEssay);
            essay = previousEssay;
        }

        s.setMcqScore(roundTwoDecimals(mcq));
        s.setEssayScore(roundTwoDecimals(essay));
        s.calculateTotalScore();

        exerciseRepository.findById(s.getExerciseId()).ifPresent(ex -> {
            if (s.getTotalScore() > ex.getTotalPoints()) {
                s.setTotalScore(ex.getTotalPoints().doubleValue());
            }
            s.setTotalScore(roundTwoDecimals(s.getTotalScore()));
        });
    }

    private double roundTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private void publishSubmissionEvent(Submission s, String studentId) {
        exerciseRepository.findById(s.getExerciseId()).ifPresent(ex -> {
            String name = userRepository.findById(safeParseLong(studentId)).map(User::getFullName).orElse("Học sinh");
            eventPublisher.publishEvent(ExamSubmittedEvent.builder()
                .submissionId(s.getId()).studentId(studentId).studentName(name)
                .exerciseId(ex.getId()).exerciseTitle(ex.getTitle()).tutorId(ex.getCreatedBy())
                .build());
        });
    }

    private void publishGradingEvent(Submission s) {
        exerciseRepository.findById(s.getExerciseId()).ifPresent(ex -> {
            eventPublisher.publishEvent(ExamGradedEvent.builder()
                .submissionId(s.getId()).studentId(s.getStudentId())
                .exerciseId(ex.getId()).exerciseTitle(ex.getTitle()).score(s.getTotalScore())
                .build());
        });
    }

    private Map<Long, User> fetchStudentMap(List<Submission> sub) {
        List<Long> ids = sub.stream().map(s -> safeParseLong(s.getStudentId())).filter(Objects::nonNull).distinct().toList();
        return userRepository.findAllById(ids).stream().collect(Collectors.toMap(User::getId, u -> u));
    }

    private Long safeParseLong(String s) {
        try { return Long.parseLong(s); } catch (Exception e) { return null; }
    }

    // --- Mappers ---

    private SubmissionResponse mapToSubmissionResponse(Submission s) {
        String studentName = userRepository.findById(safeParseLong(s.getStudentId())).map(User::getFullName).orElse("N/A");
        return SubmissionResponse.builder()
            .id(s.getId()).exerciseId(s.getExerciseId()).studentId(s.getStudentId()).studentName(studentName)
            .status(s.getStatus()).mcqScore(s.getMcqScore()).essayScore(s.getEssayScore()).totalScore(s.getTotalScore())
            .submittedAt(s.getSubmittedAt()).gradedAt(s.getGradedAt()).teacherComment(s.getTeacherComment())
            .createdAt(s.getCreatedAt()).updatedAt(s.getUpdatedAt())
            .answers(s.getAnswers().stream().map(this::mapToAnswerResponse).toList())
            .build();
    }

    private StudentAnswerResponse mapToAnswerResponse(StudentAnswer a) {
        return StudentAnswerResponse.builder()
            .id(a.getId()).questionId(a.getQuestionId()).selectedOption(a.getSelectedOption())
            .essayText(a.getEssayText()).isCorrect(a.getIsCorrect()).points(a.getPoints()).feedback(a.getFeedback())
            .build();
    }

    private SubmissionListItemResponse mapToListItemResponse(Submission s, Map<Long, User> studentMap) {
        User u = studentMap.get(safeParseLong(s.getStudentId()));
        return SubmissionListItemResponse.builder()
            .id(s.getId()).studentId(s.getStudentId()).studentName(u != null ? u.getFullName() : "N/A")
            .status(s.getStatus()).mcqScore(s.getMcqScore()).essayScore(s.getEssayScore()).totalScore(s.getTotalScore())
            .submittedAt(s.getSubmittedAt()).gradedAt(s.getGradedAt())
            .build();
    }
}
