package com.tutor_management.backend.modules.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for representing document statistics in the admin dashboard.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDocumentStats {
    private Long totalDocuments;
    private Long totalDownloads;
    private Double totalStorageMB;
}
