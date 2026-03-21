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
import com.tutor_management.backend.modules.submission.dto.response.SubmissionIdentityReconcileResponse;
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
import org.springframework.scheduling.annotation.Scheduled;
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

    @Scheduled(fixedDelayString = "${app.submission.auto-submit.interval-ms:60000}")
    public void autoSubmitExpiredSubmissions() {
        LocalDateTime now = LocalDateTime.now();
        List<Submission> expiredSubmissions = submissionRepository.findExpiredByStatuses(
                now,
                List.of(SubmissionStatus.PENDING, SubmissionStatus.DRAFT)
        );

        if (expiredSubmissions.isEmpty()) {
            return;
        }

        log.info("Auto-submit triggered for {} expired submissions", expiredSubmissions.size());

        for (Submission submission : expiredSubmissions) {
            try {
                if (submission.getStatus() == SubmissionStatus.SUBMITTED || submission.getStatus() == SubmissionStatus.GRADED) {
                    continue;
                }

                submission.setStatus(SubmissionStatus.SUBMITTED);
                submission.setSubmittedAt(now);

                autoGradingService.gradeSubmission(submission);

                List<Question> questions = questionRepository.findByExerciseIdOrderByOrderIndex(submission.getExerciseId());
                boolean hasEssay = questions.stream().anyMatch(question -> question.getType() == QuestionType.ESSAY);
                if (!hasEssay) {
                    submission.setStatus(SubmissionStatus.GRADED);
                    submission.setGradedAt(now);
                }

                Submission saved = submissionRepository.save(submission);
                syncAssignmentStatus(saved);
                publishSubmissionEvent(saved, saved.getStudentId());

                if (!hasEssay) {
                    publishGradingEvent(saved);
                }
            } catch (Exception exception) {
                log.error("Auto-submit failed for submission {}: {}", submission.getId(), exception.getMessage(), exception);
            }
        }
    }
    
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

        List<Question> questions = questionRepository.findByExerciseIdOrderByOrderIndex(submission.getExerciseId());
        Map<String, Question> questionMap = questions.stream().collect(Collectors.toMap(Question::getId, q -> q));

        applyManualGrades(submission, request, questionMap);
        recalculateAndCapScores(submission);
        
        submission.setTeacherComment(request.getTeacherComment());
        submission.setStatus(SubmissionStatus.GRADED);
        submission.setGradedAt(LocalDateTime.now());
        
        Submission graded = submissionRepository.save(submission);
        syncAssignmentStatus(graded);
        publishGradingEvent(graded);
        
        return mapToSubmissionResponse(graded);
    }

    @Override
    public SubmissionIdentityReconcileResponse reconcileStudentIdentitySubmissions(Long studentProfileId, boolean dryRun) {
        if (studentProfileId == null) {
            throw new ResourceNotFoundException("Thiếu studentProfileId để đồng bộ bài nộp");
        }

        String canonicalStudentId = studentProfileId.toString();
        LinkedHashSet<String> identityCandidates = new LinkedHashSet<>();
        identityCandidates.add(canonicalStudentId);
        userRepository.findByStudentId(studentProfileId)
                .map(User::getId)
                .ifPresent(userId -> identityCandidates.add(userId.toString()));

        List<Submission> all = identityCandidates.stream()
                .flatMap(identity -> submissionRepository.findByStudentId(identity).stream())
                .toList();

        Map<String, List<Submission>> byExercise = all.stream()
                .collect(Collectors.groupingBy(Submission::getExerciseId));

        int mergedExercises = 0;
        int deletedSubmissions = 0;
        int canonicalizedSubmissions = 0;

        for (Map.Entry<String, List<Submission>> entry : byExercise.entrySet()) {
            List<Submission> candidates = entry.getValue();
            if (candidates.isEmpty()) {
                continue;
            }

            Submission winner = candidates.stream().reduce(this::pickPreferredSubmission).orElse(candidates.get(0));
            List<Submission> toDelete = candidates.stream()
                    .filter(s -> !Objects.equals(s.getId(), winner.getId()))
                    .toList();

            boolean hasDuplicates = !toDelete.isEmpty();
            boolean needsCanonicalization = !Objects.equals(winner.getStudentId(), canonicalStudentId);

            if (!hasDuplicates && !needsCanonicalization) {
                continue;
            }

            mergedExercises++;
            deletedSubmissions += toDelete.size();
            if (needsCanonicalization) {
                canonicalizedSubmissions++;
            }

            if (!dryRun) {
                if (needsCanonicalization) {
                    winner.setStudentId(canonicalStudentId);
                    submissionRepository.save(winner);
                }
                if (!toDelete.isEmpty()) {
                    submissionRepository.deleteAll(toDelete);
                }
            }
        }

        return SubmissionIdentityReconcileResponse.builder()
                .canonicalStudentId(canonicalStudentId)
                .identityCandidates(new ArrayList<>(identityCandidates))
                .scannedSubmissions(all.size())
                .affectedExercises(byExercise.size())
                .mergedExercises(mergedExercises)
                .deletedSubmissions(deletedSubmissions)
                .canonicalizedSubmissions(canonicalizedSubmissions)
                .dryRun(dryRun)
                .build();
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

    private void applyManualGrades(Submission s, GradeSubmissionRequest r, Map<String, Question> questionMap) {
        if (r.getEssayGrades() == null) return;

        int appliedCount = 0;

        for (EssayGradeRequest g : r.getEssayGrades()) {
            Question question = questionMap.get(g.getQuestionId());
            if (question == null) {
                log.warn("Skipping essay grade for unknown question {} in submission {}", g.getQuestionId(), s.getId());
                continue;
            }

            if (question.getType() != QuestionType.ESSAY) {
                log.warn("Skipping non-essay question {} while grading submission {}", g.getQuestionId(), s.getId());
                continue;
            }

            Optional<StudentAnswer> answerOpt = s.getAnswers().stream()
                .filter(a -> a.getQuestionId().equals(g.getQuestionId()))
                .findFirst();

            if (answerOpt.isEmpty()) {
                log.warn("Skipping essay grade for question {} because no matching student answer was found in submission {}",
                        g.getQuestionId(), s.getId());
                continue;
            }

            StudentAnswer answer = answerOpt.get();
            double rawPoints = Optional.ofNullable(g.getPoints()).orElse(0.0);
            double maxPoints = Optional.ofNullable(question.getPoints()).orElse(0.0);
            double normalizedPoints = Math.max(0.0, Math.min(rawPoints, maxPoints));

            answer.setPoints(roundTwoDecimals(normalizedPoints));
            answer.setFeedback(g.getFeedback());
            appliedCount++;
        }

        if (!r.getEssayGrades().isEmpty() && appliedCount == 0) {
            throw new ResourceNotFoundException("Không thể áp điểm tự luận: không khớp câu trả lời của học sinh");
        }
    }

    private void recalculateAndCapScores(Submission s) {
        List<Question> questions = questionRepository.findByExerciseIdOrderByOrderIndex(s.getExerciseId());
        Map<String, Question> questionMap = questions.stream()
            .collect(Collectors.toMap(Question::getId, q -> q));
        Map<String, QuestionType> typeMap = questions.stream()
            .collect(Collectors.toMap(Question::getId, Question::getType));

        double previousMcq = Optional.ofNullable(s.getMcqScore()).orElse(0.0);
        double previousEssay = Optional.ofNullable(s.getEssayScore()).orElse(0.0);

        double mcq = 0.0;
        double essay = 0.0;
        int mappedMcqAnswers = 0;
        int mappedEssayAnswers = 0;

        for (StudentAnswer a : s.getAnswers()) {
            Question question = questionMap.get(a.getQuestionId());
            QuestionType type = typeMap.get(a.getQuestionId());
            double rawPoints = Optional.ofNullable(a.getPoints()).orElse(0.0);
            double maxPoints = question != null ? Optional.ofNullable(question.getPoints()).orElse(0.0) : rawPoints;
            double pts = Math.max(0.0, Math.min(rawPoints, maxPoints));
            a.setPoints(roundTwoDecimals(pts));

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

    private Submission pickPreferredSubmission(Submission s1, Submission s2) {
        int s1Rank = submissionRank(s1);
        int s2Rank = submissionRank(s2);
        if (s1Rank != s2Rank) {
            return s1Rank > s2Rank ? s1 : s2;
        }

        LocalDateTime s1Ts = submissionRecencyTimestamp(s1);
        LocalDateTime s2Ts = submissionRecencyTimestamp(s2);
        if (s1Ts != null && s2Ts != null && !Objects.equals(s1Ts, s2Ts)) {
            return s1Ts.isAfter(s2Ts) ? s1 : s2;
        }
        if (s1Ts != null && s2Ts == null) return s1;
        if (s2Ts != null && s1Ts == null) return s2;

        double s1Total = Optional.ofNullable(s1.getTotalScore()).orElse(0.0);
        double s2Total = Optional.ofNullable(s2.getTotalScore()).orElse(0.0);
        if (Double.compare(s1Total, s2Total) != 0) {
            return s1Total > s2Total ? s1 : s2;
        }

        return s1;
    }

    private int submissionRank(Submission s) {
        if (s == null || s.getStatus() == null) {
            return 0;
        }
        return switch (s.getStatus()) {
            case GRADED -> 4;
            case SUBMITTED -> 3;
            case DRAFT -> 2;
            case PENDING -> 1;
        };
    }

    private LocalDateTime submissionRecencyTimestamp(Submission s) {
        if (s == null) {
            return null;
        }
        if (s.getGradedAt() != null) {
            return s.getGradedAt();
        }
        if (s.getSubmittedAt() != null) {
            return s.getSubmittedAt();
        }
        if (s.getUpdatedAt() != null) {
            return s.getUpdatedAt();
        }
        return s.getCreatedAt();
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
