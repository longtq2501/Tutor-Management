package com.tutor_management.backend.modules.support.controller;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import com.tutor_management.backend.modules.support.dto.response.SupportConversationResponse;
import com.tutor_management.backend.modules.support.dto.response.SupportMessageResponse;
import com.tutor_management.backend.modules.support.service.SupportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
public class SupportController {

    private final SupportService supportService;

    // ─── User endpoints ───────────────────────────────────────────────────────

    /** Returns the current user's support conversation, creating it if it doesn't exist yet. */
    @GetMapping("/my-conversation")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<SupportConversationResponse>> getMyConversation(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(supportService.getOrCreateConversation(user.getId())));
    }

    /** Paginates the message history for the current user's conversation. */
    @GetMapping("/my-conversation/messages")
    @PreAuthorize("hasAnyRole('TUTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<List<SupportMessageResponse>>> getMyMessages(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        SupportConversationResponse conv = supportService.getOrCreateConversation(user.getId());
        return ResponseEntity.ok(ApiResponse.success(supportService.getMessages(conv.getId(), page, size)));
    }

    // ─── Admin endpoints ──────────────────────────────────────────────────────

    /** Returns all support conversations sorted by most recent message. */
    @GetMapping("/admin/conversations")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SupportConversationResponse>>> getAllConversations() {
        return ResponseEntity.ok(ApiResponse.success(supportService.getAllConversations()));
    }

    /** Loads message history and marks all messages as read for the given conversation. */
    @GetMapping("/admin/conversations/{id}/messages")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SupportMessageResponse>>> getMessages(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        supportService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success(supportService.getMessages(id, page, size)));
    }

    /** Changes the status of a conversation (e.g., OPEN → RESOLVED). */
    @PatchMapping("/admin/conversations/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SupportConversationResponse>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.success(supportService.updateStatus(id, status)));
    }
}
