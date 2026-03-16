package com.tutor_management.backend.modules.system.controller;

import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import com.tutor_management.backend.modules.system.service.SystemSettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller for managing system settings.
 * Provides endpoints for retrieving and updating system configurations.
 */
@RestController
@RequestMapping("/api/admin/system/settings")
@RequiredArgsConstructor
public class SystemSettingController {

    private final SystemSettingService settingService;

    /**
     * Retrieves all system settings.
     *
     * @return A response entity containing a map of setting keys and their corresponding values.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> getAllSettings() {
        return ResponseEntity.ok(ApiResponse.success(settingService.getAllSettings()));
    }

    /**
     * Updates system settings based on the provided key-value pairs.
     *
     * @param settings A map containing setting keys and their new values to be updated.
     * @return A response entity indicating the success of the update operation.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> updateSettings(@RequestBody Map<String, String> settings) {
        settingService.updateAll(settings);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật cấu hình hệ thống", null));
    }
}
