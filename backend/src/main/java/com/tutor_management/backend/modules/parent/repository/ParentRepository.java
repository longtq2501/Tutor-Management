package com.tutor_management.backend.modules.parent.repository;

import com.tutor_management.backend.modules.parent.entity.Parent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for {@link Parent} management.
 */
@Repository
public interface ParentRepository extends JpaRepository<Parent, Long> {
    
    /**
     * Checks if a parent exists with the given email.
     */
    boolean existsByEmail(String email);

    /**
     * Checks if another parent exists with the given email, excluding the provided ID.
     */
    boolean existsByEmailAndIdNot(String email, Long id);

    /**
     * Retrieves all parents along with their associated students.
     * Uses LEFT JOIN FETCH to avoid N+1 and LazyInitializationException.
     */
    @Query("SELECT DISTINCT p FROM Parent p LEFT JOIN FETCH p.students")
    List<Parent> findAllWithStudents();

    /**
     * Searches for parents by name, email, or phone number (case-insensitive).
     * Fetches students to support DTO mapping.
     * 
     * @param keyword The search term.
     * @return List of matching parents.
     */
    @Query("SELECT DISTINCT p FROM Parent p LEFT JOIN FETCH p.students WHERE " +
            "LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(p.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(p.phone) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Parent> searchParents(@Param("keyword") String keyword);
}
