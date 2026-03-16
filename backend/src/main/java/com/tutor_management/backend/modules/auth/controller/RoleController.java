package com.tutor_management.backend.modules.auth.controller;

import com.tutor_management.backend.modules.auth.Permission;
import com.tutor_management.backend.modules.auth.RoleEntity;
import com.tutor_management.backend.modules.auth.RoleRepository;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Controller for managing roles and permissions.
 * Restricted to ADMIN users only.
 */
@RestController
@RequestMapping("/api/admin/roles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class RoleController {

    private final RoleRepository roleRepository;
    private final com.tutor_management.backend.modules.auth.service.PermissionService permissionService;

    /**
     * Retrieves all roles in the system.
     * Accessible only to ADMIN users.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleEntity>>> getAllRoles() {
        return ResponseEntity.ok(ApiResponse.success(roleRepository.findAll()));
    }

    /**
     * Retrieves all available permissions in the system.
     * Accessible only to ADMIN users.
     */
    @GetMapping("/permissions")
    public ResponseEntity<ApiResponse<List<String>>> getAllAvailablePermissions() {
        List<String> permissions = Arrays.stream(Permission.values())
                .map(Enum::name)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(permissions));
    }

    /**
     * Updates the permissions of a specific role.
     * Accessible only to ADMIN users.
     */
    @PutMapping("/{id}/permissions")
    public ResponseEntity<ApiResponse<RoleEntity>> updateRolePermissions(
            @PathVariable Long id,
            @RequestBody Set<String> permissionNames) {
        
        Set<Permission> permissions = permissionNames.stream()
                .map(name -> {
                    try {
                        return Permission.valueOf(name);
                    } catch (IllegalArgumentException e) {
                        throw new RuntimeException("Invalid permission name: " + name);
                    }
                })
                .collect(Collectors.toSet());

        RoleEntity updatedRole = permissionService.updateRolePermissions(id, permissions);
        return ResponseEntity.ok(ApiResponse.success("Quyền hạn của vai trò đã được cập nhật", updatedRole));
    }
}
