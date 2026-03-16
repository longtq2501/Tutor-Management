package com.tutor_management.backend.modules.document.service;

import com.tutor_management.backend.exception.ResourceNotFoundException;
import com.tutor_management.backend.modules.document.dto.request.FolderRequest;
import com.tutor_management.backend.modules.document.dto.response.FolderResponse;
import com.tutor_management.backend.modules.document.entity.Folder;
import com.tutor_management.backend.modules.document.repository.FolderRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing folders in the document library, including creation, retrieval, and deletion.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FolderService {

    private final FolderRepository folderRepository;
    private final TutorRepository tutorRepository;
    private final DocumentService documentService;
    private final DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

    // Retrieves all root folders for the current tutor. If no tutor is logged in, returns all root folders.
    public List<FolderResponse> getRootFolders() {
        Long tutorId = documentService.getCurrentTutorId();
        return folderRepository.findRootFoldersByTutorId(tutorId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // Retrieves all subfolders under a given parent folder. If no tutor is logged in, returns all subfolders under the parent.
    public List<FolderResponse> getSubfolders(Long parentId) {
        return folderRepository.findByParentId(parentId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    // Creates a new folder under the specified parent (if provided) and associates it with the current tutor (if logged in).
    public FolderResponse createFolder(FolderRequest request) {
        Long tutorId = documentService.getCurrentTutorId();
        Tutor tutor = null;
        if (tutorId != null) {
            tutor = tutorRepository.findById(tutorId).orElse(null);
        }

        Folder parent = null;
        if (request.getParentId() != null) {
            parent = folderRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent folder not found"));
        }

        Folder folder = Folder.builder()
                .name(request.getName())
                .parent(parent)
                .tutor(tutor)
                .subfolders(new java.util.ArrayList<>())
                .documents(new java.util.ArrayList<>())
                .build();

        Folder saved = folderRepository.save(folder);
        return convertToResponse(saved);
    }

    // Deletes a folder by ID, ensuring that the folder belongs to the current tutor (if logged in) before deletion.
    public void deleteFolder(Long id) {
        Long tutorId = documentService.getCurrentTutorId();
        Folder folder;
        if (tutorId != null) {
            folder = folderRepository.findByIdAndTutorId(id, tutorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Folder not found or unauthorized"));
        } else {
            folder = folderRepository.findById(id)
                    .orElseThrow(() -> new ResourceNotFoundException("Folder not found"));
        }
        folderRepository.delete(folder);
    }

    // Helper method to convert a Folder entity to a FolderResponse DTO, including basic details and document count.
    private FolderResponse convertToResponse(Folder folder) {
        return FolderResponse.builder()
                .id(folder.getId())
                .name(folder.getName())
                .parentId(folder.getParent() != null ? folder.getParent().getId() : null)
                .documentCount(folder.getDocuments() != null ? folder.getDocuments().size() : 0)
                .createdAt(folder.getCreatedAt().format(formatter))
                // We don't recursively fetch subfolders here to avoid deep trees in response
                .subfolders(Collections.emptyList()) 
                .build();
    }
}
