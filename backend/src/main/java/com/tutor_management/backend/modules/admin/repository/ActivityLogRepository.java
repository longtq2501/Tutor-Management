package com.tutor_management.backend.modules.admin.repository;

import com.tutor_management.backend.modules.admin.entity.ActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository interface for managing ActivityLog entities.
 */
@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {
}
