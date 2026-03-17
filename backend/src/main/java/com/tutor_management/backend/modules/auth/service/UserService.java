package com.tutor_management.backend.modules.auth.service;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.auth.dto.request.ChangePasswordRequest;
import com.tutor_management.backend.modules.auth.dto.request.UpdateUserRequest;
import com.tutor_management.backend.modules.auth.dto.response.AuthResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service class for managing user-related operations such as retrieving user profiles,
 * changing passwords, and updating user information.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Retrieves the profile information of a user by their ID.
     *
     * @param userId The ID of the user whose profile is to be retrieved.
     * @return An AuthResponse.UserInfo object containing the user's profile information.
     * @throws RuntimeException if the user with the specified ID is not found.
     */
    @Transactional(readOnly = true)
    public AuthResponse.UserInfo getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        return mapToUserInfo(user);
    }

    /**
     * Changes the password of a user.
     *
     * @param userId  The ID of the user whose password is to be changed.
     * @param request A ChangePasswordRequest object containing the current password,
     *                new password, and confirm password.
     * @throws RuntimeException if the user with the specified ID is not found.
     * @throws IllegalArgumentException if the current password is incorrect or if the new password
     *                                  and confirm password do not match.
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }

        // Check if new password matches confirm password
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirm password do not match");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /**
     * Updates the profile information of a user.
     *
     * @param userId  The ID of the user whose profile is to be updated.
     * @param request An UpdateUserRequest object containing the new profile information.
     * @return An AuthResponse.UserInfo object containing the updated user's profile information.
     * @throws RuntimeException if the user with the specified ID is not found.
     */
    @Transactional
    public AuthResponse.UserInfo updateUserProfile(Long userId, UpdateUserRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        user.setFullName(request.getFullName());
        user.setBankName(request.getBankName());
        user.setAccountNumber(request.getAccountNumber());
        user.setAccountName(request.getAccountName());
        user.setBankCode(request.getBankCode());
        
        return mapToUserInfo(userRepository.save(user));
    }

    /**
     * Marks onboarding tour as completed for the given user.
     * This operation is idempotent: repeated calls keep the same completed state.
     */
    @Transactional
    public void completeTour(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        if (!user.isTourCompleted()) {
            user.setTourCompleted(true);
            user.setTourCompletedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    /**
     * Maps a User entity to an AuthResponse.UserInfo DTO.
     *
     * @param user The User entity to be mapped.
     * @return An AuthResponse.UserInfo object containing the user's profile information.
     */
    private AuthResponse.UserInfo mapToUserInfo(User user) {
        return AuthResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .avatarUrl(user.getAvatarUrl())
                .studentId(user.getStudentId())
                .bankName(user.getBankName())
                .accountNumber(user.getAccountNumber())
                .accountName(user.getAccountName())
                .bankCode(user.getBankCode())
                .tourCompleted(user.isTourCompleted())
                .tourCompletedAt(user.getTourCompletedAt())
                .build();
    }
}
