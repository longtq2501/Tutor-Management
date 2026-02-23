package com.tutor_management.backend.modules.document.entity;

import com.tutor_management.backend.modules.document.DocumentCategoryType;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entity representing a study document or resource in the system.
 * Documents can be global (for all students) or private (linked to a specific student).
 */
@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Display title of the document.
     */
    @Column(nullable = false)
    private String title;

    /**
     * Original filename of the uploaded file.
     */
    @Column(nullable = false)
    private String fileName;

    /**
     * Remote URL or local storage path for the file (Cloudinary URL).
     */
    @Column(nullable = false)
    private String filePath;

    /**
     * File size in bytes.
     */
    @Column(nullable = false)
    private Long fileSize;

    /**
     * Content type (e.g., application/pdf, image/png).
     */
    @Column(nullable = false)
    private String fileType;

    /**
     * Legacy category field for backwards compatibility or quick filtering.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "category", insertable = false, updatable = false, nullable = true)
    private DocumentCategoryType categoryType;

    /**
     * Structured category classification.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private DocumentCategory category;

    /**
     * Folder organization.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id")
    private Folder folder;

    /**
     * Short summary or descriptive text about the document's content.
     */
    @Column(length = 1000)
    private String description;

    /**
     * Owner student if the document is private. 
     * If null, the document is available to all students (shared resource).
     */
     @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    /**
     * Owner tutor who uploaded the document.
     * Essential for multi-tenancy to ensure tutors only see/manage their own files.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id")
    private Tutor tutor;

    /**
     * Statistics tracking for how many times the file has been opened/downloaded.
     */
    @Column(nullable = false)
    @Builder.Default
    private Long downloadCount = 0L;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (downloadCount == null) {
            downloadCount = 0L;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
