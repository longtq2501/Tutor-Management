package com.tutor_management.backend.modules.audit.service;

import com.tutor_management.backend.modules.audit.entity.AuditLog;
import com.tutor_management.backend.modules.audit.repository.AuditRepository;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.util.SecurityContextUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuditService {

    private final AuditRepository auditRepository;
    private final SecurityContextUtils securityContextUtils;

    /**
     * Logs a security-sensitive action.
     * Uses REQUIRES_NEW to ensure the audit log is saved even if the primary transaction fails (e.g., on AccessDenied).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(String action, String description, String metadata) {
        log.info("Audit Log: [{}] - {}", action, description);

        User currentUser = securityContextUtils.getCurrentUser().orElse(null);
        String actorId = currentUser != null ? currentUser.getId().toString() : "SYSTEM";
        String actorName = currentUser != null ? currentUser.getFullName() : "SYSTEM";
        String actorRole = currentUser != null ? currentUser.getRole().getName() : "N/A";

        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .actorId(actorId)
                .actorName(actorName)
                .actorRole(actorRole)
                .description(description)
                .metadata(metadata)
                .build();

        auditRepository.save(auditLog);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logWithActor(String action, User user, String description, String metadata) {
        AuditLog auditLog = AuditLog.builder()
                .action(action)
                .actorId(user != null ? user.getId().toString() : "SYSTEM")
                .actorName(user != null ? user.getFullName() : "SYSTEM")
                .actorRole(user != null ? user.getRole().getName() : "N/A")
                .description(description)
                .metadata(metadata)
                .build();

        auditRepository.save(auditLog);
    }
}
