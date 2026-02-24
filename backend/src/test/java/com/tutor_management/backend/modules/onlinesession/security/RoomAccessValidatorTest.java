package com.tutor_management.backend.modules.onlinesession.security;

import com.tutor_management.backend.modules.auth.RoleEntity;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.onlinesession.entity.OnlineSession;
import com.tutor_management.backend.modules.onlinesession.exception.RoomAccessDeniedException;
import com.tutor_management.backend.modules.onlinesession.exception.RoomNotFoundException;
import com.tutor_management.backend.modules.onlinesession.repository.OnlineSessionRepository;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RoomAccessValidator Unit Tests")
class RoomAccessValidatorTest {

    @Mock
    private OnlineSessionRepository onlineSessionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private TutorRepository tutorRepository;

    @InjectMocks
    private RoomAccessValidator roomAccessValidator;

    private String roomId = "test-room";
    private Long userId = 1L;
    private Long tutorId = 10L;
    private Long studentId = 20L;

    private OnlineSession session;
    private User adminUser;
    private User tutorUser;
    private User studentUser;
    private Tutor tutorProfile;

    @BeforeEach
    void setUp() {
        session = OnlineSession.builder()
                .roomId(roomId)
                .tutor(Tutor.builder().id(tutorId).build())
                .student(Student.builder().id(studentId).build())
                .build();

        RoleEntity adminRole = RoleEntity.builder().name("ADMIN").build();
        RoleEntity tutorRole = RoleEntity.builder().name("TUTOR").build();
        RoleEntity studentRole = RoleEntity.builder().name("STUDENT").build();

        adminUser = User.builder().id(userId).role(adminRole).build();
        tutorUser = User.builder().id(userId).role(tutorRole).build();
        studentUser = User.builder().id(userId).role(studentRole).studentId(studentId).build();

        tutorProfile = Tutor.builder().id(tutorId).user(tutorUser).build();
    }

    @Test
    @DisplayName("Should allow access for ADMIN role")
    void validateAccess_AdminSuccess() {
        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));

        assertDoesNotThrow(() -> roomAccessValidator.validateAccess(roomId, userId));
    }

    @Test
    @DisplayName("Should allow access for participating Tutor")
    void validateAccess_TutorSuccess() {
        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(tutorUser));
        when(tutorRepository.findByUserId(userId)).thenReturn(Optional.of(tutorProfile));

        assertDoesNotThrow(() -> roomAccessValidator.validateAccess(roomId, userId));
    }

    @Test
    @DisplayName("Should throw RoomAccessDeniedException for non-participating Tutor")
    void validateAccess_TutorDenied() {
        Tutor otherTutorProfile = Tutor.builder().id(99L).build();
        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(tutorUser));
        when(tutorRepository.findByUserId(userId)).thenReturn(Optional.of(otherTutorProfile));

        assertThrows(RoomAccessDeniedException.class, () -> roomAccessValidator.validateAccess(roomId, userId));
    }

    @Test
    @DisplayName("Should allow access for participating Student")
    void validateAccess_StudentSuccess() {
        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(studentUser));

        assertDoesNotThrow(() -> roomAccessValidator.validateAccess(roomId, userId));
    }

    @Test
    @DisplayName("Should throw RoomAccessDeniedException for non-participating Student")
    void validateAccess_StudentDenied() {
        RoleEntity studentRole = RoleEntity.builder().name("STUDENT").build();
        User otherStudentUser = User.builder().id(userId).role(studentRole).studentId(99L).build();
        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(otherStudentUser));

        assertThrows(RoomAccessDeniedException.class, () -> roomAccessValidator.validateAccess(roomId, userId));
    }

    @Test
    @DisplayName("Should throw RoomNotFoundException when room ID is invalid")
    void validateAccess_RoomNotFound() {
        when(onlineSessionRepository.findByRoomId("invalid")).thenReturn(Optional.empty());

        assertThrows(RoomNotFoundException.class, () -> roomAccessValidator.validateAccess("invalid", userId));
    }

    @Test
    @DisplayName("Should throw UsernameNotFoundException when user ID is invalid")
    void validateAccess_UserNotFound() {
        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> roomAccessValidator.validateAccess(roomId, userId));
    }

    @Test
    @DisplayName("Should throw RoomAccessDeniedException when session tutor is null")
    void validateAccess_TutorNull() {
        // Given
        session.setTutor(null); // ← Simulate data corruption
        
        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(tutorUser));
        when(tutorRepository.findByUserId(userId)).thenReturn(Optional.of(tutorProfile));
        
        // When/Then
        assertThrows(RoomAccessDeniedException.class, 
            () -> roomAccessValidator.validateAccess(roomId, userId));
    }

    @Test
    @DisplayName("Should throw RoomAccessDeniedException when session student is null")
    void validateAccess_StudentNull() {
        // Given
        session.setStudent(null); // ← Simulate data corruption
        
        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(studentUser));
        
        // When/Then
        assertThrows(RoomAccessDeniedException.class, 
            () -> roomAccessValidator.validateAccess(roomId, userId));
    }

    @Test
    @DisplayName("Access validation should complete in < 20ms")
    void validateAccess_PerformanceTest() {
        // Given
        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(adminUser));
    
        // When
        long startTime = System.nanoTime();
        roomAccessValidator.validateAccess(roomId, userId);
        long endTime = System.nanoTime();
    
        // Then
        long durationMs = (endTime - startTime) / 1_000_000;
        assertTrue(durationMs < 20, "Access validation took " + durationMs + "ms (expected < 20ms)");
    }
}
