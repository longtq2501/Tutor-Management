package com.tutor_management.backend.modules.document.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for uploading or updating a document's metadata.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRequest {
    /**
     * User-defined title for the document.
     */
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    /**
     * The unique code of the document category (e.g., "GRAMMAR").
     */
    @NotNull(message = "Danh mục không được để trống")
    private String category;

    /**
     * Comprehensive summary of the document content.
     */
    private String description;

    /**
     * Optional student ID if the document is being uploaded specifically for a student.
     */
    private Long studentId;

    /**
     * Optional folder ID where the document should be stored.
     */
    private Long folderId;
}
