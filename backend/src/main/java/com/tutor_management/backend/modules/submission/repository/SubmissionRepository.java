package com.tutor_management.backend.modules.submission.repository;

import com.tutor_management.backend.modules.submission.entity.Submission;
import com.tutor_management.backend.modules.submission.entity.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

/**
 * Data access interface for {@link Submission} entities.
 */
@Repository
public interface SubmissionRepository extends JpaRepository<Submission, String> {
    
    /**
     * Retrieves all submissions for a specific exercise.
     */
    List<Submission> findByExerciseId(String exerciseId);
    
    /**
     * Retrieves all submissions authored by a specific student.
     */
    List<Submission> findByStudentId(String studentId);
    
    /**
     * Finds a specific submission attempt by student-exercise pair.
     */
    Optional<Submission> findByExerciseIdAndStudentId(String exerciseId, String studentId);

    /**
     * Eagerly fetches a submission with its associated detail records.
     */
    @Query("SELECT s FROM Submission s LEFT JOIN FETCH s.answers WHERE s.id = :id")
    Optional<Submission> findByIdWithAnswers(@Param("id") String id);

    /**
     * Batch retrieval of submissions for a student across multiple exercises.
     */
    List<Submission> findByStudentIdAndExerciseIdIn(String studentId, List<String> exerciseIds);

    /**
     * Hard deletes all answer records for a specific exercise's submissions.
     */
    @Modifying
    @Query("DELETE FROM StudentAnswer sa WHERE sa.submission.id IN (SELECT s.id FROM Submission s WHERE s.exerciseId = :exerciseId)")
    void deleteAnswersByExerciseId(@Param("exerciseId") String exerciseId);

    /**
     * Hard deletes all submissions for a specific exercise.
     */
    @Modifying
    @Query("DELETE FROM Submission s WHERE s.exerciseId = :exerciseId")
    void deleteSubmissionsByExerciseId(@Param("exerciseId") String exerciseId);

    /**
     * Aggregates submission counts by status for all students.
     * Used for the Tutor Dashboard student summary view.
     */
    @Query("SELECT s.studentId, s.status, COUNT(s) FROM Submission s GROUP BY s.studentId, s.status")
    List<Object[]> countAllByStudentAndStatus();

    /**
     * Aggregates submission counts by status for a specific list of students.
     */
    /**
     * Aggregates submission counts by status for a specific list of students and a specific tutor.
     * Uses a join with Exercise to ensure strict multi-tenancy.
     */
    @Query("SELECT s.studentId, s.status, COUNT(s) FROM Submission s, com.tutor_management.backend.modules.exercise.domain.Exercise e " +
           "WHERE s.exerciseId = e.id AND s.studentId IN :studentIds " +
           "AND (:tutorId IS NULL OR e.tutorId = :tutorId) " +
           "GROUP BY s.studentId, s.status")
    List<Object[]> countByStudentIdInAndTutorId(@Param("studentIds") List<String> studentIds, @Param("tutorId") Long tutorId);

        @Query("SELECT e.title, s.totalScore, e.totalPoints, COALESCE(s.gradedAt, s.updatedAt) " +
            "FROM Submission s, com.tutor_management.backend.modules.exercise.domain.Exercise e " +
            "WHERE e.id = s.exerciseId " +
            "AND s.studentId = :studentId " +
            "AND e.tutorId = :tutorId " +
            "AND s.status = com.tutor_management.backend.modules.submission.entity.SubmissionStatus.GRADED " +
            "AND COALESCE(s.gradedAt, s.updatedAt) BETWEEN :startDateTime AND :endDateTime " +
            "ORDER BY COALESCE(s.gradedAt, s.updatedAt) ASC")
        List<Object[]> findGradedSummariesForMonthlyReport(
             @Param("studentId") String studentId,
             @Param("tutorId") Long tutorId,
             @Param("startDateTime") LocalDateTime startDateTime,
             @Param("endDateTime") LocalDateTime endDateTime);
}
