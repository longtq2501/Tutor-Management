package com.tutor_management.backend.modules.exercise.service;

import com.tutor_management.backend.exception.ResourceNotFoundException;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.util.SecurityContextUtils;
import com.tutor_management.backend.modules.exercise.domain.*;
import com.tutor_management.backend.modules.exercise.dto.request.CreateExerciseRequest;
import com.tutor_management.backend.modules.exercise.dto.request.ImportExerciseRequest;
import com.tutor_management.backend.modules.exercise.dto.request.OptionRequest;
import com.tutor_management.backend.modules.exercise.dto.request.QuestionRequest;
import com.tutor_management.backend.modules.exercise.dto.response.ExerciseListItemResponse;
import com.tutor_management.backend.modules.exercise.dto.response.ExerciseResponse;
import com.tutor_management.backend.modules.exercise.dto.response.ImportPreviewResponse;
import com.tutor_management.backend.modules.exercise.dto.response.OptionResponse;
import com.tutor_management.backend.modules.exercise.dto.response.QuestionResponse;
import com.tutor_management.backend.modules.exercise.dto.response.TutorStudentSummaryResponse;
import com.tutor_management.backend.modules.exercise.repository.ExerciseAssignmentRepository;
import com.tutor_management.backend.modules.exercise.repository.ExerciseRepository;
import com.tutor_management.backend.modules.exercise.repository.OptionRepository;
import com.tutor_management.backend.modules.exercise.repository.QuestionRepository;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.notification.event.ExerciseAssignedEvent;
import com.tutor_management.backend.modules.notification.event.ExerciseUpdatedEvent;
import com.tutor_management.backend.modules.submission.entity.Submission;
import com.tutor_management.backend.modules.submission.entity.SubmissionStatus;
import com.tutor_management.backend.modules.submission.repository.SubmissionRepository;
import com.tutor_management.backend.modules.shared.service.CloudinaryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Standard implementation of {@link ExerciseService}.
 * Handles persistence, complex nested entity updates, and transactional safety.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExerciseServiceImpl implements ExerciseService {

    private final ExerciseRepository exerciseRepository;
    private final QuestionRepository questionRepository;
    private final OptionRepository optionRepository;
    private final ExerciseParserService parserService;
    private final ExerciseAssignmentRepository assignmentRepository;
    private final SubmissionRepository submissionRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final com.tutor_management.backend.modules.tutor.repository.TutorRepository tutorRepository;
    private final SecurityContextUtils securityContextUtils;
    private final ApplicationEventPublisher eventPublisher;
    private final CloudinaryService cloudinaryService;

    private Long getTutorId(String teacherId) {
        if (teacherId == null) return null;
        try {
            Long userId = Long.parseLong(teacherId);
            return tutorRepository.findByUserId(userId)
                    .map(com.tutor_management.backend.modules.tutor.entity.Tutor::getId)
                    .orElse(null);
        } catch (NumberFormatException e) {
            log.warn("Invalid teacherId format: {}", teacherId);
            return null;
        }
    }

    @Override
    public ImportPreviewResponse previewImport(ImportExerciseRequest request) {
        log.info("Requesting preview for ingested text (length: {})", request.getContent().length());
        return parserService.parseFromText(request.getContent());
    }

    @Override
    public String uploadQuestionImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Không thể tải lên file rỗng");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Chỉ hỗ trợ tải lên file ảnh");
        }

        try {
            return cloudinaryService.uploadFile(file);
        } catch (Exception e) {
            log.error("Failed to upload question image", e);
            throw new RuntimeException("Không thể tải ảnh câu hỏi lên", e);
        }
    }

    @Override
    @Transactional
    public ExerciseResponse createExercise(CreateExerciseRequest request, String teacherId) {
        log.info("Starting creation of exercise '{}' by teacher {}", request.getTitle(), teacherId);
        log.info("Received {} questions in request", request.getQuestions() != null ? request.getQuestions().size() : 0);
        
        Long tutorId = getTutorId(teacherId);
        if (tutorId == null) {
            throw new RuntimeException("Tutor profile not found for user ID: " + teacherId);
        }

        Exercise exercise = Exercise.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .timeLimit(request.getTimeLimit())
                .totalPoints(request.getTotalPoints())
                .deadline(request.getDeadline())
                .status(request.getStatus() != null ? request.getStatus() : ExerciseStatus.DRAFT)
                .classId(request.getClassId())
                .createdBy(teacherId)
                .tutorId(tutorId)
                .questions(new LinkedHashSet<>())
                .build();

        processQuestionsFromRequest(request.getQuestions(), exercise);
        log.info("After processing, exercise has {} questions", exercise.getQuestions().size());

        Exercise savedExercise = exerciseRepository.save(exercise);
        log.info("Exercise created successfully. Generated UUID: {}, Final question count: {}", savedExercise.getId(), savedExercise.getQuestions().size());
        
        return mapToExerciseResponse(savedExercise);
    }

    @Override
    @Transactional
    public ExerciseResponse updateExercise(String id, CreateExerciseRequest request, String teacherId) {
        log.info("Processing update for exercise {} by teacher {}", id, teacherId);

        Exercise exercise = exerciseRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập với ID: " + id));

        verifyExerciseOwnership(exercise, teacherId);

        updateBasicMetadata(exercise, request);

        // Reconstruct the question graph
        exercise.getQuestions().clear();
        processQuestionsFromRequest(request.getQuestions(), exercise);

        Exercise updatedExercise = exerciseRepository.save(exercise);
        notifyStudentsOfUpdate(updatedExercise, teacherId);

        log.info("Exercise update committed: {}", id);
        return mapToExerciseResponse(updatedExercise);
    }

    @Override
    @Transactional(readOnly = true)
    public ExerciseResponse getExercise(String id) {
        log.debug("Fetching exercise details for ID: {}", id);
        
        Exercise exercise = exerciseRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập với ID: " + id));

        return mapToExerciseResponse(exercise);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExerciseListItemResponse> listExercises(String classId, ExerciseStatus status, String search, Pageable pageable) {
        // Centralized identity resolution for multi-tenancy filtering
        Long tutorId = securityContextUtils.getCurrentTutorId();
        
        log.debug("Listing exercises (TutorID={}, Filter: class={}, status={}, search={}, page={})", tutorId, classId, status, search, pageable.getPageNumber());
        return exerciseRepository.findByFiltersOptimized(classId, status, search, tutorId, pageable);
    }

    @Override
    @Transactional
    public void deleteExercise(String id, String teacherId) {
        log.warn("Initiating destructive deletion of exercise {} by tutor {}", id, teacherId);

        Exercise exercise = exerciseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập với ID: " + id));

        verifyExerciseOwnership(exercise, teacherId);

        performCascadedRemoval(id);
        
        exerciseRepository.delete(exercise);
        log.info("Exercise and all associated history successfully deleted: {}", id);
    }

    @Override
    @Transactional
    public void assignToStudent(String exerciseId, String studentId, String tutorId, LocalDateTime deadline) {
        log.info("Assigning exercise {} to student {}", exerciseId, studentId);
        
        Exercise sourceExercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập gốc"));

        ExerciseAssignment assignment = assignmentRepository
                .findByExerciseIdAndStudentId(exerciseId, studentId)
                .orElseGet(() -> ExerciseAssignment.builder()
                        .exerciseId(exerciseId)
                        .studentId(studentId)
                        .assignedBy(tutorId)
                        .status(AssignmentStatus.PENDING)
                        .build());

        // Update or set the specific deadline for this student
        assignment.setDeadline(deadline != null ? deadline : sourceExercise.getDeadline());
        
        // Migration fix: Ensure assignedBy is set even for legacy records
        if (assignment.getAssignedBy() == null) {
            assignment.setAssignedBy(tutorId);
        }

        assignmentRepository.save(assignment);
        
        // Ensure a submission record exists with PENDING status
        submissionRepository.findByExerciseIdAndStudentId(exerciseId, studentId)
                .orElseGet(() -> submissionRepository.save(com.tutor_management.backend.modules.submission.entity.Submission.builder()
                        .exerciseId(exerciseId)
                        .studentId(studentId)
                        .status(com.tutor_management.backend.modules.submission.entity.SubmissionStatus.PENDING)
                        .build()));

        notifyStudentOfAssignment(sourceExercise, studentId, tutorId);
        
        log.info("Assignment record and pending submission committed for student {}", studentId);
    }

    @Override
    @Transactional
    public void revokeAssignment(String exerciseId, List<String> studentIds, String tutorId) {
        List<String> normalizedStudentIds = (studentIds == null ? List.<String>of() : studentIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList());

        if (normalizedStudentIds.isEmpty()) {
            throw new ResourceNotFoundException("Không tìm thấy học sinh để thu hồi bài tập");
        }

        Exercise exercise = exerciseRepository.findById(exerciseId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài tập gốc"));

        List<ExerciseAssignment> matchedAssignments = normalizedStudentIds.stream()
                .map(candidateId -> assignmentRepository.findByExerciseIdAndStudentId(exerciseId, candidateId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();

        if (matchedAssignments.isEmpty()) {
            throw new ResourceNotFoundException("Bài tập chưa được giao cho học sinh này");
        }

        boolean isAdmin = securityContextUtils.getCurrentUser()
                .map(user -> "ADMIN".equals(user.getRole().getName()))
                .orElse(false);

        LinkedHashSet<String> tutorIdentityCandidates = new LinkedHashSet<>();
        tutorIdentityCandidates.add(tutorId);
        Long tutorProfileId = getTutorId(tutorId);
        if (tutorProfileId != null) {
            tutorIdentityCandidates.add(tutorProfileId.toString());
        }

        boolean canManageByOwnership = isAdmin
                || tutorIdentityCandidates.contains(exercise.getCreatedBy())
                || (tutorProfileId != null && Objects.equals(exercise.getTutorId(), tutorProfileId));

        List<ExerciseAssignment> revocableAssignments;
        if (canManageByOwnership) {
            revocableAssignments = matchedAssignments;
        } else {
            revocableAssignments = matchedAssignments.stream()
                    .filter(assignment -> assignment.getAssignedBy() != null
                            && tutorIdentityCandidates.contains(assignment.getAssignedBy()))
                    .toList();
            if (revocableAssignments.isEmpty()) {
                throw new SecurityException("Bạn không có quyền thu hồi bài tập này");
            }
        }

        List<String> revocableStudentIds = revocableAssignments.stream()
                .map(ExerciseAssignment::getStudentId)
                .distinct()
                .toList();

        List<Submission> relatedSubmissions = revocableStudentIds.stream()
                .map(candidateId -> submissionRepository.findByExerciseIdAndStudentId(exerciseId, candidateId))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();

        boolean hasFinalizedSubmission = relatedSubmissions.stream()
                .anyMatch(submission -> submission.getStatus() == SubmissionStatus.DRAFT
                        || submission.getStatus() == SubmissionStatus.SUBMITTED
                        || submission.getStatus() == SubmissionStatus.GRADED);
        if (hasFinalizedSubmission) {
            throw new IllegalStateException("Chỉ có thể thu hồi bài ở trạng thái chờ làm");
        }

        relatedSubmissions.forEach(submissionRepository::delete);

        revocableAssignments.forEach(assignmentRepository::delete);

        log.info("Revoked {} assignment(s) for exercise {} and student identities {}", revocableAssignments.size(), exerciseId, revocableStudentIds);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExerciseListItemResponse> listAssignedExercises(String studentId, Long tutorId, Pageable pageable) {
        return listAssignedExercisesByStudentIds(List.of(studentId), tutorId, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExerciseListItemResponse> listAssignedExercisesByStudentIds(List<String> studentIds, Long tutorId, Pageable pageable) {
        List<String> normalizedStudentIds = (studentIds == null ? List.<String>of() : studentIds.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList());

        if (normalizedStudentIds.isEmpty()) {
            return Page.empty(pageable);
        }

        log.debug("Synthesizing assigned exercises view for student identities {} (Filter TutorID: {}, Page: {})",
                normalizedStudentIds, tutorId, pageable.getPageNumber());

        Page<ExerciseAssignment> assignmentsPage = (tutorId != null)
                ? assignmentRepository.findByStudentIdsAndTutorId(normalizedStudentIds, tutorId, pageable)
                : assignmentRepository.findByStudentIdIn(normalizedStudentIds, pageable);

        if (assignmentsPage.isEmpty()) return Page.empty(pageable);

        List<ExerciseAssignment> assignments = assignmentsPage.getContent();
        List<String> exerciseIds = assignments.stream()
                .map(ExerciseAssignment::getExerciseId)
                .collect(Collectors.toList());

        List<ExerciseListItemResponse> responses = exerciseRepository.findAllByIdOptimized(exerciseIds);

        Map<String, ExerciseListItemResponse> respMap = responses.stream()
                .collect(Collectors.toMap(ExerciseListItemResponse::getId, r -> r));

        List<ExerciseListItemResponse> orderedResponses = assignments.stream()
                .map(a -> respMap.get(a.getExerciseId()))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        enrichWithStudentProgress(orderedResponses, normalizedStudentIds, assignments);

        return new PageImpl<>(orderedResponses, pageable, assignmentsPage.getTotalElements());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TutorStudentSummaryResponse> getStudentSummaries(Long tutorId, Pageable pageable) {
        log.info("Aggregating student performance summaries (Input TutorId: {}, Page: {})", tutorId, pageable.getPageNumber());
        
        // Ensure we use the resolved identity if provided tutorId is null (though calling controller passes it)
        Long activeTutorId = (tutorId != null) ? tutorId : securityContextUtils.getCurrentTutorId();
        
        Page<com.tutor_management.backend.modules.student.entity.Student> studentsPage;
        if (activeTutorId != null) {
            studentsPage = studentRepository.findByTutorIdAndActiveTrueWithParent(activeTutorId, pageable);
        } else if (securityContextUtils.getCurrentUser().map(u -> "ADMIN".equals(u.getRole().getName())).orElse(false)) {
            // Only Admins see everything if tutorId/activeTutorId is null
            studentsPage = studentRepository.findByActiveTrueWithParent(pageable);
        } else {
            // Unidentified non-admin sees nothing
            return Page.empty();
        }
        
        if (studentsPage.isEmpty()) return Page.empty();

        List<String> profileStudentIds = studentsPage.getContent().stream()
                .map(s -> s.getId().toString())
                .collect(Collectors.toList());

        Map<String, List<String>> identityKeyMap = new HashMap<>();
        for (String profileId : profileStudentIds) {
            identityKeyMap.put(profileId, new ArrayList<>(List.of(profileId)));
        }

        List<Long> studentProfileIds = studentsPage.getContent().stream().map(com.tutor_management.backend.modules.student.entity.Student::getId).toList();
        for (User linkedUser : userRepository.findByStudentIdIn(studentProfileIds)) {
            if (linkedUser.getStudentId() == null || linkedUser.getId() == null) {
                continue;
            }
            String profileId = linkedUser.getStudentId().toString();
            identityKeyMap.computeIfAbsent(profileId, ignored -> new ArrayList<>(List.of(profileId)));
            identityKeyMap.get(profileId).add(linkedUser.getId().toString());
        }

        List<TutorStudentSummaryResponse> content = studentsPage.getContent().stream().map(student -> {
            String sId = student.getId().toString();
            Map<com.tutor_management.backend.modules.submission.entity.SubmissionStatus, Integer> counts =
                    aggregateStudentStatusesByExercise(identityKeyMap.getOrDefault(sId, List.of(sId)), activeTutorId);
            
            int pending = counts.getOrDefault(com.tutor_management.backend.modules.submission.entity.SubmissionStatus.PENDING, 0);
            int submitted = counts.getOrDefault(com.tutor_management.backend.modules.submission.entity.SubmissionStatus.SUBMITTED, 0) + 
                            counts.getOrDefault(com.tutor_management.backend.modules.submission.entity.SubmissionStatus.DRAFT, 0);
            int graded = counts.getOrDefault(com.tutor_management.backend.modules.submission.entity.SubmissionStatus.GRADED, 0);
            int total = pending + submitted + graded;
            
            return TutorStudentSummaryResponse.builder()
                    .studentId(sId)
                    .studentName(student.getName())
                    .grade("N/A") 
                    .pendingCount(pending)
                    .submittedCount(submitted)
                    .gradedCount(graded)
                    .totalAssigned(total)
                    .build();
        }).collect(Collectors.toList());

        return new PageImpl<>(content, pageable, studentsPage.getTotalElements());
    }

    private Map<SubmissionStatus, Integer> aggregateStudentStatusesByExercise(List<String> identityKeys, Long tutorId) {
        List<String> normalizedKeys = (identityKeys == null ? List.<String>of() : identityKeys.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .toList());

        if (normalizedKeys.isEmpty()) {
            return Collections.emptyMap();
        }

        List<ExerciseAssignment> assignments = assignmentRepository.findAllByStudentIdsAndTutorId(normalizedKeys, tutorId);
        if (assignments.isEmpty()) {
            return Collections.emptyMap();
        }

        Map<String, ExerciseAssignment> assignmentByExercise = new LinkedHashMap<>();
        for (ExerciseAssignment assignment : assignments) {
            assignmentByExercise.putIfAbsent(assignment.getExerciseId(), assignment);
        }

        List<String> exerciseIds = new ArrayList<>(assignmentByExercise.keySet());
        List<Submission> submissions = normalizedKeys.stream()
                .flatMap(identity -> submissionRepository.findByStudentIdAndExerciseIdIn(identity, exerciseIds).stream())
                .toList();

        Map<String, Submission> submissionByExercise = submissions.stream().collect(Collectors.toMap(
                Submission::getExerciseId,
                s -> s,
                this::pickPreferredSubmission
        ));

        Map<SubmissionStatus, Integer> counts = new EnumMap<>(SubmissionStatus.class);
        for (String exerciseId : assignmentByExercise.keySet()) {
            SubmissionStatus status = Optional.ofNullable(submissionByExercise.get(exerciseId))
                    .map(Submission::getStatus)
                    .orElse(SubmissionStatus.PENDING);
            counts.merge(status, 1, Integer::sum);
        }

        return counts;
    }

    // --- Private Business Helpers ---

    private void verifyExerciseOwnership(Exercise exercise, String teacherId) {
        boolean isAdmin = securityContextUtils.getCurrentUser()
                .map(user -> "ADMIN".equals(user.getRole().getName()))
                .orElse(false);
        if (isAdmin) {
            return;
        }

        LinkedHashSet<String> tutorIdentityCandidates = new LinkedHashSet<>();
        tutorIdentityCandidates.add(teacherId);
        Long tutorProfileId = getTutorId(teacherId);
        if (tutorProfileId != null) {
            tutorIdentityCandidates.add(tutorProfileId.toString());
        }

        boolean isOwner = tutorIdentityCandidates.contains(exercise.getCreatedBy())
                || (tutorProfileId != null && Objects.equals(exercise.getTutorId(), tutorProfileId));

        if (!isOwner) {
            log.error("Security violation: Teacher {} attempted to modify exercise owned by createdBy={} tutorId={}",
                    teacherId, exercise.getCreatedBy(), exercise.getTutorId());
            throw new SecurityException("Bạn không có quyền thực hiện thao tác này trên bài tập này");
        }
    }

    private void updateBasicMetadata(Exercise exercise, CreateExerciseRequest request) {
        exercise.setTitle(request.getTitle());
        exercise.setDescription(request.getDescription());
        exercise.setTimeLimit(request.getTimeLimit());
        exercise.setTotalPoints(request.getTotalPoints());
        exercise.setDeadline(request.getDeadline());
        exercise.setClassId(request.getClassId());
        if (request.getStatus() != null) {
            exercise.setStatus(request.getStatus());
        }
    }

    private void processQuestionsFromRequest(List<QuestionRequest> questionRequests, Exercise exercise) {
        if (questionRequests == null) {
            log.warn("Question requests list is null");
            return;
        }
        
        log.info("Processing {} question requests", questionRequests.size());
        
        for (QuestionRequest qReq : questionRequests) {
            log.debug("Processing question at index {}: type={}, text={}", qReq.getOrderIndex(), qReq.getType(), qReq.getQuestionText().substring(0, Math.min(50, qReq.getQuestionText().length())));
            
            Question question = Question.builder()
                    .exercise(exercise)
                    .type(qReq.getType())
                    .questionText(qReq.getQuestionText())
                    .imageUrl(qReq.getImageUrl())
                    .points(qReq.getPoints())
                    .orderIndex(qReq.getOrderIndex())
                    .rubric(qReq.getRubric())
                    .options(new LinkedHashSet<>())
                    .build();

            if (qReq.getType() == QuestionType.MCQ && qReq.getOptions() != null) {
                processOptionsForQuestion(qReq, question);
            }
            
            exercise.addQuestion(question);
        }
        
        log.info("Finished processing questions. Total added to exercise: {}", exercise.getQuestions().size());
    }

    private void processOptionsForQuestion(QuestionRequest qReq, Question question) {
        for (OptionRequest oReq : qReq.getOptions()) {
            Option option = Option.builder()
                    .question(question)
                    .label(oReq.getLabel())
                    .optionText(oReq.getOptionText())
                    .isCorrect(oReq.getLabel().equals(qReq.getCorrectAnswer()))
                    .build();
            question.addOption(option);
        }
    }

    private void performCascadedRemoval(String exerciseId) {
        // Clear student interaction data
        submissionRepository.deleteAnswersByExerciseId(exerciseId);
        submissionRepository.deleteSubmissionsByExerciseId(exerciseId);
        assignmentRepository.deleteByExerciseId(exerciseId);

        // Clear resource structure
        optionRepository.deleteByExerciseId(exerciseId);
        questionRepository.deleteByExerciseId(exerciseId);
    }

    private void enrichWithStudentProgress(List<ExerciseListItemResponse> responses, List<String> studentIds, List<ExerciseAssignment> assignments) {
        List<String> ids = responses.stream().map(ExerciseListItemResponse::getId).collect(Collectors.toList());

        List<Submission> submissions = studentIds.stream()
                .distinct()
                .flatMap(sid -> submissionRepository.findByStudentIdAndExerciseIdIn(sid, ids).stream())
                .toList();

        log.info("Enriching {} exercises for student identities {}. Found {} submissions in DB.", responses.size(), studentIds, submissions.size());

        var subMap = submissions.stream().collect(Collectors.toMap(
                Submission::getExerciseId,
                s -> s,
            this::pickPreferredSubmission
        ));

        var deadlineMap = assignments.stream()
                .collect(Collectors.toMap(ExerciseAssignment::getExerciseId, 
                        a -> a.getDeadline() != null ? a.getDeadline() : LocalDateTime.now(), (d1, d2) -> d1));

        responses.forEach(resp -> {
            resp.setDeadline(deadlineMap.get(resp.getId()));
            
            var sub = subMap.get(resp.getId());
            if (sub != null) {
                log.info("Matched submission {} (status: {}) for exercise {}", sub.getId(), sub.getStatus(), resp.getId());
                resp.setSubmissionId(sub.getId());
                
                // Add Overdue logic
                String internalStatus = sub.getStatus().name();
                if (sub.getStatus() == SubmissionStatus.PENDING && resp.getDeadline() != null && resp.getDeadline().isBefore(LocalDateTime.now())) {
                    internalStatus = "OVERDUE";
                }
                
                resp.setSubmissionStatus(internalStatus);
                resp.setStudentTotalScore(sub.getTotalScore());
            } else {
                log.info("No matching submission found for exercise {}. Defaulting to PENDING.", resp.getId());
                resp.setSubmissionStatus("PENDING");
            }
        });
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

    // --- Events & Notifications ---

    private void notifyStudentsOfUpdate(Exercise exercise, String teacherId) {
        try {
            String tutorName = fetchTeacherName(teacherId);
            eventPublisher.publishEvent(ExerciseUpdatedEvent.builder()
                    .exerciseId(exercise.getId())
                    .exerciseTitle(exercise.getTitle())
                    .tutorName(tutorName)
                    .build());
        } catch (Exception e) {
            log.error("Critical error while dispatching exercise update notification", e);
        }
    }

    private void notifyStudentOfAssignment(Exercise exercise, String studentId, String tutorId) {
        try {
            String tutorName = fetchTeacherName(tutorId);
            eventPublisher.publishEvent(ExerciseAssignedEvent.builder()
                    .exerciseId(exercise.getId())
                    .exerciseTitle(exercise.getTitle())
                    .studentId(studentId)
                    .tutorName(tutorName)
                    .build());
        } catch (Exception e) {
            log.error("Critical error while dispatching exercise assignment notification", e);
        }
    }

    private String fetchTeacherName(String teacherId) {
        try {
            return userRepository.findById(Long.parseLong(teacherId))
                    .map(u -> u.getFullName())
                    .orElse("Giáo viên");
        } catch (Exception e) {
            return "Giáo viên";
        }
    }

    // --- Standard Domain Mappers ---

    private ExerciseResponse mapToExerciseResponse(Exercise exercise) {
        return ExerciseResponse.builder()
                .id(exercise.getId())
                .title(exercise.getTitle())
                .description(exercise.getDescription())
                .timeLimit(exercise.getTimeLimit())
                .totalPoints(exercise.getTotalPoints())
                .deadline(exercise.getDeadline())
                .status(exercise.getStatus())
                .classId(exercise.getClassId())
                .createdBy(exercise.getCreatedBy())
                .createdAt(exercise.getCreatedAt())
                .updatedAt(exercise.getUpdatedAt())
                .questions(exercise.getQuestions().stream().map(this::mapToQuestionResponse).collect(Collectors.toList()))
                .build();
    }

    private QuestionResponse mapToQuestionResponse(Question question) {
        return QuestionResponse.builder()
                .id(question.getId())
                .type(question.getType())
                .questionText(question.getQuestionText())
                .imageUrl(question.getImageUrl())
                .points(question.getPoints())
                .orderIndex(question.getOrderIndex())
                .rubric(question.getRubric())
                .options(question.getOptions().stream().map(this::mapToOptionResponse).collect(Collectors.toList()))
                .build();
    }

    private OptionResponse mapToOptionResponse(Option option) {
        return OptionResponse.builder()
                .id(option.getId())
                .label(option.getLabel())
                .optionText(option.getOptionText())
                .isCorrect(option.getIsCorrect())
                .build();
    }
}
