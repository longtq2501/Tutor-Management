package com.tutor_management.backend.modules.audit.repository;

import com.tutor_management.backend.modules.audit.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for managing audit logs.
 */
@Repository
public interface AuditRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByActorIdOrderByTimestampDesc(String actorId);
    List<AuditLog> findByActionOrderByTimestampDesc(String action);
}
