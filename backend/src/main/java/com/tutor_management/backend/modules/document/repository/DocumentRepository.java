package com.tutor_management.backend.modules.document.repository;

import java.util.List;

import com.tutor_management.backend.modules.document.entity.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for {@link Document} management.
 * Provides optimized queries with JOIN FETCH to eliminate N+1 issues when loading student and category metadata.
 */
@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    /**
     * Retrieves all documents with paged results, filtered by tutor if provided.
     */
    @Query(value = "SELECT d FROM Document d " +
            "LEFT JOIN FETCH d.student " +
            "LEFT JOIN FETCH d.category " +
            "LEFT JOIN FETCH d.tutor " +
            "WHERE (:tutorId IS NULL OR d.tutor.id = :tutorId) " +
            "AND (:studentId IS NULL OR d.student.id = :studentId OR d.student IS NULL) " +
            "AND (:folderId IS NULL OR d.folder.id = :folderId) " +
            "AND (:isRoot = false OR (:isRoot = true AND d.folder IS NULL))",
            countQuery = "SELECT COUNT(d) FROM Document d " +
                    "WHERE (:tutorId IS NULL OR d.tutor.id = :tutorId) " +
                    "AND (:studentId IS NULL OR d.student.id = :studentId OR d.student IS NULL) " +
                    "AND (:folderId IS NULL OR d.folder.id = :folderId) " +
                    "AND (:isRoot = false OR (:isRoot = true AND d.folder IS NULL))")
    Page<Document> findAllWithStudent(@Param("tutorId") Long tutorId, @Param("studentId") Long studentId, @Param("folderId") Long folderId, @Param("isRoot") boolean isRoot, Pageable pageable);

    /**
     * Filters documents by category code, tutor, and student.
     */
    @Query(value = "SELECT d FROM Document d " +
           "LEFT JOIN FETCH d.student " +
           "LEFT JOIN FETCH d.category " +
           "LEFT JOIN FETCH d.tutor " +
           "WHERE d.category.code = :categoryCode " +
           "AND (:tutorId IS NULL OR d.tutor.id = :tutorId) " +
           "AND (:studentId IS NULL OR d.student.id = :studentId OR d.student IS NULL)",
           countQuery = "SELECT COUNT(d) FROM Document d WHERE d.category.code = :categoryCode AND (:tutorId IS NULL OR d.tutor.id = :tutorId) AND (:studentId IS NULL OR d.student.id = :studentId OR d.student IS NULL)")
    Page<Document> findByCategoryCode(@Param("categoryCode") String categoryCode, @Param("tutorId") Long tutorId, @Param("studentId") Long studentId, Pageable pageable);

    /**
     * Searches for documents matching a keyword, filtered by tutor and student.
     */
    @Query(value = "SELECT d FROM Document d " +
            "LEFT JOIN FETCH d.student " +
            "LEFT JOIN FETCH d.category " +
            "LEFT JOIN FETCH d.tutor " +
            "WHERE LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "AND (:categoryCode IS NULL OR d.category.code = :categoryCode) " +
            "AND (:tutorId IS NULL OR d.tutor.id = :tutorId) " +
            "AND (:studentId IS NULL OR d.student.id = :studentId OR d.student IS NULL)",
            countQuery = "SELECT COUNT(d) FROM Document d " +
                    "WHERE LOWER(d.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                    "AND (:categoryCode IS NULL OR d.category.code = :categoryCode) " +
                    "AND (:tutorId IS NULL OR d.tutor.id = :tutorId) " +
                    "AND (:studentId IS NULL OR d.student.id = :studentId OR d.student IS NULL)")
    Page<Document> findByTitleContainingIgnoreCase(@Param("keyword") String keyword, @Param("categoryCode") String categoryCode, @Param("tutorId") Long tutorId, @Param("studentId") Long studentId, Pageable pageable);

    @Query("SELECT COUNT(d) FROM Document d WHERE d.category.code = :categoryCode AND (:tutorId IS NULL OR d.tutor.id = :tutorId) AND (:studentId IS NULL OR d.student.id = :studentId OR d.student IS NULL)")
    Long countByCategoryCode(@Param("categoryCode") String categoryCode, @Param("tutorId") Long tutorId, @Param("studentId") Long studentId);

    /**
     * Calculates total storage footprint, filtered by tutor.
     */
    @Query("SELECT COALESCE(SUM(d.fileSize), 0) FROM Document d WHERE (:tutorId IS NULL OR d.tutor.id = :tutorId)")
    Long sumTotalFileSize(@Param("tutorId") Long tutorId);

    /**
     * Aggregates downloads, filtered by tutor.
     */
    @Query("SELECT COALESCE(SUM(d.downloadCount), 0) FROM Document d WHERE (:tutorId IS NULL OR d.tutor.id = :tutorId)")
    Long sumTotalDownloads(@Param("tutorId") Long tutorId);

    /**
     * Counts documents accessible to a student from a specific tutor.
     */
    @Query("SELECT COUNT(d) FROM Document d WHERE (d.student.id = :studentId OR d.student IS NULL) AND (:tutorId IS NULL OR d.tutor.id = :tutorId)")
    Long countByStudentIdAndTutor(@Param("studentId") Long studentId, @Param("tutorId") Long tutorId);

    /**
     * Groups counts by category, filtered by tutor and student.
     */
    @Query("SELECT c.code, COUNT(d) FROM Document d " +
           "JOIN d.category c " +
           "LEFT JOIN d.tutor t " +
           "LEFT JOIN d.student s " +
           "WHERE (:tutorId IS NULL OR t.id = :tutorId) " +
           "AND (:studentId IS NULL OR s.id = :studentId OR s IS NULL) " +
           "GROUP BY c.code")
    List<Object[]> countDocumentsByCategoryCode(@Param("tutorId") Long tutorId, @Param("studentId") Long studentId);

    /**
     * Detaches documents from a category. (No tutor filter needed as it's a structural change)
     */
    @Modifying
    @Query("UPDATE Document d SET d.category = null WHERE d.category.id = :categoryId")
    void clearCategoryReferences(@Param("categoryId") Long categoryId);

    /**
     * Optimized aggregate stats retrieval.
     */
    @Query("SELECT COUNT(d), COALESCE(SUM(d.fileSize), 0), COALESCE(SUM(d.downloadCount), 0) FROM Document d " +
           "LEFT JOIN d.tutor t " +
           "LEFT JOIN d.student s " +
           "WHERE (:tutorId IS NULL OR t.id = :tutorId) " +
           "AND (:studentId IS NULL OR s.id = :studentId OR s IS NULL)")
    List<Object[]> getAggregatedStats(@Param("tutorId") Long tutorId, @Param("studentId") Long studentId);
}
