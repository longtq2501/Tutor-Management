package com.tutor_management.backend.modules.admin.controller;

import com.tutor_management.backend.modules.admin.dto.response.AdminDocumentResponse;
import com.tutor_management.backend.modules.admin.dto.response.AdminDocumentStats;
import com.tutor_management.backend.modules.admin.service.AdminDocumentService;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/documents")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminDocumentController {

    private final AdminDocumentService adminDocumentService;

    // Endpoint to get all documents with optional filters and pagination
    @GetMapping
    public ApiResponse<Page<AdminDocumentResponse>> getAllDocuments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long tutorId,
            @RequestParam(required = false) String category,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(adminDocumentService.getAllDocuments(search, tutorId, category, pageable));
    }

    // Endpoint to get document statistics
    @GetMapping("/stats")
    public ApiResponse<AdminDocumentStats> getStats() {
        return ApiResponse.success(adminDocumentService.getStats());
    }

    // Endpoint to delete a document by ID
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteDocument(@PathVariable Long id) {
        adminDocumentService.deleteDocument(id);
        return ApiResponse.success(null);
    }
}
