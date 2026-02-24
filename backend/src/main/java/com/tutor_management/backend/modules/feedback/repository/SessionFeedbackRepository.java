package com.tutor_management.backend.modules.feedback.repository;

import java.util.List;
import java.util.Optional;

import com.tutor_management.backend.modules.feedback.entity.SessionFeedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repository interface for managing {@link SessionFeedback} persistence.
 * Leverages {@link EntityGraph} to optimize lazy-loaded relationships and prevent N+1 query overhead.
 */
public interface SessionFeedbackRepository extends JpaRepository<SessionFeedback, Long> {

    /**
     * Retrieves the most recent feedback entry for a specific session and student.
     */
    @EntityGraph(attributePaths = {"sessionRecord", "student"})
    Optional<SessionFeedback> findFirstBySessionRecordIdAndStudentIdOrderByUpdatedAtDesc(Long sessionRecordId,
            Long studentId);

    /**
     * Finds all feedback entries associated with a session.
     */
    List<SessionFeedback> findBySessionRecordId(Long sessionRecordId);

    /**
     * Retrieves a paginated history of feedback for a specific student.
     */
    @EntityGraph(attributePaths = {"sessionRecord", "student"})
    Page<SessionFeedback> findByStudentId(Long studentId, Pageable pageable);

    /**
     * Optimized JPQL query to retrieve latest feedbacks for a student, ordered by creation date.
     */
    @EntityGraph(attributePaths = {"sessionRecord", "student"})
    @Query("SELECT sf FROM SessionFeedback sf WHERE sf.student.id = :studentId ORDER BY sf.createdAt DESC")
    List<SessionFeedback> findLatestByStudent(@Param("studentId") Long studentId, Pageable pageable);

    @Query("SELECT sf.sessionRecord.tutorId, " +
           "AVG(CASE WHEN sf.attitudeRating = 'Xuất Sắc' THEN 5.0 " +
           "         WHEN sf.attitudeRating = 'Tốt' THEN 4.0 " +
           "         WHEN sf.attitudeRating = 'Khá' THEN 3.0 " +
           "         WHEN sf.attitudeRating = 'Trung Bình' THEN 2.0 " +
           "         ELSE 1.0 END) as avgRating " +
           "FROM SessionFeedback sf " +
           "GROUP BY sf.sessionRecord.tutorId")
    List<Object[]> findAverageRatingsByTutor();
}
