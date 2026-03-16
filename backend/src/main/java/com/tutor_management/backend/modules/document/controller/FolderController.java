package com.tutor_management.backend.modules.document.controller;

import com.tutor_management.backend.modules.document.dto.request.FolderRequest;
import com.tutor_management.backend.modules.document.dto.response.FolderResponse;
import com.tutor_management.backend.modules.document.service.FolderService;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for managing document folders.
 * Provides endpoints for creating, retrieving, and deleting folders.
 */
@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
@Slf4j
public class FolderController {

    private final FolderService folderService;

    // Retrieves all root folders (folders without a parent).
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @GetMapping("/root")
    public ResponseEntity<ApiResponse<List<FolderResponse>>> getRootFolders() {
        return ResponseEntity.ok(ApiResponse.success(folderService.getRootFolders()));
    }

    // Retrieves all subfolders under a specific parent folder.
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @GetMapping("/{id}/subfolders")
    public ResponseEntity<ApiResponse<List<FolderResponse>>> getSubfolders(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(folderService.getSubfolders(id)));
    }

    // Creates a new folder, either as a root folder or as a subfolder under an existing folder.
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping
    public ResponseEntity<ApiResponse<FolderResponse>> createFolder(@RequestBody FolderRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã tạo thư mục thành công", folderService.createFolder(request)));
    }

    // Deletes a folder by its ID. This will also delete all subfolders and documents contained within it.
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFolder(@PathVariable Long id) {
        folderService.deleteFolder(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thư mục thành công", null));
    }
}
