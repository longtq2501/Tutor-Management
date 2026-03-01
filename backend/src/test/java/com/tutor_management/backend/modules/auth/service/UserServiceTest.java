package com.tutor_management.backend.modules.auth.service;

import com.tutor_management.backend.modules.auth.RoleEntity;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.auth.dto.request.UpdateUserRequest;
import com.tutor_management.backend.modules.auth.dto.response.AuthResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    private User user;

    @BeforeEach
    void setUp() {
        RoleEntity role = RoleEntity.builder().name("STUDENT").build();
        user = User.builder()
                .id(1L)
                .email("test@example.com")
                .fullName("Test User")
                .role(role)
                .avatarUrl("http://avatar.url")
                .build();
    }

    @Test
    void getUserProfile_ShouldReturnUserInfo() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // When
        AuthResponse.UserInfo result = userService.getUserProfile(1L);

        // Then
        assertEquals(user.getId(), result.getId());
        assertEquals(user.getEmail(), result.getEmail());
        assertEquals(user.getFullName(), result.getFullName());
        assertEquals(user.getRole().getName(), result.getRole());
        assertEquals(user.getAvatarUrl(), result.getAvatarUrl());
    }

    @Test
    void getUserProfile_UserNotFound_ShouldThrowException() {
        // Given
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThrows(RuntimeException.class, () -> userService.getUserProfile(1L));
    }

    @Test
    void updateUserProfile_ShouldUpdateAndReturnUserInfo() {
        // Given
        UpdateUserRequest request = UpdateUserRequest.builder()
                .fullName("Updated Name")
                .bankName("Vietcombank")
                .accountNumber("123456789")
                .accountName("TEST USER")
                .build();
        
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        // When
        AuthResponse.UserInfo result = userService.updateUserProfile(1L, request);

        // Then
        verify(userRepository).save(argThat(u -> 
            u.getFullName().equals("Updated Name") &&
            u.getBankName().equals("Vietcombank") &&
            u.getAccountNumber().equals("123456789") &&
            u.getAccountName().equals("TEST USER")
        ));
        assertEquals("Updated Name", result.getFullName());
        assertEquals("Vietcombank", result.getBankName());
    }
}
