package com.tutor_management.backend.modules.auth;

import com.tutor_management.backend.modules.auth.dto.request.LoginRequest;
import com.tutor_management.backend.modules.auth.dto.request.RefreshTokenRequest;
import com.tutor_management.backend.modules.auth.dto.request.RegisterRequest;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import com.tutor_management.backend.modules.auth.dto.response.AuthResponse;
import com.tutor_management.backend.modules.auth.service.AuthenticationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * AuthenticationController handles all authentication-related endpoints such as registration, login, token refresh, and logout.
 * It uses AuthenticationService to perform the actual authentication logic and returns standardized API responses.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    /**
     * Registers a new user with the provided registration details.
     *
     * @param request The registration request containing user details.
     * @return A response entity containing the authentication response with user info and tokens.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authenticationService.register(request);
        return ResponseEntity.ok(ApiResponse.success("User registered successfully", response));
    }

    /**
     * Authenticates a user with the provided login credentials.
     *
     * @param request The login request containing email and password.
     * @return A response entity containing the authentication response with user info and tokens.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        AuthResponse response = authenticationService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    /**
     * Refreshes the access token using the provided refresh token.
     *
     * @param request The refresh token request containing the refresh token.
     * @return A response entity containing the new authentication response with user info and tokens.
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse response = authenticationService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Token refreshed successfully", response));
    }

    /**
     * Logs out the currently authenticated user by invalidating their refresh token.
     *
     * @param authentication The authentication object containing the current user's details.
     * @return A response entity indicating that the logout was successful.
     */
    @PreAuthorize("isAuthenticated()")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        authenticationService.logout(user.getId());
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    /**
     * Retrieves the current authenticated user's information.
     *
     * @param authentication The authentication object containing the current user's details.
     * @return A response entity containing the user's information.
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserInfo>> getCurrentUser(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        AuthResponse.UserInfo userInfo = AuthResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().getName())
                .avatarUrl(user.getAvatarUrl())
                .studentId(user.getStudentId())
            .tourCompleted(user.isTourCompleted())
            .tourCompletedAt(user.getTourCompletedAt())
                .build();
        return ResponseEntity.ok(ApiResponse.success(userInfo));
    }
}
