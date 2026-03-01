package com.tutor_management.backend.modules.admin.service;

import com.tutor_management.backend.modules.admin.dto.response.AdminDocumentResponse;
import com.tutor_management.backend.modules.admin.dto.response.AdminDocumentStats;
import com.tutor_management.backend.modules.document.entity.Document;
import com.tutor_management.backend.modules.document.repository.DocumentRepository;
import com.tutor_management.backend.modules.shared.service.CloudinaryService;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminDocumentService {

    private final DocumentRepository documentRepository;
    private final TutorRepository tutorRepository;
    private final CloudinaryService cloudinaryService;
    private final com.tutor_management.backend.modules.finance.repository.SessionRecordRepository sessionRecordRepository;

    public Page<AdminDocumentResponse> getAllDocuments(String search, Long tutorId, String category, Pageable pageable) {
        Page<Document> documents;
        if (search != null && !search.isBlank()) {
            documents = documentRepository.findByTitleContainingIgnoreCase(search, category, tutorId, null, pageable);
        } else if (category != null && !category.isBlank()) {
            documents = documentRepository.findByCategoryCode(category, tutorId, null, pageable);
        } else {
            documents = documentRepository.findAllWithStudent(tutorId, null, null, false, pageable);
        }

        // Batch fetch tutor names for optimization
        Set<Long> tutorIds = documents.getContent().stream()
                .map(d -> d.getTutor() != null ? d.getTutor().getId() : null)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        
        Map<Long, String> tutorNames = tutorRepository.findAllById(tutorIds).stream()
                .collect(Collectors.toMap(Tutor::getId, Tutor::getFullName));

        return documents.map(d -> mapToResponse(d, d.getTutor() != null ? tutorNames.get(d.getTutor().getId()) : "Admin"));
    }

    public AdminDocumentStats getStats() {
        Long totalDocuments = documentRepository.count();
        Long totalDownloads = documentRepository.sumTotalDownloads(null);
        Long totalBytes = documentRepository.sumTotalFileSize(null);
        
        double totalMB = (totalBytes != null ? totalBytes : 0L) / (1024.0 * 1024.0);

        return AdminDocumentStats.builder()
                .totalDocuments(totalDocuments)
                .totalDownloads(totalDownloads != null ? totalDownloads : 0L)
                .totalStorageMB(totalMB)
                .build();
    }

    @Transactional
    public void deleteDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document not found with id: " + id));
        
        try {
            cloudinaryService.deleteFile(document.getFilePath());
            sessionRecordRepository.deleteDocumentReferences(id);
            documentRepository.delete(document);
        } catch (Exception e) {
             throw new RuntimeException("Failed to delete document: " + e.getMessage());
        }
    }

    private AdminDocumentResponse mapToResponse(Document d, String tutorName) {
        return AdminDocumentResponse.builder()
                .id(d.getId())
                .title(d.getTitle())
                .fileName(d.getFileName())
                .fileSize(d.getFileSize())
                .fileType(d.getFileType())
                .tutorId(d.getTutor() != null ? d.getTutor().getId() : null)
                .tutorName(tutorName)
                .category(d.getCategory() != null ? d.getCategory().getCode() : "OTHER")
                .downloadCount(d.getDownloadCount())
                .createdAt(d.getCreatedAt().toString())
                .build();
    }
}
