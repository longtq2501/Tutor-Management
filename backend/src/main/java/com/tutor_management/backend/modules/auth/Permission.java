package com.tutor_management.backend.modules.auth;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * Enum representing various permissions in the tutor management system.
 * Each permission is associated with a specific string value that can be used for authorization checks.
 */
@RequiredArgsConstructor
public enum Permission {

    ADMIN_READ("admin:read"),
    ADMIN_UPDATE("admin:update"),
    ADMIN_CREATE("admin:create"),
    ADMIN_DELETE("admin:delete"),

    MANAGE_USERS("manage:users"),
    MANAGE_PERMISSIONS("manage:permissions"),
    VIEW_AUDIT_LOGS("view:audit_logs"),
    MANAGE_SYSTEM_SETTINGS("manage:system_settings"),

    TUTOR_READ("tutor:read"),
    TUTOR_UPDATE("tutor:update"),
    TUTOR_CREATE("tutor:create"),
    TUTOR_DELETE("tutor:delete"),

    STUDENT_READ("student:read"),
    STUDENT_UPDATE("student:update"),
    STUDENT_CREATE("student:create"),
    STUDENT_DELETE("student:delete");

    @Getter
    private final String permission;
}
