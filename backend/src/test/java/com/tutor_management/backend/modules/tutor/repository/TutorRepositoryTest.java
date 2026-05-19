package com.tutor_management.backend.modules.tutor.repository;

import com.tutor_management.backend.exception.EmailNotFoundException;
import com.tutor_management.backend.exception.TutorNotFoundException;
import com.tutor_management.backend.modules.auth.RoleEntity;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.tutor.dto.TutorStatsDTO;
import com.tutor_management.backend.modules.tutor.dto.request.TutorRequest;
import com.tutor_management.backend.modules.tutor.dto.response.TutorResponse;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.service.TutorService;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TutorServiceTest {

    @Mock
    private TutorRepository tutorRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private SessionRecordRepository sessionRecordRepository;

    @InjectMocks
    private TutorService tutorService;

    private User testUser;
    private Tutor testTutor;
    private TutorRequest tutorRequest;

    @BeforeEach
    void setUp() {
        // Setup test user
        RoleEntity role = RoleEntity.builder().name("TUTOR").build();
        testUser = User.builder()
                .id(1L)
                .email("tutor@test.com")
                .password("password")
                .fullName("Test Tutor")
                .role(role)
                .enabled(true)
                .accountNonLocked(true)
                .build();

        // Setup test tutor
        testTutor = Tutor.builder()
                .id(1L)
                .user(testUser)
                .fullName("Test Tutor")
                .email("tutor@test.com")
                .phone("0901234567")
                .subscriptionPlan("PREMIUM")
                .subscriptionStatus("ACTIVE")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // Setup request DTO
        tutorRequest = TutorRequest.builder()
                .userId(1L)
                .fullName("Test Tutor")
                .email("tutor@test.com")
                .phone("0901234567")
                .subscriptionPlan("PREMIUM")
                .subscriptionStatus("ACTIVE")
                .build();
    }

    @Test
    void getAllTutors_WithNoFilters_ShouldReturnPagedTutors() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Tutor> tutorPage = new PageImpl<>(Collections.singletonList(testTutor));
        when(tutorRepository.findAll(pageable)).thenReturn(tutorPage);

        // When
        Page<TutorResponse> result = tutorService.getAllTutors(null, null, pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getEmail()).isEqualTo("tutor@test.com");
        verify(tutorRepository).findAll(pageable);
    }

    @Test
    void getAllTutors_WithSearchOnly_ShouldReturnFilteredTutors() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Tutor> tutorPage = new PageImpl<>(Collections.singletonList(testTutor));
        when(tutorRepository.searchByNameOrEmail("Test", pageable)).thenReturn(tutorPage);

        // When
        Page<TutorResponse> result = tutorService.getAllTutors("Test", null, pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        verify(tutorRepository).searchByNameOrEmail("Test", pageable);
    }

    @Test
    void getAllTutors_WithStatusOnly_ShouldReturnFilteredTutors() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Tutor> tutorPage = new PageImpl<>(Collections.singletonList(testTutor));
        when(tutorRepository.findBySubscriptionStatus("ACTIVE", pageable)).thenReturn(tutorPage);

        // When
        Page<TutorResponse> result = tutorService.getAllTutors(null, "ACTIVE", pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        verify(tutorRepository).findBySubscriptionStatus("ACTIVE", pageable);
    }

    @Test
    void getAllTutors_WithBothFilters_ShouldReturnFilteredTutors() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Tutor> tutorPage = new PageImpl<>(Collections.singletonList(testTutor));
        when(tutorRepository.searchByNameOrEmailAndStatus("Test", "ACTIVE", pageable))
                .thenReturn(tutorPage);

        // When
        Page<TutorResponse> result = tutorService.getAllTutors("Test", "ACTIVE", pageable);

        // Then
        assertThat(result.getContent()).hasSize(1);
        verify(tutorRepository).searchByNameOrEmailAndStatus("Test", "ACTIVE", pageable);
    }

    @Test
    void getTutorById_WhenExists_ShouldReturnTutor() {
        // Given
        when(tutorRepository.findById(1L)).thenReturn(Optional.of(testTutor));

        // When
        TutorResponse result = tutorService.getTutorById(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("tutor@test.com");
        verify(tutorRepository).findById(1L);
    }

    @Test
    void getTutorById_WhenNotExists_ShouldThrowException() {
        // Given
        when(tutorRepository.findById(99L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> tutorService.getTutorById(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Tutor not found");
        verify(tutorRepository).findById(99L);
    }

    @Test
    void createTutor_WhenValid_ShouldCreateTutor() {
        // Given
        when(tutorRepository.findByEmail(tutorRequest.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(tutorRepository.save(any(Tutor.class))).thenReturn(testTutor);

        // When
        TutorResponse result = tutorService.createTutor(tutorRequest);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getEmail()).isEqualTo("tutor@test.com");
        assertThat(result.getSubscriptionStatus()).isEqualTo("ACTIVE");
        verify(tutorRepository).findByEmail(tutorRequest.getEmail());
        verify(userRepository).findById(1L);
        verify(tutorRepository).save(any(Tutor.class));
    }

    @Test
    void createTutor_WhenEmailExists_ShouldThrowException() {
        // Given
        when(tutorRepository.findByEmail(tutorRequest.getEmail()))
                .thenReturn(Optional.of(testTutor));

        // When & Then
        assertThatThrownBy(() -> tutorService.createTutor(tutorRequest))
                .isInstanceOf(com.tutor_management.backend.exception.AlreadyExistsException.class)
                .hasMessageContaining("email already exists");
        verify(tutorRepository).findByEmail(tutorRequest.getEmail());
        verify(tutorRepository, never()).save(any());
    }

    @Test
    void createTutor_WhenUserNotFound_ShouldThrowException() {
        // Given
        when(tutorRepository.findByEmail(tutorRequest.getEmail())).thenReturn(Optional.empty());
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> tutorService.createTutor(tutorRequest))
                .isInstanceOf(TutorNotFoundException.class);
        verify(userRepository).findById(1L);
        verify(tutorRepository, never()).save(any());
    }

    @Test
    void updateTutor_WhenValid_ShouldUpdateTutor() {
        // Given
        TutorRequest updateRequest = TutorRequest.builder()
                .fullName("Updated Name")
                .email("tutor@test.com") // Same email
                .phone("0909999999")
                .subscriptionPlan("BASIC")
                .subscriptionStatus("ACTIVE")
                .build();

        when(tutorRepository.findById(1L)).thenReturn(Optional.of(testTutor));
        when(tutorRepository.save(any(Tutor.class))).thenReturn(testTutor);

        // When
        TutorResponse result = tutorService.updateTutor(1L, updateRequest);

        // Then
        assertThat(result).isNotNull();
        verify(tutorRepository).findById(1L);
        verify(tutorRepository).save(any(Tutor.class));
    }

    @Test
    void updateTutor_WhenChangingEmailToExisting_ShouldThrowException() {
        // Given
        TutorRequest updateRequest = TutorRequest.builder()
                .fullName("Updated Name")
                .email("another@test.com") // Different email
                .phone("0909999999")
                .subscriptionPlan("BASIC")
                .build();

        Tutor anotherTutor = Tutor.builder()
                .id(2L)
                .email("another@test.com")
                .build();

        when(tutorRepository.findById(1L)).thenReturn(Optional.of(testTutor));
        when(tutorRepository.findByEmail("another@test.com"))
                .thenReturn(Optional.of(anotherTutor));

        // When & Then
        assertThatThrownBy(() -> tutorService.updateTutor(1L, updateRequest))
                .isInstanceOf(EmailNotFoundException.class)
                .hasMessageContaining("Email already exists");
        verify(tutorRepository, never()).save(any());
    }

    @Test
    void updateTutor_WhenNotFound_ShouldThrowException() {
        // Given
        when(tutorRepository.findById(99L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> tutorService.updateTutor(99L, tutorRequest))
                .isInstanceOf(TutorNotFoundException.class);
        verify(tutorRepository, never()).save(any());
    }

    @Test
    void getTutorStats_WhenExists_ShouldReturnStats() {
        // Given
        when(tutorRepository.existsById(1L)).thenReturn(true);
        when(studentRepository.countByTutorIdAndActiveTrue(1L)).thenReturn(5L);
        
        String currentMonth = java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("MM/yyyy"));
        when(sessionRecordRepository.sumSessionsByMonthAndTutorId(eq(currentMonth), eq(1L)))
                .thenReturn(10);
        when(sessionRecordRepository.getFinanceSummaryByTutorId(eq(currentMonth), eq(1L)))
                .thenReturn(null); // Simple case for revenue

        // When
        TutorStatsDTO result = tutorService.getTutorStats(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStudentCount()).isEqualTo(5);
        assertThat(result.getSessionCount()).isEqualTo(10);
        assertThat(result.getTotalRevenue()).isEqualTo(0.0);
        
        verify(tutorRepository).existsById(1L);
        verify(studentRepository).countByTutorIdAndActiveTrue(1L);
        verify(sessionRecordRepository).sumSessionsByMonthAndTutorId(anyString(), eq(1L));
    }

    @Test
    void getTutorStats_WhenNotExists_ShouldThrowException() {
        // Given
        when(tutorRepository.existsById(99L)).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> tutorService.getTutorStats(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Tutor not found");
        verify(tutorRepository).existsById(99L);
    }

    @Test
    void deleteTutor_WhenExists_ShouldDelete() {
        // Given
        when(tutorRepository.existsById(1L)).thenReturn(true);
        doNothing().when(tutorRepository).deleteById(1L);

        // When
        tutorService.deleteTutor(1L);

        // Then
        verify(tutorRepository).existsById(1L);
        verify(tutorRepository).deleteById(1L);
    }

    @Test
    void deleteTutor_WhenNotExists_ShouldThrowException() {
        // Given
        when(tutorRepository.existsById(99L)).thenReturn(false);

        // When & Then
        assertThatThrownBy(() -> tutorService.deleteTutor(99L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Tutor not found");
        verify(tutorRepository).existsById(99L);
        verify(tutorRepository, never()).deleteById(anyLong());
    }

    @Test
    void mapToResponse_WhenUserIsNull_ShouldThrowException() {
        // Given
        Tutor tutorWithoutUser = Tutor.builder()
                .id(1L)
                .fullName("Test")
                .email("test@test.com")
                .user(null) // User is null
                .build();

        when(tutorRepository.findById(1L)).thenReturn(Optional.of(tutorWithoutUser));

        // When & Then
        assertThatThrownBy(() -> tutorService.getTutorById(1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Tutor.user not loaded");
    }
}