package com.tutor_management.backend.modules.finance.controller;

import com.tutor_management.backend.modules.finance.LessonStatus;
import com.tutor_management.backend.modules.finance.entity.SessionRecord;
import com.tutor_management.backend.modules.finance.service.SessionRecordService;
import com.tutor_management.backend.modules.finance.dto.request.SessionRecordRequest;
import com.tutor_management.backend.modules.finance.dto.request.SessionRecordUpdateRequest;
import com.tutor_management.backend.modules.finance.dto.response.SessionRecordResponse;

import com.tutor_management.backend.modules.onlinesession.dto.response.OnlineSessionResponse;
import com.tutor_management.backend.modules.onlinesession.service.OnlineSessionService;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.shared.service.ExportService;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for managing {@link SessionRecord} entities.
 * Provides endpoints for tracking teaching hours, scheduling, and billing.
 */
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@Slf4j
public class SessionRecordController {

    private final SessionRecordService sessionRecordService;
    private final ExportService exportService;
    private final OnlineSessionService onlineSessionService;

    /**
     * Retrieves a paginated list of session records with optional filtering by search term, month, and payment status.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<SessionRecordResponse>>> getAllRecords(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Boolean paid,
            Pageable pageable) {
        log.info("Fetching paged session records with filters - Search: {}, Month: {}, Paid: {}", search, month, paid);
        return ResponseEntity.ok(ApiResponse.success(sessionRecordService.getAllRecordsFiltered(search, month, paid, pageable)));
    }

    /**
     * Retrieves session records for a specific student with optional filtering by month.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    @GetMapping("/month/{month}")
    public ResponseEntity<ApiResponse<Page<SessionRecordResponse>>> getRecordsByMonth(
            @PathVariable String month,
            Pageable pageable) {
        log.info("Fetching paged session records for month: {}", month);
        return ResponseEntity.ok(ApiResponse.success(sessionRecordService.getRecordsByMonth(month, pageable)));
    }

    /**
     * Retrieves session records for a specific student with optional filtering by month.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    @GetMapping("/months")
    public ResponseEntity<ApiResponse<List<String>>> getDistinctMonths() {
        return ResponseEntity.ok(ApiResponse.success(sessionRecordService.getDistinctMonths()));
    }

    /**
     * Creates a new session record based on the provided request data.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping
    public ResponseEntity<ApiResponse<SessionRecordResponse>> createRecord(@Valid @RequestBody SessionRecordRequest request) {
        log.info("Creating new session record for student ID: {}", request.getStudentId());
        SessionRecordResponse response = sessionRecordService.createRecord(request);
        return ResponseEntity.ok(ApiResponse.success("Đã tạo buổi học thành công", response));
    }

    /**
     * Toggles the payment status of a session record, enforcing optimistic locking with versioning.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PutMapping("/{id}/toggle-payment")
    public ResponseEntity<ApiResponse<SessionRecordResponse>> togglePayment(
            @PathVariable Long id,
            @RequestParam(required = false) Integer version) {
        log.info("Toggling payment status for session ID: {}", id);
        SessionRecordResponse response = sessionRecordService.togglePayment(id, version);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái thanh toán", response));
    }

    /**
     * Deletes a session record by its ID.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRecord(@PathVariable Long id) {
        log.info("Deleting session record ID: {}", id);
        sessionRecordService.deleteRecord(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa buổi học thành công", null));
    }

    /**
     * Retrieves all unpaid session records with optional filtering for only taught sessions.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @GetMapping("/unpaid")
    public ResponseEntity<ApiResponse<Page<SessionRecordResponse>>> getAllUnpaidSessions(
            @RequestParam(required = false) Boolean taughtOnly,
            Pageable pageable) {
        log.info("Fetching unpaid sessions (taughtOnly={})", taughtOnly);
        return ResponseEntity.ok(ApiResponse.success(sessionRecordService.getAllUnpaidSessions(pageable, taughtOnly)));
    }

    /**
     * Updates an existing session record with new details, enforcing optimistic locking with versioning.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SessionRecordResponse>> updateRecord(
            @PathVariable Long id,
            @RequestBody SessionRecordUpdateRequest request) {
        log.info("Updating session record ID: {}", id);
        SessionRecordResponse response = sessionRecordService.updateRecord(id, request);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật thông tin buổi học", response));
    }

    /**
     * Retrieves a session record by its ID.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SessionRecordResponse>> getSessionById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(sessionRecordService.getSessionById(id)));
    }

    /**
     * Updates session status specifically, enforcing FSM rules.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<SessionRecordResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam String newStatus,
            @RequestParam Integer version) {
        log.info("Updating status of session ID: {} to {}", id, newStatus);
        LessonStatus targetStatus = LessonStatus.valueOf(newStatus);
        SessionRecordResponse response = sessionRecordService.updateStatus(id, targetStatus, version);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật trạng thái buổi học", response));
    }

    /**
     * Duplicates an existing session record, creating a new one with the same details but a new ID.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<ApiResponse<SessionRecordResponse>> duplicateSession(@PathVariable Long id) {
        log.info("Duplicating session ID: {}", id);
        SessionRecordResponse response = sessionRecordService.duplicateSession(id);
        return ResponseEntity.ok(ApiResponse.success("Đã nhân bản buổi học thành công", response));
    }

    /**
     * Exports specified sessions to Excel format.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportToExcel(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Long studentId) {
        
        log.info("Exporting sessions to Excel (Month: {}, Student: {})", month, studentId);
        List<SessionRecordResponse> sessions;
        if (studentId != null && month != null) {
            sessions = sessionRecordService.getRecordsByStudentIdAndMonth(studentId, month);
        } else if (month != null) {
            sessions = sessionRecordService.getRecordsByMonth(month, Pageable.unpaged()).getContent();
        } else if (studentId != null) {
            sessions = sessionRecordService.getRecordsByStudentId(studentId, Pageable.unpaged()).getContent();
        } else {
            sessions = sessionRecordService.getAllRecords(Pageable.unpaged()).getContent();
        }

        try {
            byte[] bytes = exportService.exportSessionsToExcel(sessions);
            String fileName = "Sessions_Export_" + (month != null ? month : "All") + ".xlsx";

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=" + fileName)
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(bytes);
        } catch (Exception e) {
            log.error("Failed to export sessions to Excel", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Deletes all session records for a specific month.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @DeleteMapping("/month/{month}")
    public ResponseEntity<ApiResponse<Void>> deleteSessionsByMonth(@PathVariable String month) {
        log.warn("Deleting all sessions for month: {}", month);
        sessionRecordService.deleteSessionsByMonth(month);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa toàn bộ buổi học trong tháng " + month, null));
    }

    /**
     * Converts a calendar session record to an online session.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PatchMapping("/{id}/convert-to-online")
    public ResponseEntity<ApiResponse<OnlineSessionResponse>> convertToOnline(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        log.info("Converting session ID: {} to online by user: {}", id, user.getEmail());
        OnlineSessionResponse response = onlineSessionService.convertToOnline(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã chuyển đổi buổi học sang chế độ Online", response));
    }

    /**
     * Reverts a session record from online back to offline.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PatchMapping("/{id}/revert-to-offline")
    public ResponseEntity<ApiResponse<Void>> revertToOffline(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        log.info("Reverting session ID: {} to offline by user: {}", id, user.getEmail());
        onlineSessionService.revertToOffline(id, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Đã chuyển đổi buổi học về chế độ Offline", null));
    }
}
