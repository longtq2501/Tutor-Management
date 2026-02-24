package com.tutor_management.backend.util;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Centralized utility for resolving identities from the SecurityContext.
 * Enforces multi-tenancy isolation by strictly mapping Users to their respective Roles and IDs.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SecurityContextUtils {

    private final UserRepository userRepository;
    private final TutorRepository tutorRepository;

    /**
     * Resolves the current Tutor ID.
     * - Returns NULL if the user is an ADMIN (Admins have global access).
     * - Throws IllegalStateException if the user is a TUTOR but has no linked Tutor profile.
     * - Returns NULL for other roles (unless explicit handling is added).
     *
     * @return The unique ID of the Tutor, or NULL for Admins.
     * @throws IllegalStateException If a Tutor profile is missing for a TUTOR user.
     */
    public Long getCurrentTutorId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }

        User user;
        if (auth.getPrincipal() instanceof User) {
            user = (User) auth.getPrincipal();
        } else {
            String email = auth.getName();
            user = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        log.error("Authenticated user identity (name={}) not found in database", email);
                        return new IllegalStateException("User identity not found");
                    });
        }

        if ("ADMIN".equals(user.getRole().getName())) {
            log.debug("User {} resolved as ADMIN (null tutorId)", user.getEmail());
            return null;
        }

        if ("TUTOR".equals(user.getRole().getName())) {
            return tutorRepository.findByUserId(user.getId())
                    .map(Tutor::getId)
                    .orElseThrow(() -> {
                        log.error("CRITICAL: Tutor profile missing for authenticated user: {}", user.getEmail());
                        return new IllegalStateException("Hồ sơ Gia sư chưa được khởi tạo. Vui lòng đăng nhập lại.");
                    });
        }

        // Default: Students or other roles don't have a tutorId in this context
        return null;
    }

    /**
     * Resolves the current User entity.
     */
    public Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return Optional.empty();
        }

        if (auth.getPrincipal() instanceof User) {
            return Optional.of((User) auth.getPrincipal());
        }

        String email = auth.getName();
        return userRepository.findByEmail(email);
    }
}
