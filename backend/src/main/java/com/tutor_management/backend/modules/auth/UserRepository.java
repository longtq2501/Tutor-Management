package com.tutor_management.backend.modules.auth;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

/**
 * Repository interface for User entity, providing basic CRUD operations and custom queries.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);
 
    Optional<User> findByStudentId(Long studentId);

    // OPTIMIZED: Batch load users for multiple students
    List<User> findByStudentIdIn(List<Long> studentIds);

    List<User> findByRoleName(String roleName);

    @Modifying
    @Transactional
    @Query(value = "UPDATE users SET role_id = 3 WHERE role = 'STUDENT' AND role_id != 3", nativeQuery = true)
    int syncStudentRoleIds();

    @Modifying
    @Transactional
    @Query(value = "UPDATE users SET role_id = 2 WHERE role = 'TUTOR' AND role_id != 2", nativeQuery = true)
    int syncTutorRoleIds();

    @Modifying
    @Transactional
    @Query(value = "UPDATE users u " +
            "SET u.role_id = (SELECT r.id FROM roles r WHERE r.name = 'ADMIN') " +
            "WHERE u.role_id IS NULL AND u.email LIKE '%admin%'", nativeQuery = true)
    int repairNullRoles();
}
