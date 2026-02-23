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

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class FolderService {

    private final FolderRepository folderRepository;
    private final TutorRepository tutorRepository;
    private final DocumentService documentService;
    private final DateTimeFormatter formatter = DateTimeFormatter.ISO_DATE_TIME;

    public List<FolderResponse> getRootFolders() {
        Long tutorId = documentService.getCurrentTutorId();
        return folderRepository.findRootFoldersByTutorId(tutorId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public List<FolderResponse> getSubfolders(Long parentId) {
        return folderRepository.findByParentId(parentId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

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
