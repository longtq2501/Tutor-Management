package com.tutor_management.backend.modules.finance.service;

import com.tutor_management.backend.modules.auth.RoleEntity;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SessionRecordServiceTest {

    @Mock
    private SessionRecordRepository sessionRecordRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TutorRepository tutorRepository;
    @Mock
    private SecurityContext securityContext;
    @Mock
    private Authentication authentication;

    @InjectMocks
    private SessionRecordService sessionRecordService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void deleteSessionsByMonth_Admin_ShouldDeleteAll() {
        // Arrange
        String month = "2024-01";
        String adminEmail = "admin@test.com";
        RoleEntity adminRole = RoleEntity.builder().name("ADMIN").build();
        User admin = User.builder().id(1L).email(adminEmail).role(adminRole).build();

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn(adminEmail);
        when(userRepository.findByEmail(adminEmail)).thenReturn(Optional.of(admin));

        // Act
        sessionRecordService.deleteSessionsByMonth(month);

        // Assert
        verify(sessionRecordRepository, times(1)).deleteByMonth(month);
        verify(sessionRecordRepository, never()).deleteByMonthAndTutorId(anyString(), anyLong());
    }

    @Test
    void deleteSessionsByMonth_Tutor_ShouldDeleteOnlyOwn() {
        // Arrange
        String month = "2024-01";
        String tutorEmail = "tutor@test.com";
        Long tutorId = 100L;
        RoleEntity tutorRole = RoleEntity.builder().name("TUTOR").build();
        User tutorUser = User.builder().id(2L).email(tutorEmail).role(tutorRole).build();
        Tutor tutorProfile = Tutor.builder().id(tutorId).user(tutorUser).build();

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn(tutorEmail);
        when(userRepository.findByEmail(tutorEmail)).thenReturn(Optional.of(tutorUser));
        when(tutorRepository.findByUserId(2L)).thenReturn(Optional.of(tutorProfile));

        // Act
        sessionRecordService.deleteSessionsByMonth(month);

        // Assert
        verify(sessionRecordRepository, times(1)).deleteByMonthAndTutorId(month, tutorId);
        verify(sessionRecordRepository, never()).deleteByMonth(anyString());
    }

    @Test
    void getAllUnpaidSessions_TaughtOnly_UsesStatusFilteredQuery() {
        // Arrange
        String tutorEmail = "tutor2@test.com";
        Long tutorId = 500L;
        RoleEntity tutorRole = RoleEntity.builder().name("TUTOR").build();
        User tutorUser = User.builder().id(3L).email(tutorEmail).role(tutorRole).build();
        Tutor tutorProfile = Tutor.builder().id(tutorId).user(tutorUser).build();

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn(tutorEmail);
        when(userRepository.findByEmail(tutorEmail)).thenReturn(Optional.of(tutorUser));
        when(tutorRepository.findByUserId(3L)).thenReturn(Optional.of(tutorProfile));

        when(sessionRecordRepository.findByPaidFalseAndTutorIdAndStatusInOrderBySessionDateDesc(eq(tutorId), any(Pageable.class)))
            .thenReturn(Page.empty());

        // Act
        sessionRecordService.getAllUnpaidSessions(Pageable.unpaged(), true);

        // Assert
        verify(sessionRecordRepository).findByPaidFalseAndTutorIdAndStatusInOrderBySessionDateDesc(eq(tutorId), any(Pageable.class));
        verify(sessionRecordRepository, never()).findByPaidFalseAndTutorIdOrderBySessionDateDesc(anyLong(), any(Pageable.class));
    }

    @Test
    void getAllUnpaidSessions_Default_NoStatusFilter() {
        // Arrange
        String tutorEmail = "tutor3@test.com";
        Long tutorId = 600L;
        RoleEntity tutorRole = RoleEntity.builder().name("TUTOR").build();
        User tutorUser = User.builder().id(4L).email(tutorEmail).role(tutorRole).build();
        Tutor tutorProfile = Tutor.builder().id(tutorId).user(tutorUser).build();

        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getName()).thenReturn(tutorEmail);
        when(userRepository.findByEmail(tutorEmail)).thenReturn(Optional.of(tutorUser));
        when(tutorRepository.findByUserId(4L)).thenReturn(Optional.of(tutorProfile));

        when(sessionRecordRepository.findByPaidFalseAndTutorIdOrderBySessionDateDesc(eq(tutorId), any(Pageable.class)))
            .thenReturn(Page.empty());

        // Act
        sessionRecordService.getAllUnpaidSessions(Pageable.unpaged(), false);

        // Assert
        verify(sessionRecordRepository).findByPaidFalseAndTutorIdOrderBySessionDateDesc(eq(tutorId), any(Pageable.class));
        verify(sessionRecordRepository, never()).findByPaidFalseAndTutorIdAndStatusInOrderBySessionDateDesc(anyLong(), any(Pageable.class));
    }
}
