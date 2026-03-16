package com.tutor_management.backend.modules.auth.service;

import com.tutor_management.backend.modules.auth.Permission;
import com.tutor_management.backend.modules.auth.RoleEntity;
import com.tutor_management.backend.modules.auth.RoleRepository;
import com.tutor_management.backend.modules.auth.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

/**
 * Service for managing permissions and roles.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PermissionService {

    private final RoleRepository roleRepository;

    /**
     * Checks if a user has a specific permission.
     */
    public boolean hasPermission(User user, Permission permission) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        return user.getRole().getPermissions().contains(permission);
    }

    /**
     * Updates the permissions assigned to a role.
     */
    @Transactional
    public RoleEntity updateRolePermissions(Long roleId, Set<Permission> permissions) {
        RoleEntity role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found with ID: " + roleId));
        
        log.info("Updating permissions for role {}: {}", role.getName(), permissions);
        role.setPermissions(permissions);
        return roleRepository.save(role);
    }

    /**
     * Assigns a role to a user.
     * Note: This only changes the role in the User object. 
     * The User object must be saved by the caller or this method can be expanded.
     */
    public void assignRole(User user, String roleName) {
        RoleEntity role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        user.setRole(role);
    }
}
