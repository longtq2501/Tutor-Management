package com.tutor_management.backend.repository;

import com.tutor_management.backend.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Student> findByIdAndUserId(Long id, Long userId);

    List<Student> findAllByOrderByCreatedAtDesc();
}
