package com.tutor_management.backend.modules.lesson.service;

import com.tutor_management.backend.modules.lesson.dto.request.CreateLessonRequest;
import com.tutor_management.backend.modules.lesson.dto.response.AdminLessonResponse;
import com.tutor_management.backend.exception.ResourceNotFoundException;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.lesson.dto.response.AdminLessonSummaryResponse;
import com.tutor_management.backend.modules.lesson.entity.Lesson;
import com.tutor_management.backend.modules.lesson.entity.LessonAssignment;
import com.tutor_management.backend.modules.lesson.entity.LessonImage;
import com.tutor_management.backend.modules.lesson.entity.LessonResource;
import com.tutor_management.backend.modules.lesson.repository.LessonAssignmentRepository;
import com.tutor_management.backend.modules.course.repository.CourseLessonRepository;
import com.tutor_management.backend.modules.course.repository.LessonProgressRepository;
import com.tutor_management.backend.modules.lesson.repository.LessonCategoryRepository;
import com.tutor_management.backend.modules.lesson.repository.LessonRepository;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service for Administrative lesson management.
 * Handles mass lesson creation, cross-student updates, and deletion workflows.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AdminLessonService {

    private final LessonRepository lessonRepository;
    private final LessonAssignmentRepository assignmentRepository;
    private final StudentRepository studentRepository;
    private final LessonCategoryRepository categoryRepository;
    private final SessionRecordRepository sessionRecordRepository;
    private final TutorRepository tutorRepository;
    private final UserRepository userRepository;
    private final CourseLessonRepository courseLessonRepository;
    private final LessonProgressRepository lessonProgressRepository;

    private static final String DEFAULT_TUTOR = "Thầy Quỳnh Long";

    /**
     * Resolves the current tutor ID from the security context.
     * Returns NULL for ADMIN users (they see all lessons).
     * 
     * @return Tutor ID or NULL for admin access
     */
    private Long getCurrentTutorId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) {
            return null;
        }
        if ("ADMIN".equals(user.getRole().getName())) {
            return null; // Admin sees all lessons
        }
        return tutorRepository.findByUserId(user.getId())
                .map(Tutor::getId)
                .orElse(null);
    }

    /**
     * Verifies that the current user owns the lesson.
     * Admins bypass this check.
     * 
     * @param lesson The lesson to verify ownership for
     * @throws RuntimeException if ownership check fails
     */
    private void verifyLessonOwnership(Lesson lesson) {
        Long currentTutorId = getCurrentTutorId();
        if (currentTutorId == null) {
            return; // Admin can access all
        }
        if (lesson.getTutor() == null || !lesson.getTutor().getId().equals(currentTutorId)) {
            throw new RuntimeException("You do not have permission to modify this lesson");
        }
    }

    /**
     * Creates a central library lesson and optionally task it to multiple students.
     * 
     * @param request Creation parameters including optional student assignments.
     * @return List containing the created lesson details.
     */
    @CacheEvict(value = "lessons", allEntries = true)
    public List<AdminLessonResponse> createLessonForStudents(CreateLessonRequest request) {
        log.info("📝 Creating library lesson '{}' for {} students", request.getTitle(), 
                request.getStudentIds() != null ? request.getStudentIds().size() : 0);

        Lesson lesson = buildLessonFromRequest(request);
         lesson = lessonRepository.save(lesson);

        if (request.getStudentIds() != null && !request.getStudentIds().isEmpty()) {
            lesson.markAsAssigned();
            List<LessonAssignment> assignments = createAssignments(lesson, request.getStudentIds());
            assignmentRepository.saveAll(assignments);
            lesson = lessonRepository.save(lesson);
        }

        return List.of(AdminLessonResponse.fromEntity(lesson));
    }

    /**
     * Lists all lessons in the system with their assignment metrics.
     * Filtered by current tutor for multi-tenancy isolation.
     * 
     * @param pageable The pagination information.
     * @return Page containing lesson summary details.
     */
    @Transactional(readOnly = true)
    public Page<AdminLessonSummaryResponse> getAllLessons(Pageable pageable) {
        Long tutorId = getCurrentTutorId();
        return lessonRepository.findAllWithAssignments(tutorId, pageable)
                .map(this::mapToSummary);
    }

    /**
     * Fetches details for a single lesson record.
     * Uses optimized query to eagerly fetch collections and prevent N+1 queries.
     */
    @Transactional(readOnly = true)
    public AdminLessonResponse getLessonById(Long id) {
        return lessonRepository.findByIdWithDetails(id)
                .map(AdminLessonResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài giảng với ID: " + id));
    }

    /**
     * Updates a lesson's metadata and nested assets.
     * Verifies ownership before allowing updates.
     */
    @CacheEvict(value = "lessons", allEntries = true)
    @Transactional
    public AdminLessonResponse updateLesson(Long id, CreateLessonRequest request) {
        Lesson lesson = lessonRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài giảng ID: " + id));

        verifyLessonOwnership(lesson);
        applyUpdateToLesson(lesson, request);
        return AdminLessonResponse.fromEntity(lessonRepository.save(lesson));
    }

    /**
     * Permanently removes a lesson and its student progress records.
     * Verifies ownership before allowing deletion.
     */
    @CacheEvict(value = "lessons", allEntries = true)
    @Transactional
    public void deleteLesson(Long id) {
        Lesson lesson = lessonRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài giảng với ID: " + id));

        verifyLessonOwnership(lesson);
        int count = lesson.getAssignedStudentCount();
        
        // Cleanup all external references (Force Delete)
        sessionRecordRepository.deleteLessonReferences(id);
        courseLessonRepository.deleteByLessonId(id);
        lessonProgressRepository.deleteByLessonId(id);
        
        // Purge legacy tables if they exist (Fix for DataIntegrityViolationException)
        try {
            lessonRepository.deleteLegacyAttachments(id);
        } catch (Exception e) {
            log.warn("Could not delete from legacy lesson_attachments table: {}", e.getMessage());
        }
        
        lessonRepository.delete(lesson);
        
        log.info("✅ Deleted lesson {} and removed {} student assignments", id, count);
    }

    /**
     * Visibility toggle for lesson records.
     */
    @CacheEvict(value = "lessons", allEntries = true)
    @Transactional
    public AdminLessonResponse togglePublish(Long id) {
        Lesson lesson = lessonRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài giảng với ID: " + id));

        if (lesson.getIsPublished()) lesson.unpublish();
        else lesson.publish();

        return AdminLessonResponse.fromEntity(lessonRepository.save(lesson));
    }

    /**
     * Retrieves all lessons currently tasked to a specific student.
     * 
     * @param studentId The student's unique identifier.
     * @param pageable The pagination information.
     * @return Page of lesson summaries for the student.
     */
    @Transactional(readOnly = true)
    public Page<AdminLessonSummaryResponse> getLessonsByStudent(Long studentId, Pageable pageable) {
        if (!studentRepository.existsById(studentId)) {
            throw new ResourceNotFoundException("Không tìm thấy học sinh với ID: " + studentId);
        }
    
        return assignmentRepository.findByStudentIdOrderByAssignedDateDesc(studentId, pageable)
                .map(a -> mapToSummary(a.getLesson()));
    }

    private AdminLessonSummaryResponse mapToSummary(Lesson lesson) {
        return AdminLessonSummaryResponse.builder()
                .id(lesson.getId())
                .title(lesson.getTitle())
                .tutorName(lesson.getTutorName())
                .lessonDate(lesson.getLessonDate())
                .isPublished(lesson.getIsPublished())
                .isLibrary(lesson.getIsLibrary())
                .assignedStudentCount(lesson.getAssignedStudentCount())
                .totalViewCount(lesson.getTotalViewCount())
                .completionRate(lesson.getCompletionRate())
                .categoryName(lesson.getCategory() != null ? lesson.getCategory().getName() : null)
                .createdAt(lesson.getCreatedAt())
                .build();
    }

    // --- Private Logic ---

    private Lesson buildLessonFromRequest(CreateLessonRequest r) {
        // Resolve current tutor
        Long currentTutorId = getCurrentTutorId();
        Tutor currentTutor = null;
        if (currentTutorId != null) {
            currentTutor = tutorRepository.findById(currentTutorId)
                    .orElseThrow(() -> new RuntimeException("Tutor profile not found"));
        }

        Lesson lesson = Lesson.builder()
                .tutor(currentTutor)
                .tutorName(r.getTutorName() != null ? r.getTutorName() : DEFAULT_TUTOR)
                .title(r.getTitle()).summary(r.getSummary()).content(r.getContent())
                .lessonDate(r.getLessonDate()).videoUrl(r.getVideoUrl()).thumbnailUrl(r.getThumbnailUrl())
                .isPublished(r.getIsPublished() != null ? r.getIsPublished() : false)
                .isLibrary(r.getStudentIds() == null || r.getStudentIds().isEmpty())
                .category(r.getCategoryId() != null ? categoryRepository.findById(r.getCategoryId()).orElse(null) : null)
                .allowLateSubmission(r.getAllowLateSubmission() != null ? r.getAllowLateSubmission() : true)
                .latePenaltyPercent(r.getLatePenaltyPercent() != null ? r.getLatePenaltyPercent() : 0.0)
                .points(r.getPoints() != null ? r.getPoints() : 100)
                .passScore(r.getPassScore() != null ? r.getPassScore() : 50)
                .difficultyLevel(r.getDifficultyLevel() != null ? r.getDifficultyLevel() : "All Levels")
                .durationMinutes(r.getDurationMinutes() != null ? r.getDurationMinutes() : 0)
                .build();

        if (r.getImages() != null) {
            r.getImages().forEach(img -> lesson.getImages().add(LessonImage.builder()
                    .lesson(lesson).imageUrl(img.getImageUrl()).caption(img.getCaption())
                    .displayOrder(img.getDisplayOrder()).build()));
        }

        if (r.getResources() != null) {
            r.getResources().forEach(res -> lesson.getResources().add(LessonResource.builder()
                    .lesson(lesson).title(res.getTitle()).description(res.getDescription())
                    .resourceUrl(res.getResourceUrl()).resourceType(LessonResource.ResourceType.valueOf(res.getResourceType()))
                    .fileSize(res.getFileSize()).displayOrder(res.getDisplayOrder()).build()));
        }

        if (Boolean.TRUE.equals(r.getIsPublished())) lesson.publish();
        return lesson;
    }

    private void applyUpdateToLesson(Lesson l, CreateLessonRequest r) {
        if (r.getTutorName() != null) l.setTutorName(r.getTutorName());
        if (r.getTitle() != null) l.setTitle(r.getTitle());
        if (r.getSummary() != null) l.setSummary(r.getSummary());
        if (r.getContent() != null) l.setContent(r.getContent());
        if (r.getLessonDate() != null) l.setLessonDate(r.getLessonDate());
        if (r.getVideoUrl() != null) l.setVideoUrl(r.getVideoUrl());
        if (r.getThumbnailUrl() != null) l.setThumbnailUrl(r.getThumbnailUrl());
        l.setCategory(r.getCategoryId() != null ? categoryRepository.findById(r.getCategoryId()).orElse(null) : null);

        if (r.getImages() != null) {
            l.getImages().clear();
            r.getImages().forEach(dto -> l.getImages().add(LessonImage.builder()
                    .lesson(l).imageUrl(dto.getImageUrl()).caption(dto.getCaption()).displayOrder(dto.getDisplayOrder()).build()));
        }

        if (r.getResources() != null) {
            l.getResources().clear();
            r.getResources().forEach(dto -> l.getResources().add(LessonResource.builder()
                    .lesson(l).title(dto.getTitle()).description(dto.getDescription()).resourceUrl(dto.getResourceUrl())
                    .resourceType(LessonResource.ResourceType.valueOf(dto.getResourceType())).fileSize(dto.getFileSize())
                    .displayOrder(dto.getDisplayOrder()).build()));
        }
    }

    private List<LessonAssignment> createAssignments(Lesson lesson, List<Long> studentIds) {
        List<LessonAssignment> assignments = new ArrayList<>();
        for (Long id : studentIds) {
            Student student = studentRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh với ID: " + id));
            assignments.add(LessonAssignment.builder().lesson(lesson).student(student)
                    .assignedDate(LocalDate.now()).assignedBy(DEFAULT_TUTOR).build());
        }
        return assignments;
    }
}
