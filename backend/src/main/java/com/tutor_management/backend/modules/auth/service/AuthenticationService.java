package com.tutor_management.backend.modules.auth.service;

import com.tutor_management.backend.modules.auth.dto.request.LoginRequest;
import com.tutor_management.backend.modules.auth.dto.request.RegisterRequest;
import com.tutor_management.backend.modules.auth.dto.response.AuthResponse;
import com.tutor_management.backend.modules.auth.RefreshToken;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.auth.RoleEntity;
import com.tutor_management.backend.modules.auth.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service class for handling authentication-related operations such as registration, login, token refresh, and logout.
 * This class interacts with the UserRepository, RoleRepository, JwtService, and RefreshTokenService to manage user authentication and authorization.
 */
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final AuthenticationManager authenticationManager;
    private final com.tutor_management.backend.modules.tutor.service.TutorService tutorService;
    private final com.tutor_management.backend.modules.admin.service.AdminStatsService adminStatsService;

    // CRITICAL: Ensure that registration and login processes are wrapped in transactions to maintain data integrity, especially when auto-provisioning Tutor profiles.
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new com.tutor_management.backend.exception.AlreadyExistsException("Email này đã được sử dụng bởi một tài khoản khác.");
        }

        // Find role
        RoleEntity role = roleRepository.findByName(request.getRole())
                .orElseThrow(() -> new RuntimeException("Role not found: " + request.getRole()));

        // Create new user
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(role)
                .enabled(true)
                .accountNonLocked(true)
                .build();

        User savedUser = userRepository.save(user);

        // CRITICAL: Auto-provision Tutor profile - ONLY for TUTORs
        if ("TUTOR".equals(savedUser.getRole().getName())) {
            tutorService.ensureTutorProfile(savedUser);
        }

        // Log administrative activity
        adminStatsService.logActivity(
                "TUTOR_REGISTER",
                savedUser.getFullName(),
                savedUser.getRole().getName(),
                "Tutor mới đăng ký hệ thống: " + savedUser.getEmail()
        );

        // Generate tokens
        String accessToken = jwtService.generateToken(savedUser);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(savedUser.getId());

        return buildAuthResponse(savedUser, accessToken, refreshToken.getToken());
    }

    // CRITICAL: Ensure that the login process is wrapped in a transaction to maintain data integrity, especially when auto-provisioning Tutor profiles on login.
    @Transactional
    public AuthResponse login(LoginRequest request) {
        // 1. Check if user exists first to give granular feedback
        if (!userRepository.existsByEmail(request.getEmail())) {
            throw new com.tutor_management.backend.exception.EmailNotFoundException("Email không tồn tại trong hệ thống.");
        }

        // 2. Authenticate user
        var authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // 2. Get user
        User user = (User) authentication.getPrincipal();

        // Ensure profile exists on every login (idempotent) - ONLY for TUTORs
        if ("TUTOR".equals(user.getRole().getName())) {
            tutorService.ensureTutorProfile(user);
        }

        // 3. Generate tokens
        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return buildAuthResponse(user, accessToken, refreshToken.getToken());
    }

    // CRITICAL: Ensure that token refresh process is wrapped in a transaction to maintain data integrity when verifying and updating refresh tokens.
    @Transactional
    public AuthResponse refreshToken(String refreshTokenStr) {
        return refreshTokenService.findByToken(refreshTokenStr)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String accessToken = jwtService.generateToken(user);
                    return buildAuthResponse(user, accessToken, refreshTokenStr);
                })
                .orElseThrow(() -> new RuntimeException("Refresh token not found"));
    }

    // CRITICAL: Ensure that logout process is wrapped in a transaction to maintain data integrity when deleting refresh tokens.
    @Transactional
    public void logout(Long userId) {
        refreshTokenService.deleteByUserId(userId);
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getExpirationTime())
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .role(user.getRole().getName())
                        .avatarUrl(user.getAvatarUrl())
                        .studentId(user.getStudentId())
                        .build())
                .build();
    }
}

