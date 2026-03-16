package com.tutor_management.backend.modules.document.service;

import com.tutor_management.backend.exception.ResourceNotFoundException;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.document.repository.DocumentCategoryRepository;
import com.tutor_management.backend.modules.document.DocumentCategoryType;
import com.tutor_management.backend.modules.document.repository.DocumentRepository;
import com.tutor_management.backend.modules.document.dto.request.DocumentRequest;
import com.tutor_management.backend.modules.document.dto.response.DocumentResponse;
import com.tutor_management.backend.modules.document.dto.response.DocumentStats;
import com.tutor_management.backend.modules.document.dto.response.DocumentUploadResponse;
import com.tutor_management.backend.modules.document.entity.Document;
import com.tutor_management.backend.modules.document.entity.DocumentCategory;
import com.tutor_management.backend.modules.document.repository.FolderRepository;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for managing file uploads, document library navigation, and storage statistics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentCategoryRepository documentCategoryRepository;
    private final FolderRepository folderRepository;
    private final StudentRepository studentRepository;
    private final TutorRepository tutorRepository;
    private final SessionRecordRepository sessionRecordRepository;
    private final com.tutor_management.backend.modules.shared.service.CloudinaryService cloudinaryService;
    private final com.tutor_management.backend.modules.admin.service.AdminStatsService adminStatsService;
    private final DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

    /**
     * Resolves the current student ID IF the user is a student.
     * Used to filter documents intended for the specific student.
     */
    public Long getCurrentStudentId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) {
            return null;
        }

        if (user.getRole() == null) {
            return null;
        }

        return "STUDENT".equals(user.getRole().getName()) ? user.getStudentId() : null;
    }

    /**
     * Resolves the current tutor ID based on the authenticated user.
     * If ADMIN, returns null (sees all documents).
     * If TUTOR, returns their specific tutor ID.
     * If STUDENT, returns null (isolation is handled via student_id filtering if needed, 
     * but usually students see documents from their tutor - this may need further refinement).
     */
    public Long getCurrentTutorId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User user)) {
            return null;
        }

        if (user.getRole() == null) {
            return null;
        }

        if ("ADMIN".equals(user.getRole().getName())) {
            return null;
        }

        if ("TUTOR".equals(user.getRole().getName())) {
            return tutorRepository.findByUserId(user.getId())
                    .map(Tutor::getId)
                    .orElse(null);
        }

        if ("STUDENT".equals(user.getRole().getName()) && user.getStudentId() != null) {
            return studentRepository.findById(user.getStudentId())
                    .map(Student::getTutorId)
                    .orElse(null);
        }

        return null;
    }

    /**
     * Lists all documents with paged results for the admin library.
     */
    @Transactional(readOnly = true)
    public Page<DocumentResponse> getAllDocuments(Long folderId, boolean isRoot, Pageable pageable) {
        return documentRepository.findAllWithStudent(getCurrentTutorId(), getCurrentStudentId(), folderId, isRoot, pageable)
                .map(this::convertToResponse);
    }

    /**
     * Filters documents by category with paged results.
     */
    @Transactional(readOnly = true)
    public Page<DocumentResponse> getDocumentsByCategory(DocumentCategoryType category, Pageable pageable) {
        return documentRepository.findByCategoryCode(category.name(), getCurrentTutorId(), getCurrentStudentId(), pageable).map(this::convertToResponse);
    }

    /**
     * Searches for documents by title (case-insensitive).
     */
    @Transactional(readOnly = true)
    public Page<DocumentResponse> searchDocuments(String keyword, String categoryCode, Pageable pageable) {
        return documentRepository.findByTitleContainingIgnoreCase(keyword, categoryCode, getCurrentTutorId(), getCurrentStudentId(), pageable)
                .map(this::convertToResponse);
    }

    /**
     * Validates and uploads a document to Cloudinary, then stores metadata in the database.
     * Clears statistical caches upon success.
     */
    @CacheEvict(value = "documentStats", allEntries = true)
    public DocumentUploadResponse uploadDocument(MultipartFile file, DocumentRequest request) {
        validateFileUpload(file);

        try {
            String cloudinaryUrl = cloudinaryService.uploadFile(file);
            
            Student student = null;
            if (request.getStudentId() != null) {
                student = studentRepository.findById(request.getStudentId()).orElse(null);
            }

            DocumentCategory category = documentCategoryRepository.findByCode(request.getCategory())
                    .orElseThrow(() -> new ResourceNotFoundException("Document category not found: " + request.getCategory()));

            // Find current tutor to set ownership
            Tutor tutor = null;
            Long tutorId = getCurrentTutorId();
            if (tutorId != null) {
                tutor = tutorRepository.findById(tutorId).orElse(null);
            }

            Document document = Document.builder()
                    .title(request.getTitle())
                    .fileName(file.getOriginalFilename())
                    .filePath(cloudinaryUrl)
                    .fileSize(file.getSize())
                    .fileType(file.getContentType())
                    .category(category)
                    .description(request.getDescription())
                    .student(student)
                    .tutor(tutor)
                    .folder(request.getFolderId() != null ? folderRepository.findById(request.getFolderId()).orElse(null) : null)
                    .downloadCount(0L)
                    .build();

            Document saved = documentRepository.save(document);
            log.info("Document '{}' uploaded successfully with ID: {}", saved.getTitle(), saved.getId());

            // Log administrative activity
            String actorName = tutor != null ? tutor.getFullName() : "Admin";
            String actorRole = tutor != null ? "TUTOR" : "ADMIN";
            adminStatsService.logActivity(
                    "DOCUMENT_UPLOAD",
                    actorName,
                    actorRole,
                    "Đã tải lên tài liệu mới: " + saved.getTitle()
            );

            return DocumentUploadResponse.builder()
                    .id(saved.getId())
                    .title(saved.getTitle())
                    .fileName(saved.getFileName())
                    .message("File uploaded successfully")
                    .build();

        } catch (Exception e) {
            log.error("Failed to upload document: {}", e.getMessage(), e);
            throw new RuntimeException("Could not complete document upload: " + e.getMessage());
        }
    }

    private void validateFileUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Cannot upload an empty file");
        }

        String contentType = file.getContentType();
        if (!isValidFileType(contentType)) {
            throw new IllegalArgumentException("Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, TXT");
        }
    }

    /**
     * Retrieves a single document by ID.
     */
    @Transactional(readOnly = true)
    public DocumentResponse getDocumentById(Long id) {
        return documentRepository.findById(id)
                .map(this::convertToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
    }

    /**
     * Increments download count and returns the file access URL.
     */
    public String getDocumentUrl(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));

        document.setDownloadCount(document.getDownloadCount() + 1);
        documentRepository.save(document);

        return document.getFilePath();
    }

    /**
     * Returns the file access URL without incrementing statistics.
     */
    @Transactional(readOnly = true)
    public String getPreviewUrl(Long id) {
        return documentRepository.findById(id)
                .map(Document::getFilePath)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));
    }

    /**
     * Removes a document from the remote cloud storage and the local database.
     * Also detaches the document from any associated session records.
     */
    @CacheEvict(value = "documentStats", allEntries = true)
    public void deleteDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + id));

        // Ownership check: Tutors can only delete their own documents.
        // Admins can delete everything.
        Long currentTutorId = getCurrentTutorId();
        if (currentTutorId != null) {
            if (document.getTutor() == null || !document.getTutor().getId().equals(currentTutorId)) {
                log.warn("Unauthorized delete attempt: Tutor {} tried to delete document {} owned by {}", 
                        currentTutorId, id, document.getTutor() != null ? document.getTutor().getId() : "null");
                throw new RuntimeException("Bạn không có quyền xóa tài liệu này");
            }
        }

        try {
            cloudinaryService.deleteFile(document.getFilePath());
            sessionRecordRepository.deleteDocumentReferences(id);
            documentRepository.delete(document);
            log.info("Deleted document with ID: {}", id);
        } catch (Exception e) {
            log.error("Error deleting document {}: {}", id, e.getMessage());
            throw new RuntimeException("Failed to delete document: " + e.getMessage());
        }
    }

    /**
     * Generates a snapshot of document library usage stats.
     * Uses a single optimized database query for aggregated totals.
     */
    @Cacheable(value = "documentStats", key = "#tutorId?.toString() + '-' + #studentId?.toString()")
    @Transactional(readOnly = true)
    public DocumentStats getStatistics(Long tutorId, Long studentId) {
        List<Object[]> aggregatedResult = documentRepository.getAggregatedStats(tutorId, studentId);
        
        Long totalDocuments = 0L;
        Long totalSize = 0L;
        Long totalDownloads = 0L;

        if (aggregatedResult != null && !aggregatedResult.isEmpty()) {
            Object[] results = aggregatedResult.get(0);
            totalDocuments = results[0] != null ? ((Number) results[0]).longValue() : 0L;
            totalSize = results[1] != null ? ((Number) results[1]).longValue() : 0L;
            totalDownloads = results[2] != null ? ((Number) results[2]).longValue() : 0L;
        }

        Map<String, Long> statsMap = new HashMap<>();
        for (DocumentCategoryType type : DocumentCategoryType.values()) {
             statsMap.put(type.name(), 0L);
        }

        documentRepository.countDocumentsByCategoryCode(tutorId, studentId).forEach(row -> {
             String code = (String) row[0];
             Long count = (Long) row[1];
             if (code != null) statsMap.put(code, count);
        });

        return DocumentStats.builder()
                .totalDocuments(totalDocuments)
                .totalSize(totalSize)
                .formattedTotalSize(formatFileSize(totalSize))
                .totalDownloads(totalDownloads)
                .categoryStats(statsMap)
                .build();
    }

    private boolean isValidFileType(String contentType) {
        if (contentType == null) return false;
        return List.of(
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-powerpoint",
                "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                "text/plain"
        ).contains(contentType);
    }

    private DocumentResponse convertToResponse(Document document) {
        return DocumentResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .fileName(document.getFileName())
                .filePath(document.getFilePath())
                .fileSize(document.getFileSize())
                .fileType(document.getFileType())
                .category(determineCategoryType(document))
                .categoryDisplayName(document.getCategory() != null ? document.getCategory().getName() : "N/A")
                .categoryId(document.getCategory() != null ? document.getCategory().getId() : null)
                .categoryName(document.getCategory() != null ? document.getCategory().getName() : null)
                .studentId(document.getStudent() != null ? document.getStudent().getId() : null)
                .studentName(document.getStudent() != null ? document.getStudent().getName() : null)
                .tutorId(document.getTutor() != null ? document.getTutor().getId() : null)
                .tutorName(document.getTutor() != null ? document.getTutor().getFullName() : null)
                .folderId(document.getFolder() != null ? document.getFolder().getId() : null)
                .folderName(document.getFolder() != null ? document.getFolder().getName() : null)
                .downloadCount(document.getDownloadCount())
                .createdAt(document.getCreatedAt().format(formatter))
                .updatedAt(document.getUpdatedAt().format(formatter))
                .formattedFileSize(formatFileSize(document.getFileSize()))
                .build();
    }

    private DocumentCategoryType determineCategoryType(Document document) {
        if (document.getCategoryType() != null) return document.getCategoryType();
        if (document.getCategory() == null) return DocumentCategoryType.OTHER;
        
        try {
            return DocumentCategoryType.valueOf(document.getCategory().getCode());
        } catch (IllegalArgumentException e) {
            return DocumentCategoryType.OTHER;
        }
    }

    private String formatFileSize(long size) {
        if (size <= 0) return "0 B";
        final String[] units = {"B", "KB", "MB", "GB"};
        int digitGroups = (int) (Math.log10(size) / Math.log10(1024));
        return String.format("%.2f %s", size / Math.pow(1024, digitGroups), units[digitGroups]);
    }
}
