package com.tutor_management.backend.modules.auth.service;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.auth.dto.request.UpdateUserRequest;
import com.tutor_management.backend.modules.auth.dto.response.AuthResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public AuthResponse.UserInfo getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        return mapToUserInfo(user);
    }

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
                .build();
    }
}
