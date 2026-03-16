package com.tutor_management.backend.modules.course.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.tutor_management.backend.modules.course.entity.Course;
import com.tutor_management.backend.modules.course.entity.CourseAssignment;
import com.tutor_management.backend.modules.course.entity.CourseLesson;
import com.tutor_management.backend.modules.course.entity.LessonProgress;
import com.tutor_management.backend.modules.course.repository.CourseAssignmentRepository;
import com.tutor_management.backend.modules.course.repository.CourseRepository;
import com.tutor_management.backend.modules.course.repository.LessonProgressRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tutor_management.backend.exception.ResourceNotFoundException;
import com.tutor_management.backend.modules.course.dto.request.AssignCourseRequest;
import com.tutor_management.backend.modules.course.dto.response.CourseAssignmentResponse;
import com.tutor_management.backend.modules.course.dto.response.StudentCourseDetailResponse;
import com.tutor_management.backend.modules.course.dto.response.StudentCourseLessonDTO;
import com.tutor_management.backend.modules.course.enums.AssignmentStatus;
import com.tutor_management.backend.modules.lesson.entity.LessonAssignment;
import com.tutor_management.backend.modules.lesson.repository.LessonAssignmentRepository;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service orchestrating course enrollments and student progress tracking.
 * Manages the complex relationships between students, courses, lessons, and assignments.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CourseAssignmentService {

    private final CourseAssignmentRepository courseAssignmentRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final LessonAssignmentRepository lessonAssignmentRepository;
    private final LessonProgressRepository lessonProgressRepository;

    /**
     * Enrolls students in a course and initializes their lesson progress trackers.
     * 
     * @param courseId ID of the course to assign
     * @param request List of students and optional deadline
     * @param assignedBy Username of the assigner
     * @return List of enrollment confirmation responses
     */
    public List<CourseAssignmentResponse> assignCourseToStudents(Long courseId, AssignCourseRequest request,
            String assignedBy) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));

        List<CourseAssignmentResponse> responses = new ArrayList<>();

        for (Long studentId : request.getStudentIds()) {
            Student student = studentRepository.findById(studentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

            // 1. Manage the core CourseAssignment record
            CourseAssignment assignment = courseAssignmentRepository
                    .findByCourseIdAndStudentId(courseId, studentId)
                    .orElseGet(() -> CourseAssignment.builder()
                            .course(course)
                            .student(student)
                            .status(AssignmentStatus.NOT_STARTED)
                            .progressPercentage(0)
                            .build());

            assignment.setDeadline(request.getDeadline());
            CourseAssignment savedAssignment = courseAssignmentRepository.save(assignment);

            // 2. Provision lesson-level access and progress tracking
            provisionLessonsForStudent(course, student, assignedBy);

            responses.add(CourseAssignmentResponse.fromEntity(savedAssignment));
        }

        return responses;
    }

    /**
     * Ensures that for each lesson in the course, the student has an associated LessonAssignment and LessonProgress record.
     * This method is idempotent and can be safely called multiple times without creating duplicates.
     */
    private void provisionLessonsForStudent(Course course, Student student, String assignedBy) {
        Long studentId = student.getId();
        for (CourseLesson courseLesson : course.getCourseLessons()) {
            Long lessonId = courseLesson.getLesson().getId();

            // Ensure individual lesson assignment exists
            if (!lessonAssignmentRepository.existsByLessonIdAndStudentId(lessonId, studentId)) {
                LessonAssignment lessonAssignment = LessonAssignment.builder()
                        .lesson(courseLesson.getLesson())
                        .student(student)
                        .assignedDate(LocalDate.now())
                        .assignedBy(assignedBy)
                        .isCompleted(false)
                        .viewCount(0)
                        .build();
                lessonAssignmentRepository.save(lessonAssignment);
            }

            // Ensure progress tracking record exists
            if (!lessonProgressRepository.existsByStudentIdAndLessonId(studentId, lessonId)) {
                LessonProgress progress = LessonProgress.builder()
                        .lesson(courseLesson.getLesson())
                        .student(student)
                        .isCompleted(false)
                        .build();
                lessonProgressRepository.save(progress);
            }
        }
    }

    /**
     * Lists all manual assignments for a specific course.
     */
    @Transactional(readOnly = true)
    public List<CourseAssignmentResponse> getCourseAssignments(Long courseId) {
        return courseAssignmentRepository.findByCourseIdWithDetails(courseId).stream()
                .map(CourseAssignmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Lists all courses a specific student is enrolled in.
     */
    @Transactional(readOnly = true)
    public List<CourseAssignmentResponse> getStudentCourses(Long studentId) {
        return courseAssignmentRepository.findByStudentIdWithDetails(studentId).stream()
                .map(CourseAssignmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Fetches the personalized view of a course for a student.
     * Optimized with batch loading to prevent N+1 queries when loading curriculum progress.
     */
    @Transactional(readOnly = true)
    public StudentCourseDetailResponse getStudentCourseDetail(Long courseId, Long studentId) {
        CourseAssignment assignment = courseAssignmentRepository
                .findByCourseIdAndStudentIdWithFullDetails(courseId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Course assignment not found for student " + studentId + " and course " + courseId));

        Course course = assignment.getCourse();
        List<Long> lessonIds = course.getCourseLessons().stream()
                .map(cl -> cl.getLesson().getId())
                .collect(Collectors.toList());

        // Load all lesson progress in a single batch query
        Map<Long, LessonProgress> progressMap = lessonProgressRepository
                .findByStudentIdAndLessonIdIn(studentId, lessonIds).stream()
                .collect(Collectors.toMap(lp -> lp.getLesson().getId(), lp -> lp));

        List<StudentCourseLessonDTO> lessons = course.getCourseLessons().stream()
                .map(cl -> {
                    LessonProgress progress = progressMap.get(cl.getLesson().getId());
                    return StudentCourseLessonDTO.builder()
                            .id(cl.getId())
                            .lessonId(cl.getLesson().getId())
                            .title(cl.getLesson().getTitle())
                            .summary(cl.getLesson().getSummary())
                            .lessonOrder(cl.getLessonOrder())
                            .isRequired(cl.getIsRequired())
                            .isCompleted(progress != null && Boolean.TRUE.equals(progress.getIsCompleted()))
                            .completedAt(progress != null ? progress.getCompletedAt() : null)
                            .videoProgress(progress != null ? progress.getVideoProgress() : 0)
                            .canUnlockNext(progress != null && progress.canUnlockNext())
                            .build();
                })
                .collect(Collectors.toList());

        return StudentCourseDetailResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .thumbnailUrl(course.getThumbnailUrl())
                .difficultyLevel(course.getDifficultyLevel())
                .estimatedHours(course.getEstimatedHours())
                .tutorName(course.getTutor() != null ? course.getTutor().getFullName() : "Unknown")
                .status(assignment.getStatus().name())
                .progressPercentage(assignment.getProgressPercentage())
                .assignedDate(assignment.getAssignedDate())
                .deadline(assignment.getDeadline())
                .completedAt(assignment.getCompletedAt())
                .lessons(lessons)
                .build();
    }

    /**
     * Unenrolls a student from a course.
     */
    public void removeStudentFromCourse(Long courseId, Long studentId) {
        courseAssignmentRepository.findByCourseIdAndStudentId(courseId, studentId)
                .ifPresent(courseAssignmentRepository::delete);
    }

    /**
     * Reactively updates course progress percentages when a lesson is marked as complete.
     */
    public void updateProgressOnLessonCompletion(Long studentId, Long lessonId, boolean completed) {
        lessonProgressRepository.findByStudentIdAndLessonId(studentId, lessonId)
                .ifPresent(progress -> {
                    progress.setIsCompleted(completed);
                    progress.setCompletedAt(completed ? LocalDateTime.now() : null);
                    lessonProgressRepository.save(progress);
                });

        // Trigger recalculation for all courses containing this lesson
        List<CourseAssignment> assignments = courseAssignmentRepository
                .findByStudentIdWithCourseLessons(studentId);

        for (CourseAssignment assignment : assignments) {
            boolean lessonIncludedInCourse = assignment.getCourse().getCourseLessons().stream()
                    .anyMatch(cl -> cl.getLesson().getId().equals(lessonId));

            if (lessonIncludedInCourse) {
                recalculateCourseProgress(assignment);
            }
        }
    }

    /**
     * Recalculates the overall course progress percentage based on completed lessons.
     * Updates the assignment status accordingly.
     */
    private void recalculateCourseProgress(CourseAssignment assignment) {
        List<CourseLesson> courseLessons = assignment.getCourse().getCourseLessons();
        if (courseLessons.isEmpty()) return;

        List<Long> lessonIds = courseLessons.stream()
                .map(cl -> cl.getLesson().getId())
                .collect(Collectors.toList());

        long completedCount = lessonProgressRepository
                .countCompletedByStudentIdAndLessonIdIn(assignment.getStudent().getId(), lessonIds);

        int percentage = (int) ((completedCount * 100.0) / courseLessons.size());
        assignment.setProgressPercentage(percentage);

        updateAssignmentStatusByProgress(assignment, percentage);
        courseAssignmentRepository.save(assignment);
        
        log.info("Recalculated progress for course {} student {}: {}%",
                assignment.getCourse().getId(), assignment.getStudent().getId(), percentage);
    }

    /**
     * Updates the assignment status based on the current progress percentage.
     */
    private void updateAssignmentStatusByProgress(CourseAssignment assignment, int percentage) {
        if (percentage == 100) {
            assignment.setStatus(AssignmentStatus.COMPLETED);
            assignment.setCompletedAt(LocalDateTime.now());
        } else if (percentage > 0) {
            assignment.setStatus(AssignmentStatus.IN_PROGRESS);
            assignment.setCompletedAt(null);
        } else {
            assignment.setStatus(AssignmentStatus.NOT_STARTED);
            assignment.setCompletedAt(null);
        }
    }
}
