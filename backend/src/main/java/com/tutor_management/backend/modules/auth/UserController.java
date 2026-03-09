package com.tutor_management.backend.modules.auth;

import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import com.tutor_management.backend.modules.shared.service.CloudinaryService;
import com.tutor_management.backend.modules.auth.dto.request.ChangePasswordRequest;
import com.tutor_management.backend.modules.auth.dto.request.UpdateUserRequest;
import com.tutor_management.backend.modules.auth.dto.response.AuthResponse;
import com.tutor_management.backend.modules.auth.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final UserRepository userRepository;
    private final CloudinaryService cloudinaryService;
    private final UserService userService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getCurrentUser(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(userService.getUserProfile(user.getId())));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> updateProfile(
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(
                "Profile updated successfully",
                userService.updateUserProfile(user.getId(), request)
        ));
    }

    @PutMapping("/me/avatar")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> updateAvatar(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) throws IOException {
        User user = (User) authentication.getPrincipal();
        
        log.info("Updating avatar for user: {}", user.getEmail());
        
        // 1. Upload to Cloudinary
        String avatarUrl = cloudinaryService.uploadFile(file);
        
        // 2. Update user entity
        // Note: Principal might be stale if we just use 'user' object from authentication,
        // but since we are updating the DB and returning the URL, it's fine for the client.
        // For consistency, we fetch the latest user from DB.
        User persistentUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        persistentUser.setAvatarUrl(avatarUrl);
        userRepository.save(persistentUser);
        
        return ResponseEntity.ok(ApiResponse.success("Avatar updated successfully", avatarUrl));
    }

    @PutMapping("/me/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication
    ) {
        User user = (User) authentication.getPrincipal();
        userService.changePassword(user.getId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }
}
