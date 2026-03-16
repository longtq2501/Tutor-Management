package com.tutor_management.backend.modules.course.repository;

import java.util.List;
import java.util.Optional;

import com.tutor_management.backend.modules.course.entity.LessonProgress;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for tracking student interaction with individual lessons.
 * Provides optimized methods for bulk progress checks and completion counting.
 */
@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    List<LessonProgress> findByStudentId(Long studentId);

    @Modifying
    @Query("DELETE FROM LessonProgress lp WHERE lp.lesson.id = :lessonId")
    void deleteByLessonId(@Param("lessonId") Long lessonId);

    /**
     * Retrieves lesson progress for a student with lesson metadata pre-loaded.
     */
    @EntityGraph(attributePaths = { "lesson", "student" })
    @Query("SELECT lp FROM LessonProgress lp WHERE lp.student.id = :studentId")
    List<LessonProgress> findByStudentIdWithDetails(@Param("studentId") Long studentId);

    Optional<LessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    /**
     * Fetches progress for a specific student and lesson with details for processing.
     */
    @EntityGraph(attributePaths = { "lesson", "student" })
    @Query("SELECT lp FROM LessonProgress lp WHERE lp.student.id = :studentId AND lp.lesson.id = :lessonId")
    Optional<LessonProgress> findByStudentIdAndLessonIdWithDetails(
            @Param("studentId") Long studentId,
            @Param("lessonId") Long lessonId);

    boolean existsByStudentIdAndLessonId(Long studentId, Long lessonId);

    /**
     * Batch loads progress status for a list of lessons.
     * Prevents multiple individual queries when rendering a course curriculum.
     */
    @Query("SELECT lp FROM LessonProgress lp WHERE lp.student.id = :studentId AND lp.lesson.id IN :lessonIds")
    List<LessonProgress> findByStudentIdAndLessonIdIn(
            @Param("studentId") Long studentId,
            @Param("lessonIds") List<Long> lessonIds);

    /**
     * Counts how many lessons from a specific set have been marked as completed by a student.
     * Highly efficient query for calculating overall course progress percentages.
     */
    @Query("SELECT COUNT(lp) FROM LessonProgress lp WHERE lp.student.id = :studentId AND lp.lesson.id IN :lessonIds AND lp.isCompleted = true")
    long countCompletedByStudentIdAndLessonIdIn(
            @Param("studentId") Long studentId,
            @Param("lessonIds") List<Long> lessonIds);

    /**
     * Gets all progress records for a student in a specific course.
     */
    @Query("""
        SELECT lp FROM LessonProgress lp
        JOIN CourseLesson cl ON lp.lesson.id = cl.lesson.id
        WHERE lp.student.id = :studentId
        AND cl.course.id = :courseId
        ORDER BY cl.lessonOrder ASC
        """)
    List<LessonProgress> findByStudentIdAndCourseId(
            @Param("studentId") Long studentId,
            @Param("courseId") Long courseId);

    /**
     * Counts completed lessons for a student in a specific course.
     */
    @Query("""
        SELECT COUNT(lp) FROM LessonProgress lp
        JOIN CourseLesson cl ON lp.lesson.id = cl.lesson.id
        WHERE lp.student.id = :studentId
        AND cl.course.id = :courseId
        AND lp.isCompleted = true
        """)
    long countCompletedByStudentIdAndCourseId(
            @Param("studentId") Long studentId,
            @Param("courseId") Long courseId);
}
