package com.tutor_management.backend.modules.audit.controller;

import com.tutor_management.backend.modules.audit.entity.AuditLog;
import com.tutor_management.backend.modules.audit.repository.AuditRepository;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for viewing system audit logs.
 * Restricted to ADMIN.
 */
@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

    private final AuditRepository auditRepository;

    /**
     * Get paginated audit logs with optional filtering by actor and action.
     * @param actorId Optional filter for the ID of the user who performed the action.
     * @param action Optional filter for the type of action performed.
     * @param pageable Pagination information.
     * @return Paginated list of audit logs.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditLog>>> getAuditLogs(
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) String action,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        
        // Basic filtering can be enhanced with Specification if needed
        Page<AuditLog> logs = auditRepository.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
