// =========================================================================
// FILE 7: UserRepository.java (No changes needed - simple queries)
// Location: src/main/java/com/tutor_management/backend/repository/
// =========================================================================

package com.tutor_management.backend.modules.auth;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);
 
    Optional<User> findByStudentId(Long studentId);

    // ✅ OPTIMIZED: Batch load users for multiple students
    List<User> findByStudentIdIn(List<Long> studentIds);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "UPDATE users SET role_id = 3 WHERE role = 'STUDENT' AND role_id != 3", nativeQuery = true)
    int syncStudentRoleIds();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "UPDATE users SET role_id = 2 WHERE role = 'TUTOR' AND role_id != 2", nativeQuery = true)
    int syncTutorRoleIds();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @org.springframework.data.jpa.repository.Query(value = "UPDATE users u " +
            "SET u.role_id = (SELECT r.id FROM roles r WHERE r.name = 'ADMIN') " +
            "WHERE u.role_id IS NULL AND u.email LIKE '%admin%'", nativeQuery = true)
    int repairNullRoles();
}
