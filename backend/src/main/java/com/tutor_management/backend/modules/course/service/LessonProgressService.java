package com.tutor_management.backend.modules.course.service;

import com.tutor_management.backend.modules.course.entity.CourseLesson;
import com.tutor_management.backend.modules.course.entity.LessonProgress;
import com.tutor_management.backend.modules.course.enums.LearningStatus;
import com.tutor_management.backend.modules.course.dto.request.UpdateVideoProgressRequest;
import com.tutor_management.backend.modules.course.dto.response.CourseNavigationResponse;
import com.tutor_management.backend.modules.course.dto.response.LessonProgressResponse;
import com.tutor_management.backend.modules.course.repository.CourseLessonRepository;
import com.tutor_management.backend.modules.course.repository.LessonProgressRepository;
import com.tutor_management.backend.modules.lesson.entity.Lesson;
import com.tutor_management.backend.modules.lesson.repository.LessonRepository;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


/**
 * Service for tracking lesson progress and calculating course navigation.
 * Handles the logic for unlocking subsequent lessons based on video progress.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LessonProgressService {
    
    private final LessonProgressRepository progressRepository;
    private final CourseLessonRepository courseLessonRepository;
    private final LessonRepository lessonRepository;
    private final StudentRepository studentRepository;
    
    /**
     * Updates video watch progress for a student's lesson.
     * Creates progress record if it doesn't exist.
     * 
     * @param lessonId Targeted lesson ID
     * @param studentId ID of the student watching
     * @param request Progress update data
     * @return Updated progress response
     */
    @Transactional
    public LessonProgressResponse updateVideoProgress(
            Long lessonId, 
            Long studentId, 
            UpdateVideoProgressRequest request) {
        
        LessonProgress progress = progressRepository
            .findByStudentIdAndLessonId(studentId, lessonId)
            .orElseGet(() -> createNewProgress(studentId, lessonId));
        
        progress.updateVideoProgress(request.getProgress());
        LessonProgress saved = progressRepository.save(progress);
        
        log.info("Updated progress for student {} on lesson {}: {}% (status: {})", 
            studentId, lessonId, request.getProgress(), saved.getLearningStatus());
        
        return mapToResponse(saved);
    }
    
    /**
     * Calculates navigation metadata for a lesson within a specific course context.
     * Determines if the student can proceed to the next lesson based on progress threshold (70%).
     * 
     * @param courseId Context course ID
     * @param currentLessonId Current lesson being viewed
     * @param studentId student ID
     * @return Navigation details including unlock status
     */
    @Transactional(readOnly = true)
    public CourseNavigationResponse getCourseNavigation(
            Long courseId,
            Long currentLessonId,
            Long studentId) {
        
        CourseLesson currentCourseLesson = courseLessonRepository
            .findByCourseIdAndLessonId(courseId, currentLessonId)
            .orElseThrow(() -> new ResourceNotFoundException("Lesson not found in this course"));
        
        LessonProgress currentProgress = progressRepository
            .findByStudentIdAndLessonId(studentId, currentLessonId)
            .orElse(null);
        
        Integer currentVideoProgress = currentProgress != null ? currentProgress.getVideoProgress() : 0;
        
        CourseLesson previousLesson = courseLessonRepository
            .findPreviousLesson(courseId, currentCourseLesson.getLessonOrder())
            .orElse(null);
        
        CourseLesson nextLesson = courseLessonRepository
            .findNextLesson(courseId, currentCourseLesson.getLessonOrder())
            .orElse(null);
        
        boolean canNavigateNext = (currentProgress != null && currentProgress.canUnlockNext()) 
            && nextLesson != null;
        
        String nextLockedReason = null;
        if (nextLesson != null && !canNavigateNext) {
            nextLockedReason = "Vui lòng xem video đạt 70% để mở khóa bài học tiếp theo";
        }
        
        long totalLessons = courseLessonRepository.countByCourseId(courseId);
        long completedLessons = progressRepository.countCompletedByStudentIdAndCourseId(studentId, courseId);
        int courseProgressPercentage = totalLessons > 0 
            ? (int) ((completedLessons * 100) / totalLessons) 
            : 0;
        
        return CourseNavigationResponse.builder()
            .courseId(courseId)
            .courseTitle(currentCourseLesson.getCourse().getTitle())
            .currentLessonId(currentLessonId)
            .currentLessonOrder(currentCourseLesson.getLessonOrder())
            .currentProgress(currentVideoProgress)
            .previousLessonId(previousLesson != null ? previousLesson.getLesson().getId() : null)
            .previousLessonTitle(previousLesson != null ? previousLesson.getLesson().getTitle() : null)
            .hasPrevious(previousLesson != null)
            .nextLessonId(nextLesson != null ? nextLesson.getLesson().getId() : null)
            .nextLessonTitle(nextLesson != null ? nextLesson.getLesson().getTitle() : null)
            .hasNext(nextLesson != null)
            .canNavigateNext(canNavigateNext)
            .nextLessonLockedReason(nextLockedReason)
            .totalLessons((int) totalLessons)
            .completedLessons((int) completedLessons)
            .courseProgressPercentage(courseProgressPercentage)
            .build();
    }
    
    /**
     * Records an initial view of the lesson for analytics.
     */
    @Transactional
    public void recordLessonView(Long lessonId, Long studentId) {
        LessonProgress progress = progressRepository
            .findByStudentIdAndLessonId(studentId, lessonId)
            .orElseGet(() -> createNewProgress(studentId, lessonId));
        
        progress.incrementViewCount();
        progressRepository.save(progress);
    }
    
    /**
     * Fetches progress summary for a specific lesson.
     */
    @Transactional(readOnly = true)
    public LessonProgressResponse getLessonProgress(Long lessonId, Long studentId) {
        LessonProgress progress = progressRepository
            .findByStudentIdAndLessonId(studentId, lessonId)
            .orElseGet(() -> createNewProgress(studentId, lessonId));
        
        return mapToResponse(progress);
    }
    
    // Helper method to create a new progress record when none exists
    private LessonProgress createNewProgress(Long studentId, Long lessonId) {
        Student student = studentRepository.findById(studentId)
            .orElseThrow(() -> new ResourceNotFoundException("Student not found"));
        
        Lesson lesson = lessonRepository.findById(lessonId)
            .orElseThrow(() -> new ResourceNotFoundException("Lesson not found"));
        
        return LessonProgress.builder()
            .student(student)
            .lesson(lesson)
            .videoProgress(0)
            .learningStatus(LearningStatus.NOT_STARTED)
            .isCompleted(false)
            .viewCount(0)
            .build();
    }
    
    // Maps the LessonProgress entity to a response DTO for API output
    private LessonProgressResponse mapToResponse(LessonProgress progress) {
        return LessonProgressResponse.builder()
            .lessonId(progress.getLesson().getId())
            .lessonTitle(progress.getLesson().getTitle())
            .videoProgress(progress.getVideoProgress())
            .learningStatus(progress.getLearningStatus().getDisplayName())
            .learningStatusColor(progress.getLearningStatus().getColorHint())
            .isCompleted(progress.getIsCompleted())
            .completedAt(progress.getCompletedAt())
            .canUnlockNext(progress.canUnlockNext())
            .lastProgressUpdate(progress.getLastProgressUpdate())
            .viewCount(progress.getViewCount())
            .lastViewedAt(progress.getLastViewedAt())
            .build();
    }
}
