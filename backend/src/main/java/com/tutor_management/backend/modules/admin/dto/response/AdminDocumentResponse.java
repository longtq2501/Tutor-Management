package com.tutor_management.backend.modules.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for admin document entries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDocumentResponse {
    private Long id;
    private String title;
    private String fileName;
    private Long fileSize;
    private String fileType;
    private Long tutorId;
    private String tutorName;
    private String category;
    private Long downloadCount;
    private String createdAt;
}
