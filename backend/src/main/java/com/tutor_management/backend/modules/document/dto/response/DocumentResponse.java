package com.tutor_management.backend.modules.document.dto.response;

import com.tutor_management.backend.modules.document.DocumentCategoryType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Comprehensive response representing a document resource.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    /** Unique database record ID */
    private Long id;
    
    /** User-visible title */
    private String title;
    
    /** Original filename */
    private String fileName;
    
    /** Location or URL of the file */
    private String filePath;
    
    /** Size in bytes */
    private Long fileSize;
    
    /** MIME type (e.g., application/pdf) */
    private String fileType;
    
    /** Legacy category identifier */
    private DocumentCategoryType category;
    
    /** Human-readable display name of the legacy category */
    private String categoryDisplayName;
    
    /** Structured category ID */
    private Long categoryId;
    
    /** Structured category name */
    private String categoryName;
    
    /** Long-form description */
    private String description;
    
    /** ID of the student owner (if private) */
    private Long studentId;
    
    /** Name of the student owner (if private) */
    private String studentName;
    
    /** ID of the tutor who owns/uploaded this document */
    private Long tutorId;
    
    /** Name of the tutor who owns/uploaded this document */
    private String tutorName;

    private Long folderId;
    private String folderName;
    
    /** Usage statistics */
    private Long downloadCount;
    
    /** ISO-8601 creation timestamp */
    private String createdAt;
    
    /** ISO-8601 update timestamp */
    private String updatedAt;
    
    /** Human-friendly file size (e.g., "1.5 MB") */
    private String formattedFileSize;
}
