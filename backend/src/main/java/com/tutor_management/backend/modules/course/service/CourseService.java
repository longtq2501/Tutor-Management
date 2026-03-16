package com.tutor_management.backend.modules.course.service;

import java.util.List;

import com.tutor_management.backend.modules.course.entity.Course;
import com.tutor_management.backend.modules.course.entity.CourseLesson;
import com.tutor_management.backend.modules.course.repository.CourseLessonRepository;
import com.tutor_management.backend.modules.course.repository.CourseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import com.tutor_management.backend.exception.ResourceNotFoundException;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.course.dto.request.CourseRequest;
import com.tutor_management.backend.modules.course.dto.response.CourseDetailResponse;
import com.tutor_management.backend.modules.course.dto.response.CourseResponse;
import com.tutor_management.backend.modules.course.projection.CourseListProjection;
import com.tutor_management.backend.modules.lesson.entity.Lesson;
import com.tutor_management.backend.modules.lesson.repository.LessonRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing the lifecycle of courses and their curriculum.
 * Provides caching for performance and transactional integrity for updates.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseLessonRepository courseLessonRepository;
    private final LessonRepository lessonRepository;
    private final UserRepository userRepository;

    /**
     * Retrieves all available courses using memory-efficient projections.
     * Results are cached for 5 minutes.
     * 
     * @return List of courses in projection format
     */
    @Cacheable(value = "courseList")
    @Transactional(readOnly = true)
    public List<CourseListProjection> getAllCourses() {
        return courseRepository.findAllCoursesProjection();
    }

    /**
     * Fetches full course details including the ordered curriculum.
     * 
     * @param id Course ID
     * @return Detailed course response
     * @throws ResourceNotFoundException if ID doesn't exist
     */
    @Cacheable(value = "courseDetail", key = "#id")
    @Transactional(readOnly = true)
    public CourseDetailResponse getCourseById(Long id) {
        Course course = courseRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));
        return CourseDetailResponse.fromEntity(course);
    }

    /**
     * Creates a new course and optionally assembles an initial curriculum.
     * Clears all course-related caches to ensure data consistency.
     * 
     * @param request Data for the new course
     * @param tutor The user authoring the course
     * @return Summary response of the created course
     */
    @CacheEvict(value = {"courseList", "courseDetail"}, allEntries = true)
    public CourseResponse createCourse(CourseRequest request, User tutor) {
        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .difficultyLevel(request.getDifficultyLevel())
                .estimatedHours(request.getEstimatedHours())
                .isPublished(Boolean.TRUE.equals(request.getIsPublished()))
                .tutor(tutor)
                .build();

        Course savedCourse = courseRepository.save(course);

        if (request.getLessonIds() != null && !request.getLessonIds().isEmpty()) {
            addLessonsToCourse(savedCourse.getId(), request.getLessonIds());
        }

        return CourseResponse.fromEntity(savedCourse);
    }

    /**
     * Updates an existing course's metadata and synchronizes its curriculum.
     * 
     * @param id Target Course ID
     * @param request Updated data
     * @return Updated course summary
     */
    @CacheEvict(value = {"courseList", "courseDetail"}, allEntries = true)
    public CourseResponse updateCourse(Long id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));

        if (request.getTitle() != null) course.setTitle(request.getTitle());
        if (request.getDescription() != null) course.setDescription(request.getDescription());
        if (request.getThumbnailUrl() != null) course.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getDifficultyLevel() != null) course.setDifficultyLevel(request.getDifficultyLevel());
        if (request.getEstimatedHours() != null) course.setEstimatedHours(request.getEstimatedHours());
        if (request.getIsPublished() != null) course.setIsPublished(request.getIsPublished());

        if (request.getLessonIds() != null) {
            syncCourseLessons(course, request.getLessonIds());
        }

        return CourseResponse.fromEntity(courseRepository.save(course));
    }

    /**
     * Synchronizes the course's curriculum to match the provided list of lesson IDs.
     * This method will clear existing mappings and rebuild them according to the new order.
     * 
     * @param course The course being updated
     * @param newLessonIds The new ordered list of lesson IDs for the course
     */
    private void syncCourseLessons(Course course, List<Long> newLessonIds) {
        // Clear existing mappings to rebuild the sequence
        courseLessonRepository.deleteAllByCourse(course);
        courseLessonRepository.flush();
        course.getCourseLessons().clear();

        for (int i = 0; i < newLessonIds.size(); i++) {
            Long lessonId = newLessonIds.get(i);
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lesson not found: " + lessonId));

            CourseLesson courseLesson = CourseLesson.builder()
                    .course(course)
                    .lesson(lesson)
                    .lessonOrder(i + 1)
                    .isRequired(true)
                    .build();
            course.getCourseLessons().add(courseLesson);
        }
    }

    /**
     * Permanently removes a course and all its student assignments.
     * 
     * @param id Course ID
     */
    @CacheEvict(value = {"courseList", "courseDetail"}, allEntries = true)
    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Course not found: " + id);
        }
        courseRepository.deleteById(id);
    }

    /**
     * Appends lessons to the end of a course's existing curriculum.
     */
    public void addLessonsToCourse(Long courseId, List<Long> lessonIds) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        int currentCount = course.getCourseLessons().size();

        for (int i = 0; i < lessonIds.size(); i++) {
            Long lessonId = lessonIds.get(i);
            Lesson lesson = lessonRepository.findById(lessonId)
                    .orElseThrow(() -> new ResourceNotFoundException("Lesson not found: " + lessonId));

            boolean alreadyExists = course.getCourseLessons().stream()
                    .anyMatch(cl -> cl.getLesson().getId().equals(lessonId));

            if (!alreadyExists) {
                CourseLesson courseLesson = CourseLesson.builder()
                        .course(course)
                        .lesson(lesson)
                        .lessonOrder(currentCount + i + 1)
                        .isRequired(true)
                        .build();
                course.getCourseLessons().add(courseLesson);
            }
        }

        courseRepository.save(course);
    }

    /**
     * Removes a specific lesson from a course and re-orders remaining items.
     */
    public void removeLessonFromCourse(Long courseId, Long lessonId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));

        course.getCourseLessons().removeIf(cl -> cl.getLesson().getId().equals(lessonId));

        List<CourseLesson> lessons = course.getCourseLessons();
        for (int i = 0; i < lessons.size(); i++) {
            lessons.get(i).setLessonOrder(i + 1);
        }

        courseRepository.save(course);
    }
}
