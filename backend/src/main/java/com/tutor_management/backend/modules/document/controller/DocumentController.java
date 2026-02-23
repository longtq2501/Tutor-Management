package com.tutor_management.backend.modules.document.controller;

import com.tutor_management.backend.modules.document.DocumentCategoryType;
import com.tutor_management.backend.modules.document.service.DocumentService;
import com.tutor_management.backend.modules.document.dto.request.DocumentRequest;
import com.tutor_management.backend.modules.document.dto.response.DocumentResponse;
import com.tutor_management.backend.modules.document.dto.response.DocumentStats;
import com.tutor_management.backend.modules.document.dto.response.DocumentUploadResponse;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

/**
 * Controller for managing the document library.
 * Provides endpoints for uploading, searching, downloading, and statistics.
 */
@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Slf4j
public class DocumentController {

    private final DocumentService documentService;

    /**
     * Retrieves all documents with paged results.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    @GetMapping
    public ResponseEntity<ApiResponse<Page<DocumentResponse>>> getAllDocuments(
            @RequestParam(required = false) Long folderId,
            @RequestParam(defaultValue = "false") boolean isRoot,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getAllDocuments(folderId, isRoot, pageable)));
    }

    /**
     * Filters documents by their category classification.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<Page<DocumentResponse>>> getDocumentsByCategory(
            @PathVariable DocumentCategoryType category,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getDocumentsByCategory(category, pageable)));
    }

    /**
     * Searches for documents matching a keyword in the title.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<DocumentResponse>>> searchDocuments(
            @RequestParam String keyword,
            @RequestParam(required = false) String category,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(documentService.searchDocuments(keyword, category, pageable)));
    }

    /**
     * Fetches detailed metadata for a specific document.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponse>> getDocument(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(documentService.getDocumentById(id)));
    }

    /**
     * Handles file uploads with metadata.
     * Consumes multipart form data with 'file' and 'data' (JSON) parts.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentUploadResponse>> uploadDocument(
            @RequestPart("file") MultipartFile file,
            @RequestPart("data") DocumentRequest request) {
        DocumentUploadResponse response = documentService.uploadDocument(file, request);
        return ResponseEntity.ok(ApiResponse.success("Tải tài liệu lên thành công", response));
    }

    /**
     * Generates a temporary access URL for downloading and increments the usage count.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    @GetMapping("/{id}/download")
    public ResponseEntity<ApiResponse<Map<String, Object>>> downloadDocument(@PathVariable Long id) {
        DocumentResponse document = documentService.getDocumentById(id);
        String fileUrl = documentService.getDocumentUrl(id);

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "url", fileUrl,
                "fileName", document.getFileName(),
                "fileType", document.getFileType()
        )));
    }

    /**
     * Generates a preview URL without affecting download statistics.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    @GetMapping("/{id}/preview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> previewDocument(@PathVariable Long id) {
        DocumentResponse document = documentService.getDocumentById(id);
        String fileUrl = documentService.getPreviewUrl(id);

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "url", fileUrl,
                "fileName", document.getFileName(),
                "fileType", document.getFileType(),
                "fileSize", document.getFileSize()
        )));
    }

    /**
     * Permanently deletes a document from the system.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa tài liệu thành công", null));
    }

    /**
     * Retrieves library-wide metrics and storage summaries.
     */
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DocumentStats>> getStatistics() {
        return ResponseEntity.ok(ApiResponse.success(documentService.getStatistics(
                documentService.getCurrentTutorId(),
                documentService.getCurrentStudentId()
        )));
    }

    /**
     * Returns a list of all predefined legacy category types.
     */
    @PreAuthorize("permitAll()")
    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<DocumentCategoryType[]>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(DocumentCategoryType.values()));
    }
}
