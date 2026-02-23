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

@RestController
@RequestMapping("/api/folders")
@RequiredArgsConstructor
@Slf4j
public class FolderController {

    private final FolderService folderService;

    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @GetMapping("/root")
    public ResponseEntity<ApiResponse<List<FolderResponse>>> getRootFolders() {
        return ResponseEntity.ok(ApiResponse.success(folderService.getRootFolders()));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @GetMapping("/{id}/subfolders")
    public ResponseEntity<ApiResponse<List<FolderResponse>>> getSubfolders(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(folderService.getSubfolders(id)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping
    public ResponseEntity<ApiResponse<FolderResponse>> createFolder(@RequestBody FolderRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Đã tạo thư mục thành công", folderService.createFolder(request)));
    }

    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteFolder(@PathVariable Long id) {
        folderService.deleteFolder(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa thư mục thành công", null));
    }
}
