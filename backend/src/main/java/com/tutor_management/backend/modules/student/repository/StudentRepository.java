package com.tutor_management.backend.modules.student.repository;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

import com.tutor_management.backend.modules.student.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for {@link Student} management.
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    /**
     * Retrieves all students ordered by creation date descending.
     */
    List<Student> findAllByOrderByCreatedAtDesc();

    /**
     * Retrieves a student by ID with their associated parent eagerly fetched.
     */
    @Query("SELECT s FROM Student s LEFT JOIN FETCH s.parent WHERE s.id = :id")
    Optional<Student> findByIdWithParent(@Param("id") Long id);

    @Query("SELECT s FROM Student s LEFT JOIN FETCH s.parent WHERE s.id = :id AND s.tutorId = :tutorId")
    Optional<Student> findByIdAndTutorIdWithParent(@Param("id") Long id, @Param("tutorId") Long tutorId);

    Optional<Student> findByIdAndTutorId(Long id, Long tutorId);

    boolean existsByIdAndTutorId(Long id, Long tutorId);


    /**
     * Retrieves students by IDs with their associated parents eagerly fetched.
     */
    @Query("SELECT s FROM Student s LEFT JOIN FETCH s.parent WHERE s.id IN :ids")
    List<Student> findByIdInWithParent(@Param("ids") List<Long> ids);

    /**
     * Retrieves all active students with their associated parents eagerly fetched.
     */
    @Query("SELECT s FROM Student s LEFT JOIN FETCH s.parent WHERE s.active = true")
    List<Student> findByActiveTrueWithParent();

    /**
     * Paginated version of active student retrieval with parent fetching.
     */
    @Query(value = "SELECT s FROM Student s LEFT JOIN FETCH s.parent WHERE s.active = true ORDER BY s.createdAt DESC",
           countQuery = "SELECT COUNT(s) FROM Student s WHERE s.active = true")
    Page<Student> findByActiveTrueWithParent(Pageable pageable);

    /**
     * Retrieves the complete student registry with parents eagerly fetched to avoid N+1 queries.
     */
    @Query("SELECT DISTINCT s FROM Student s " +
            "LEFT JOIN FETCH s.parent " +
            "ORDER BY s.createdAt DESC")
    List<Student> findAllWithParentOrderByCreatedAtDesc();

    @Query("SELECT DISTINCT s FROM Student s " +
            "LEFT JOIN FETCH s.parent " +
            "WHERE s.tutorId = :tutorId " +
            "ORDER BY s.createdAt DESC")
    List<Student> findAllByTutorIdWithParentOrderByCreatedAtDesc(@Param("tutorId") Long tutorId);


    /**
     * Paginated version of student retrieval with parent fetching.
     */
    @Query(value = "SELECT s FROM Student s LEFT JOIN FETCH s.parent ORDER BY s.createdAt DESC",
           countQuery = "SELECT COUNT(s) FROM Student s")
    Page<Student> findAllWithParent(Pageable pageable);

    @Query(value = "SELECT s FROM Student s LEFT JOIN FETCH s.parent WHERE s.tutorId = :tutorId ORDER BY s.createdAt DESC",
           countQuery = "SELECT COUNT(s) FROM Student s WHERE s.tutorId = :tutorId")
    Page<Student> findAllByTutorIdWithParent(@Param("tutorId") Long tutorId, Pageable pageable);

    @Query(value = "SELECT s FROM Student s LEFT JOIN FETCH s.parent WHERE s.tutorId = :tutorId AND s.active = true ORDER BY s.createdAt DESC",
           countQuery = "SELECT COUNT(s) FROM Student s WHERE s.tutorId = :tutorId AND s.active = true")
    Page<Student> findByTutorIdAndActiveTrueWithParent(@Param("tutorId") Long tutorId, Pageable pageable);


    /**
     * Counts the number of students enrolled within a specific time frame.
     */
    @Query("SELECT COUNT(s) FROM Student s WHERE s.createdAt >= :start AND s.createdAt <= :end")
    long countByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(s) FROM Student s WHERE s.createdAt >= :start AND s.createdAt <= :end AND s.tutorId = :tutorId")
    long countByCreatedAtBetweenAndTutorId(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("tutorId") Long tutorId);

    @Query("SELECT COUNT(s) FROM Student s WHERE s.active = true")
    long countByActiveTrue();

    @Query(value = "SELECT s FROM Student s " +
            "LEFT JOIN FETCH s.parent " +
            "WHERE (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:tutorId IS NULL OR s.tutorId = :tutorId) " +
            "AND (:active IS NULL OR s.active = :active) " +
            "ORDER BY s.createdAt DESC",
            countQuery = "SELECT COUNT(s) FROM Student s WHERE (:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%'))) AND (:tutorId IS NULL OR s.tutorId = :tutorId) AND (:active IS NULL OR s.active = :active)")
    Page<Student> findAdminStudents(@Param("search") String search, @Param("tutorId") Long tutorId, @Param("active") Boolean active, Pageable pageable);

    @Query("SELECT COALESCE(SUM(CASE WHEN sr.paid = false THEN sr.totalAmount ELSE 0 END), 0) FROM SessionRecord sr WHERE sr.student.id = :studentId")
    Long calculateTotalDebt(@Param("studentId") Long studentId);

    long countByTutorIdAndActiveTrue(Long tutorId);

    @Query("SELECT SUBSTRING(CAST(s.createdAt AS string), 1, 7) as month, COUNT(s) as count " +
            "FROM Student s " +
            "GROUP BY month " +
            "ORDER BY month DESC")
    List<Object[]> countByMonth();
}
