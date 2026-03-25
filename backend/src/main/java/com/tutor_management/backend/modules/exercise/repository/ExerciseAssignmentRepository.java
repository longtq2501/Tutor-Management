package com.tutor_management.backend.modules.exercise.repository;

import com.tutor_management.backend.modules.exercise.domain.ExerciseAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Data access layer for managing student assignments to exercises.
 */
@Repository
public interface ExerciseAssignmentRepository extends JpaRepository<ExerciseAssignment, String> {
    
    /**
     * Lists assignments for a specific student with pagination.
     */
    org.springframework.data.domain.Page<ExerciseAssignment> findByStudentId(String studentId, org.springframework.data.domain.Pageable pageable);

       /**
        * Lists assignments for any of the provided student identity keys (legacy/userId or profile/studentId).
        */
       org.springframework.data.domain.Page<ExerciseAssignment> findByStudentIdIn(List<String> studentIds, org.springframework.data.domain.Pageable pageable);

    /**
     * Lists assignments for a specific student filtered by tutor with pagination.
     */
    @Query("SELECT ea FROM ExerciseAssignment ea, Exercise e " +
           "WHERE ea.exerciseId = e.id AND ea.studentId = :studentId " +
           "AND (:tutorId IS NULL OR e.tutorId = :tutorId)")
    org.springframework.data.domain.Page<ExerciseAssignment> findByStudentIdAndTutorId(@Param("studentId") String studentId, @Param("tutorId") Long tutorId, org.springframework.data.domain.Pageable pageable);

    /**
     * Lists assignments for any provided student identity keys, with optional tutor filter.
     */
    @Query(value = "SELECT ea FROM ExerciseAssignment ea, Exercise e " +
           "WHERE ea.exerciseId = e.id AND ea.studentId IN :studentIds " +
           "AND (:tutorId IS NULL OR e.tutorId = :tutorId)",
           countQuery = "SELECT COUNT(ea) FROM ExerciseAssignment ea, Exercise e " +
                   "WHERE ea.exerciseId = e.id AND ea.studentId IN :studentIds " +
                   "AND (:tutorId IS NULL OR e.tutorId = :tutorId)")
    org.springframework.data.domain.Page<ExerciseAssignment> findByStudentIdsAndTutorId(@Param("studentIds") List<String> studentIds, @Param("tutorId") Long tutorId, org.springframework.data.domain.Pageable pageable);

    /**
     * Lists all assignments for any provided student identity keys, with optional tutor filter.
     * Used by tutor summary aggregation to dedupe status per exercise.
     */
    @Query("SELECT ea FROM ExerciseAssignment ea, Exercise e " +
           "WHERE ea.exerciseId = e.id AND ea.studentId IN :studentIds " +
           "AND (:tutorId IS NULL OR e.tutorId = :tutorId)")
    List<ExerciseAssignment> findAllByStudentIdsAndTutorId(@Param("studentIds") List<String> studentIds, @Param("tutorId") Long tutorId);

    /**
     * Lists all assignments for a specific student.
     */
    List<ExerciseAssignment> findByStudentId(String studentId);
    
    /**
     * Lists all students assigned to a specific exercise.
     */
    List<ExerciseAssignment> findByExerciseId(String exerciseId);
    
    /**
     * Retrieves a specific assignment by the student-exercise pair.
     */
    Optional<ExerciseAssignment> findByExerciseIdAndStudentId(String exerciseId, String studentId);
    
    /**
     * Lists all assignments authorized by a specific staff member.
     */
    List<ExerciseAssignment> findByAssignedBy(String assignedBy);

    /**
     * Bulk removes all assignment records for an exercise being deleted.
     */
    @Modifying
    @Query("DELETE FROM ExerciseAssignment ea WHERE ea.exerciseId = :exerciseId")
    void deleteByExerciseId(@Param("exerciseId") String exerciseId);

    /**
     * Aggregates assignment counts grouped by their current submission status.
     * Uses LEFT JOIN with submissions to ensure EVERY assignment is counted,
     * defaulting to PENDING if no submission record exists.
     */
    @Query("SELECT ea.studentId, s.status, COUNT(ea) FROM ExerciseAssignment ea " +
           "LEFT JOIN com.tutor_management.backend.modules.submission.entity.Submission s " +
           "ON ea.exerciseId = s.exerciseId AND ea.studentId = s.studentId " +
           "JOIN Exercise e ON ea.exerciseId = e.id " +
           "WHERE ea.studentId IN :studentIds AND (:tutorId IS NULL OR e.tutorId = :tutorId) " +
           "GROUP BY ea.studentId, s.status")
    List<Object[]> countAssignmentsWithSubmissionStatus(@Param("studentIds") List<String> studentIds, @Param("tutorId") Long tutorId);
}
