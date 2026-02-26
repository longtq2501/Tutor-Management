package com.tutor_management.backend.modules.finance.repository;

import java.util.List;
import java.util.Optional;

import com.tutor_management.backend.modules.finance.entity.SessionRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tutor_management.backend.modules.dashboard.dto.response.DashboardStats;
import com.tutor_management.backend.modules.finance.dto.response.MonthlyStats;
import com.tutor_management.backend.modules.student.entity.Student;

/**
 * Data access interface for {@link SessionRecord} entities.
 * Includes complex aggregation queries for financial reporting and dashboard statistics.
 */
@Repository
public interface SessionRecordRepository extends JpaRepository<SessionRecord, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT sr FROM SessionRecord sr WHERE sr.id = :id")
    Optional<SessionRecord> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "WHERE sr.student.id = :studentId " +
           "ORDER BY sr.createdAt DESC")
    Page<SessionRecord> findByStudentIdOrderByCreatedAtDesc(@Param("studentId") Long studentId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "WHERE sr.student.id = :studentId AND sr.tutorId = :tutorId " +
           "ORDER BY sr.createdAt DESC")
    Page<SessionRecord> findByStudentIdAndTutorIdOrderByCreatedAtDesc(@Param("studentId") Long studentId, @Param("tutorId") Long tutorId, org.springframework.data.domain.Pageable pageable);

    /**
     * Retrieves all session records for a specific student.
     * Simplified version without ordering - used for cascade deletion and bulk operations.
     */
    List<SessionRecord> findByStudentId(Long studentId);

    List<SessionRecord> findByTutorId(Long tutorId);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "WHERE sr.tutorId = :tutorId " +
           "ORDER BY sr.createdAt DESC")
    Page<SessionRecord> findAllByTutorIdOrderByCreatedAtDesc(@Param("tutorId") Long tutorId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "ORDER BY sr.createdAt DESC")
    Page<SessionRecord> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "WHERE sr.month = :month " +
           "ORDER BY sr.createdAt DESC")
    Page<SessionRecord> findByMonthOrderByCreatedAtDesc(@Param("month") String month, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "WHERE sr.month = :month AND sr.tutorId = :tutorId " +
           "ORDER BY sr.createdAt DESC")
    Page<SessionRecord> findByMonthAndTutorIdOrderByCreatedAtDesc(@Param("month") String month, @Param("tutorId") Long tutorId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT DISTINCT sr.month FROM SessionRecord sr ORDER BY sr.month DESC")
    List<String> findDistinctMonths();

    @Query("SELECT DISTINCT sr.month FROM SessionRecord sr WHERE sr.tutorId = :tutorId ORDER BY sr.month DESC")
    List<String> findDistinctMonthsByTutorId(@Param("tutorId") Long tutorId);

    /**
     * Aggregates revenue and session counts grouped by month.
     * Excludes cancelled sessions from financial totals.
     */
    @Query("SELECT new com.tutor_management.backend.modules.finance.dto.response.MonthlyStats(" +
           "sr.month, " +
           "SUM(CASE WHEN sr.paid = true AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.totalAmount ELSE 0L END), " +
           "SUM(CASE WHEN sr.paid = false AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.totalAmount ELSE 0L END), " +
           "CAST(SUM(CASE WHEN (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.sessions ELSE 0 END) AS integer)) " +
           "FROM SessionRecord sr " +
           "GROUP BY sr.month " +
           "ORDER BY sr.month DESC")
    List<MonthlyStats> findAllMonthlyStatsAggregated();

    @Query("SELECT new com.tutor_management.backend.modules.finance.dto.response.MonthlyStats(" +
           "sr.month, " +
           "SUM(CASE WHEN sr.paid = true AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.totalAmount ELSE 0L END), " +
           "SUM(CASE WHEN sr.paid = false AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.totalAmount ELSE 0L END), " +
           "CAST(SUM(CASE WHEN (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.sessions ELSE 0 END) AS integer)) " +
           "FROM SessionRecord sr " +
           "WHERE sr.tutorId = :tutorId " +
           "GROUP BY sr.month " +
           "ORDER BY sr.month DESC")
    List<MonthlyStats> findMonthlyStatsAggregatedByTutorId(@Param("tutorId") Long tutorId);

    /**
     * Calculates global dashboard metrics for the financial module.
     */
    @Query("SELECT new com.tutor_management.backend.modules.dashboard.dto.response.DashboardStats(" +
           "CAST(COUNT(DISTINCT sr.student.id) AS integer), " +
           "SUM(CASE WHEN sr.paid = true AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.totalAmount ELSE 0L END), " +
           "SUM(CASE WHEN sr.paid = false AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.totalAmount ELSE 0L END), " +
           "SUM(CASE WHEN sr.month = :currentMonth AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.totalAmount ELSE 0L END), " +
           "SUM(CASE WHEN sr.month = :currentMonth AND sr.paid = false AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.totalAmount ELSE 0L END)) " +
           "FROM SessionRecord sr")
    DashboardStats getFinanceSummary(@Param("currentMonth") String currentMonth);

    @Query("SELECT new com.tutor_management.backend.modules.dashboard.dto.response.DashboardStats(" +
           "CAST(COUNT(DISTINCT sr.student.id) AS integer), " +
           "SUM(CASE WHEN sr.paid = true AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.totalAmount ELSE 0L END), " +
           "SUM(CASE WHEN sr.paid = false AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.totalAmount ELSE 0L END), " +
           "SUM(CASE WHEN sr.month = :currentMonth AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.totalAmount ELSE 0L END), " +
           "SUM(CASE WHEN sr.month = :currentMonth AND sr.paid = false AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) THEN sr.totalAmount ELSE 0L END)) " +
           "FROM SessionRecord sr WHERE sr.tutorId = :tutorId")
    DashboardStats getFinanceSummaryByTutorId(@Param("currentMonth") String currentMonth, @Param("tutorId") Long tutorId);

    void deleteByMonth(String month);

    void deleteByMonthAndTutorId(String month, Long tutorId);

    Optional<SessionRecord> findByIdAndTutorId(Long id, Long tutorId);

    @Query("SELECT COALESCE(SUM(sr.totalAmount), 0) FROM SessionRecord sr WHERE sr.paid = true AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR))")
    Long sumTotalPaid();

    @Query("SELECT COALESCE(SUM(sr.totalAmount), 0) FROM SessionRecord sr WHERE sr.paid = false AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR))")
    Long sumTotalUnpaid();

    @Query("SELECT COALESCE(SUM(sr.totalAmount), 0) FROM SessionRecord sr WHERE sr.month = :month AND sr.paid = true AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR))")
    Long sumTotalPaidByMonth(@Param("month") String month);

    @Query("SELECT COALESCE(SUM(sr.totalAmount), 0) FROM SessionRecord sr WHERE sr.month = :month AND sr.paid = false AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR))")
    Long sumTotalUnpaidByMonth(@Param("month") String month);

    @Query("SELECT COALESCE(SUM(sr.sessions), 0) FROM SessionRecord sr WHERE sr.month = :month AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR))")
    Integer sumSessionsByMonth(@Param("month") String month);

    @Query("SELECT COALESCE(SUM(sr.sessions), 0) FROM SessionRecord sr WHERE sr.month = :month AND sr.tutorId = :tutorId AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR))")
    Integer sumSessionsByMonthAndTutorId(@Param("month") String month, @Param("tutorId") Long tutorId);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "WHERE sr.paid = false " +
           "ORDER BY sr.sessionDate DESC")
    Page<SessionRecord> findByPaidFalseOrderBySessionDateDesc(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "WHERE sr.paid = false AND sr.tutorId = :tutorId " +
           "ORDER BY sr.sessionDate DESC")
    Page<SessionRecord> findByPaidFalseAndTutorIdOrderBySessionDateDesc(@Param("tutorId") Long tutorId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student s " +
           "WHERE s = :student " +
           "ORDER BY sr.createdAt DESC")
    List<SessionRecord> findByStudentOrderByCreatedAtDesc(@Param("student") Student student);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student s " +
           "WHERE s = :student AND sr.month = :month " +
           "ORDER BY sr.createdAt DESC")
    List<SessionRecord> findByStudentAndMonthOrderByCreatedAtDesc(
            @Param("student") Student student,
            @Param("month") String month);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "WHERE sr.month = :month " +
           "ORDER BY sr.createdAt DESC")
    List<SessionRecord> findByMonth(@Param("month") String month);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "WHERE sr.month = :month AND sr.student.id IN :studentIds " +
           "ORDER BY sr.createdAt DESC")
    List<SessionRecord> findByMonthAndStudentIdIn(
            @Param("month") String month,
            @Param("studentIds") List<Long> studentIds);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "WHERE sr.student.id IN :studentIds " +
           "ORDER BY sr.createdAt DESC")
    List<SessionRecord> findByStudentIdIn(@Param("studentIds") List<Long> studentIds);

    @Query("SELECT sr FROM SessionRecord sr " +
           "WHERE sr.student.id = :studentId AND sr.month = :month " +
           "ORDER BY sr.sessionDate DESC")
    List<SessionRecord> findByStudentIdAndMonth(@Param("studentId") Long studentId, @Param("month") String month);

    /**
     * Retrieves detailed session records for a specific student and month, 
     * including attached lesson and document metadata.
     */
    @Query("SELECT DISTINCT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student s " +
           "LEFT JOIN FETCH sr.documents " +
           "LEFT JOIN FETCH sr.lessons " +
           "WHERE s = :student AND sr.month = :month " +
           "AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) " +
           "ORDER BY sr.sessionDate ASC")
    List<SessionRecord> findByStudentAndMonthFilteredOrderByDateAsc(
            @Param("student") Student student,
            @Param("month") String month);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "LEFT JOIN FETCH sr.documents " +
           "LEFT JOIN FETCH sr.lessons " +
           "WHERE sr.id = :id")
    Optional<SessionRecord> findByIdWithAttachments(@Param("id") Long id);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "LEFT JOIN FETCH sr.documents " +
           "LEFT JOIN FETCH sr.lessons " +
           "WHERE sr.id = :id AND sr.tutorId = :tutorId")
    Optional<SessionRecord> findByIdAndTutorIdWithAttachments(@Param("id") Long id, @Param("tutorId") Long tutorId);

    @Query("SELECT sr FROM SessionRecord sr " +
           "LEFT JOIN FETCH sr.student " +
           "WHERE sr.id IN :ids")
    List<SessionRecord> findAllByIdWithStudent(@Param("ids") List<Long> ids);

    @Modifying
    @Query(value = "DELETE FROM session_documents WHERE document_id = :documentId", nativeQuery = true)
    void deleteDocumentReferences(@Param("documentId") Long documentId);

    @Modifying
    @Query(value = "DELETE FROM session_lessons WHERE lesson_id = :lessonId", nativeQuery = true)
    void deleteLessonReferences(@Param("lessonId") Long lessonId);

    /**
     * Projects total unpaid amounts for a list of student IDs.
     * Used for optimized summary calculation.
     */
    @Query("SELECT sr.student.id, SUM(sr.totalAmount) FROM SessionRecord sr " +
           "WHERE sr.student.id IN :studentIds AND sr.paid = false " +
           "AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) " +
           "GROUP BY sr.student.id")
    List<Object[]> sumTotalUnpaidByStudentIdIn(@Param("studentIds") List<Long> studentIds);

    @Query("SELECT sr.student.id, SUM(sr.totalAmount) FROM SessionRecord sr " +
           "WHERE sr.student.id IN :studentIds AND sr.paid = true " +
           "AND (sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)) " +
           "GROUP BY sr.student.id")
    List<Object[]> sumTotalPaidByStudentIdIn(@Param("studentIds") List<Long> studentIds);

    @Query("SELECT sr.student.id, SUM(sr.totalAmount) FROM SessionRecord sr " +
           "WHERE sr.student.id IN :studentIds AND sr.paid = false " +
           "AND sr.status IN (com.tutor_management.backend.modules.finance.LessonStatus.COMPLETED, com.tutor_management.backend.modules.finance.LessonStatus.PENDING_PAYMENT) " +
           "GROUP BY sr.student.id")
    List<Object[]> sumTotalUnpaidTaughtByStudentIdIn(@Param("studentIds") List<Long> studentIds);

    /**
     * Checks if a student has access to a lesson via any session record.
     */
    @Query("SELECT COUNT(sr) > 0 FROM SessionRecord sr JOIN sr.lessons l WHERE sr.student.id = :studentId AND l.id = :lessonId")
    boolean existsByStudentIdAndLessonId(@Param("studentId") Long studentId, @Param("lessonId") Long lessonId);

    @Query("SELECT COALESCE(SUM(sr.totalAmount), 0) FROM SessionRecord sr WHERE sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)")
    Long sumNonCancelledTotalAmount();

    @Query("SELECT COALESCE(SUM(sr.sessions), 0) FROM SessionRecord sr WHERE sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR)")
    long countNonCancelledSessions();

    @Query("SELECT sr FROM SessionRecord sr " +
            "LEFT JOIN FETCH sr.student s " +
            "WHERE (:search IS NULL OR :search = '' OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(sr.subject) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:month IS NULL OR :month = '' OR sr.month = :month) " +
            "AND (:paid IS NULL OR sr.paid = :paid) " +
            "AND (:tutorId IS NULL OR sr.tutorId = :tutorId) " +
            "ORDER BY sr.sessionDate DESC, sr.createdAt DESC")
    Page<SessionRecord> findWithFilters(
            @Param("search") String search,
            @Param("month") String month,
            @Param("paid") Boolean paid,
            @Param("tutorId") Long tutorId,
            org.springframework.data.domain.Pageable pageable);

    @Query("SELECT sr.tutorId, SUM(sr.totalAmount) as totalRevenue, COUNT(sr) as sessionCount " +
            "FROM SessionRecord sr " +
            "GROUP BY sr.tutorId " +
            "ORDER BY totalRevenue DESC")
    List<Object[]> findTopTutorsByRevenue(org.springframework.data.domain.Pageable pageable);

    @Query("SELECT CAST(COUNT(sr) AS integer) FROM SessionRecord sr WHERE sr.tutorId = :tutorId AND " +
           "(sr.sessionDate < :date OR (sr.sessionDate = :date AND sr.id <= :recordId)) AND " +
           "(sr.status IS NULL OR sr.status NOT IN (com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_STUDENT, com.tutor_management.backend.modules.finance.LessonStatus.CANCELLED_BY_TUTOR))")
    Integer calculateSessionNumberForTutor(@Param("tutorId") Long tutorId, @Param("date") java.time.LocalDate date, @Param("recordId") Long recordId);
}
