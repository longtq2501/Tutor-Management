package com.tutor_management.backend.modules.feedback.controller;

import com.tutor_management.backend.modules.feedback.service.SessionFeedbackService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tutor_management.backend.modules.feedback.dto.request.GenerateCommentRequest;
import com.tutor_management.backend.modules.feedback.dto.response.GenerateCommentResponse;
import com.tutor_management.backend.modules.feedback.dto.request.SessionFeedbackRequest;
import com.tutor_management.backend.modules.feedback.dto.response.SessionFeedbackResponse;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for Session Feedback management.
 * Provides endpoints for tutors to evaluate students and generate narrative reports.
 */
@RestController
@RequestMapping("/api/feedbacks")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
public class SessionFeedbackController {

    private final SessionFeedbackService sessionFeedbackService;

    /**
     * Records a new feedback entry for a session.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Long>> createFeedback(@Valid @RequestBody SessionFeedbackRequest request) {
        log.info("Creating feedback for student: {}", request.getStudentId());
        Long id = sessionFeedbackService.createFeedback(request);
        return ResponseEntity.ok(ApiResponse.success("Đã ghi nhận phản hồi buổi học", id));
    }

    /**
     * Updates an existing feedback record.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Long>> updateFeedback(
            @PathVariable Long id, 
            @Valid @RequestBody SessionFeedbackRequest request) {
        log.info("Updating feedback ID: {}", id);
        Long updatedId = sessionFeedbackService.updateFeedback(id, request);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật phản hồi", updatedId));
    }

    /**
     * Retrieves detailed feedback by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<SessionFeedbackResponse>> getFeedbackById(@PathVariable Long id) {
        SessionFeedbackResponse response = sessionFeedbackService.getFeedbackById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Finds feedback for a student in a specific session.
     */
    @GetMapping("/session/{sessionId}/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<SessionFeedbackResponse>> getFeedbackBySession(
            @PathVariable Long sessionId,
            @PathVariable Long studentId) {
        SessionFeedbackResponse response = sessionFeedbackService.getFeedbackBySession(sessionId, studentId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Retrieves a paginated history of feedback for a student.
     */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<Page<SessionFeedbackResponse>>> getFeedbackHistory(
            @PathVariable Long studentId,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SessionFeedbackResponse> history = sessionFeedbackService.getFeedbackHistory(studentId, pageable);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    /**
     * Generates a narrative comment using the Smart Generator engine.
     */
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<GenerateCommentResponse>> generateComment(@RequestBody GenerateCommentRequest request) {
        GenerateCommentResponse response = sessionFeedbackService.generateComment(request);
        return ResponseEntity.ok(ApiResponse.success("Đã tạo nội dung nhận xét", response));
    }


    /**
     * Formats feedback as a plain text block for external clipboard sharing.
     */
    @GetMapping("/{id}/clipboard")
    public ResponseEntity<ApiResponse<String>> getClipboardContent(@PathVariable Long id) {
        String content = sessionFeedbackService.getClipboardContent(id);
        return ResponseEntity.ok(ApiResponse.success(content));
    }

    /**
     * Exports feedback history to an Excel file.
     */
    @GetMapping("/export/student/{studentId}")
    public void exportFeedbacksToExcel(@PathVariable Long studentId, jakarta.servlet.http.HttpServletResponse response)
            throws java.io.IOException {
        log.info("Exporting feedback history for student {} to Excel", studentId);
        sessionFeedbackService.exportFeedbacksToExcel(studentId, response);
    }
}
