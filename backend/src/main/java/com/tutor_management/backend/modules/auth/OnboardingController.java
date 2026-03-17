package com.tutor_management.backend.modules.auth;

import com.tutor_management.backend.modules.auth.service.UserService;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class OnboardingController {

    private final UserService userService;

    @PatchMapping("/tour-complete")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> completeTour(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        userService.completeTour(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Tour completed", null));
    }
}
