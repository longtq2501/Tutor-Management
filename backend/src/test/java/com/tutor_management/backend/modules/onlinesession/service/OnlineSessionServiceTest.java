package com.tutor_management.backend.modules.onlinesession.service;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.notification.event.OnlineSessionCreatedEvent;
import com.tutor_management.backend.modules.notification.event.OnlineSessionEndedEvent;
import com.tutor_management.backend.modules.notification.event.SessionConvertedToOnlineEvent;
import com.tutor_management.backend.modules.finance.entity.SessionRecord;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.finance.LessonStatus;
import com.tutor_management.backend.modules.onlinesession.exception.*;
import com.tutor_management.backend.modules.onlinesession.dto.request.CreateOnlineSessionRequest;
import com.tutor_management.backend.modules.onlinesession.dto.response.JoinRoomResponse;
import com.tutor_management.backend.modules.onlinesession.dto.response.OnlineSessionResponse;
import com.tutor_management.backend.modules.onlinesession.dto.response.RoomStatsResponse;
import com.tutor_management.backend.modules.onlinesession.entity.OnlineSession;
import com.tutor_management.backend.modules.onlinesession.enums.RoomStatus;
import com.tutor_management.backend.modules.onlinesession.dto.response.SessionStatusResponse;
import com.tutor_management.backend.modules.onlinesession.exception.SessionCannotBeConvertedException;
import com.tutor_management.backend.modules.onlinesession.repository.OnlineSessionRepository;
import com.tutor_management.backend.modules.onlinesession.security.RoomTokenService;
import com.tutor_management.backend.modules.auth.RoleEntity;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Counter;
import org.springframework.test.util.ReflectionTestUtils;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.data.domain.Window;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.KeysetScrollPosition;
import org.springframework.data.domain.Limit;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("OnlineSessionService Unit Tests")
class OnlineSessionServiceTest {

    @Mock
    private OnlineSessionRepository onlineSessionRepository;

    @Mock
    private SessionRecordRepository sessionRecordRepository;

    @Mock
    private TutorRepository tutorRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private OnlineSessionServiceImpl onlineSessionService;

    @Mock
    private Clock clock;

    @Mock
    private RoomTokenService roomTokenService;

    @Mock
    private PresenceService presenceService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private MeterRegistry meterRegistry;

    @Mock
    private ObjectMapper objectMapper;

    private final Long userId = 1L;
    private final Long tutorId = 10L;
    private final Long studentId = 20L;
    private CreateOnlineSessionRequest request;
    private User user;
    private Tutor tutor;
    private Student student;
    private RoleEntity tutorRole;
    private RoleEntity studentRole;

    @BeforeEach
    void setUp() {
        request = CreateOnlineSessionRequest.builder()
                .studentId(studentId)
                .scheduledStart(LocalDateTime.now().plusHours(1))
                .scheduledEnd(LocalDateTime.now().plusHours(2))
                .build();

        tutorRole = RoleEntity.builder().name("TUTOR").build();
        studentRole = RoleEntity.builder().name("STUDENT").build();

        user = User.builder().id(userId).fullName("Tutor User").role(tutorRole).build();
        tutor = Tutor.builder().id(tutorId).fullName("Tutor Name").user(user).build();
        student = Student.builder().id(studentId).name("Student Name").build();

        // Inject default timeout for tests
        ReflectionTestUtils.setField(onlineSessionService, "autoEndTimeoutMinutes", 2);
        ReflectionTestUtils.setField(onlineSessionService, "earlyJoinMinutes", 15);
        ReflectionTestUtils.setField(onlineSessionService, "clock", clock);

        // ✅ Mock metrics leniently to avoid NPE in tests
        Counter mockCounter = mock(Counter.class);
        lenient().when(meterRegistry.counter(anyString(), any(String[].class))).thenReturn(mockCounter);
        lenient().when(meterRegistry.counter(anyString(), anyString(), anyString())).thenReturn(mockCounter);
        lenient().when(meterRegistry.counter(anyString(), anyString(), anyString(), anyString(), anyString())).thenReturn(mockCounter);
        
        // ✅ Mock clock to provide a default zone and instant
        LocalDateTime now = LocalDateTime.now();
        lenient().when(clock.instant()).thenReturn(now.atZone(ZoneId.systemDefault()).toInstant());
        lenient().when(clock.getZone()).thenReturn(ZoneId.systemDefault());

        // ✅ Mock common lookups leniently
        lenient().when(userRepository.findByStudentId(anyLong())).thenReturn(Optional.of(user));
        lenient().when(userRepository.findByStudentIdIn(anyList())).thenReturn(List.of(user));
    }

    @Test
    @DisplayName("Should create session and publish complete event")
    void createSession_Success() {
        // Given
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(tutorRepository.findByUserId(userId)).thenReturn(Optional.of(tutor));
        when(tutorRepository.findById(tutorId)).thenReturn(Optional.of(tutor));
        when(studentRepository.findById(studentId)).thenReturn(Optional.of(student));
        
        when(onlineSessionRepository.save(any(OnlineSession.class))).thenAnswer(i -> {
            OnlineSession s = i.getArgument(0);
            s.setId(100L);
            return s;
        });

        // When
        OnlineSessionResponse response = onlineSessionService.createSession(request, userId);

        // Then
        assertNotNull(response);
        assertEquals(studentId, response.getStudentId());
        
        // ✅ ADD COMPREHENSIVE EVENT VALIDATION
        ArgumentCaptor<OnlineSessionCreatedEvent> eventCaptor = ArgumentCaptor.forClass(OnlineSessionCreatedEvent.class);
        verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());
        
        OnlineSessionCreatedEvent event = eventCaptor.getValue();
        
        // Verify all event fields
        assertEquals(100L, event.getSessionId());
        assertNotNull(event.getRoomId()); // ✅ Room ID generated
        assertFalse(event.getRoomId().isEmpty()); // ✅ Not empty
        
        assertEquals(user.getId(), event.getTutorId());
        assertEquals("Tutor Name", event.getTutorName());
        
        assertEquals(studentId, event.getStudentId());
        assertEquals("Student Name", event.getStudentName());
        
        assertEquals(request.getScheduledStart(), event.getScheduledStart());
        
        // ✅ Verify response completeness
        assertEquals("WAITING", response.getRoomStatus());
        assertEquals(tutorId, response.getTutorId());
        assertEquals("Tutor Name", response.getTutorName());
        assertEquals(studentId, response.getStudentId());
        assertEquals("Student Name", response.getStudentName());
    }

    @Test
    @DisplayName("Should end session and calculate billable duration")
    void endSession_Success() {
        // Given
        String roomId = "room-xyz";
        
        // Fixed times
        LocalDateTime tutorJoined = LocalDateTime.of(2024, 1, 15, 14, 0);
        LocalDateTime studentJoined = LocalDateTime.of(2024, 1, 15, 14, 5);
        LocalDateTime sessionEnd = LocalDateTime.of(2024, 1, 15, 14, 45);
        
        // ✅ Mock Clock to return sessionEnd time
        Clock fixedClock = Clock.fixed(
            sessionEnd.atZone(ZoneId.systemDefault()).toInstant(),
            ZoneId.systemDefault()
        );
        when(clock.instant()).thenReturn(fixedClock.instant());
        when(clock.getZone()).thenReturn(fixedClock.getZone());
        
        OnlineSession session = OnlineSession.builder()
                .id(100L)
                .roomId(roomId)
                .roomStatus(RoomStatus.ACTIVE)
                .tutor(tutor)
                .student(student)
                .tutorJoinedAt(tutorJoined)
                .studentJoinedAt(studentJoined)
                .build();

        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        
        // Mock User lookup
        User studentUser = User.builder().id(123L).studentId(studentId).build();
        when(userRepository.findByStudentId(studentId))
                .thenReturn(Optional.of(studentUser));
        
        when(onlineSessionRepository.save(any(OnlineSession.class)))
                .thenAnswer(i -> i.getArgument(0));

        // When
        OnlineSessionResponse response = onlineSessionService.endSession(roomId, userId);

        // Then
        assertEquals("ENDED", response.getRoomStatus());
        
        // ✅ Now duration will be correct: 14:05 to 14:45 = 40 minutes
        assertEquals(40, session.getTotalDurationMinutes());
        
        verify(eventPublisher, times(1)).publishEvent(any(OnlineSessionEndedEvent.class));
    }

    @Test
    @DisplayName("Should join room and return token with TURN servers from config")
    void joinRoom_Success() {
        // Given
        String roomId = "room-join-123";
        LocalDateTime now = LocalDateTime.of(2024, 1, 15, 10, 0);
        when(clock.instant()).thenReturn(now.atZone(ZoneId.systemDefault()).toInstant());
        when(clock.getZone()).thenReturn(ZoneId.systemDefault());

        OnlineSession session = OnlineSession.builder()
                .roomId(roomId)
                .roomStatus(RoomStatus.WAITING) // Start as waiting
                .scheduledStart(now.plusHours(1))
                .tutor(tutor)
                .student(student)
                .build();

        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        
        user.setRole(tutorRole);
        String mockToken = "mock-jwt-token";
        when(roomTokenService.generateToken(roomId, userId, "TUTOR")).thenReturn(mockToken);
        when(onlineSessionRepository.save(any(OnlineSession.class))).thenAnswer(i -> i.getArgument(0));

        // When
        JoinRoomResponse response = onlineSessionService.joinRoom(roomId, userId);

        // Then
        assertNotNull(response);
        assertEquals(mockToken, response.getToken());
        
        // Verify Join Tracking
        assertEquals(now, session.getTutorJoinedAt());
        assertEquals(RoomStatus.ACTIVE, session.getRoomStatus());
        assertEquals(now, session.getActualStart());
        
        verify(onlineSessionRepository).save(session);
        verify(roomTokenService).generateToken(roomId, userId, tutorRole.getName());
    }

    @Test
    @DisplayName("Should throw exception when joining an ended room")
    void joinRoom_EndedRoom_ThrowsException() {
        // Given
        String roomId = "room-ended";
        OnlineSession session = OnlineSession.builder()
                .roomStatus(RoomStatus.ENDED)
                .build();
        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));

        // When & Then
        assertThrows(RoomAlreadyEndedException.class, () -> onlineSessionService.joinRoom(roomId, userId));
    }

    @Test
    @DisplayName("Should retrieve room stats correctly using RoomStatsResponse")
    void getRoomStats_Success() {
        // Given
        String roomId = "room-stats-123";
        OnlineSession session = OnlineSession.builder()
                .roomId(roomId)
                .roomStatus(RoomStatus.ACTIVE)
                .recordingEnabled(true)
                .totalDurationMinutes(15)
                .totalDurationSeconds(15 * 60)
                .tutor(tutor)
                .student(student)
                .tutorJoinedAt(LocalDateTime.now())
                .build();

        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));

        // When
        RoomStatsResponse stats = onlineSessionService.getRoomStats(roomId, userId);

        // Then
        assertNotNull(stats);
        assertEquals(roomId, stats.getRoomId());
        assertEquals("ACTIVE", stats.getRoomStatus());
        assertTrue(stats.getRecordingEnabled());
        assertEquals(15, stats.getDurationMinutes());
        assertEquals(1, stats.getParticipantCount()); // Tutor is present
    }

    @Test
    @DisplayName("Should calculate complex overlap correctly")
    void endSession_ComplexOverlap() {
        String roomId = "complex-overlap";
        LocalDateTime tutorJoined = LocalDateTime.of(2024, 1, 15, 14, 0);
        LocalDateTime studentJoined = LocalDateTime.of(2024, 1, 15, 14, 10);
        LocalDateTime tutorLeft = LocalDateTime.of(2024, 1, 15, 14, 40);
        LocalDateTime studentLeft = LocalDateTime.of(2024, 1, 15, 14, 50);
        LocalDateTime now = LocalDateTime.of(2024, 1, 15, 15, 0);

        Clock fixedClock = Clock.fixed(now.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        when(clock.instant()).thenReturn(fixedClock.instant());
        when(clock.getZone()).thenReturn(fixedClock.getZone());

        OnlineSession session = OnlineSession.builder()
                .roomId(roomId).roomStatus(RoomStatus.ACTIVE)
                .tutor(tutor).student(student)
                .tutorJoinedAt(tutorJoined).studentJoinedAt(studentJoined)
                .tutorLeftAt(tutorLeft).studentLeftAt(null) // Student still in room
                .build();

        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        when(userRepository.findByStudentId(any())).thenReturn(Optional.of(User.builder().id(123L).build()));
        when(onlineSessionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        onlineSessionService.endSession(roomId, userId);

        // Overlap: 14:10 (student joined) to 14:40 (tutor left) = 30 minutes
        assertEquals(30, session.getTotalDurationMinutes());
        assertEquals(now, session.getStudentLeftAt()); // Defaulted to now
    }

    @Test
    @DisplayName("Should auto-end session when both participants are inactive")
    void detectInactiveParticipants_AutoEnd() {
        String roomId = "auto-end-room";
        LocalDateTime now = LocalDateTime.of(2024, 1, 15, 15, 0);
        LocalDateTime leftTime = now.minusMinutes(3); // 3 mins ago

        Clock fixedClock = Clock.fixed(now.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        when(clock.instant()).thenReturn(fixedClock.instant());
        when(clock.getZone()).thenReturn(fixedClock.getZone());

        OnlineSession session = OnlineSession.builder()
                .roomId(roomId).roomStatus(RoomStatus.ACTIVE)
                .tutor(tutor).student(student)
                .tutorJoinedAt(now.minusHours(1))
                .studentJoinedAt(now.minusHours(1))
                .tutorLeftAt(leftTime)
                .studentLeftAt(leftTime)
                .build();

        lenient().when(onlineSessionRepository.findByRoomStatus(RoomStatus.ACTIVE)).thenReturn(List.of(session));
        lenient().when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        
        // Presence mocks
        when(presenceService.isUserActive(eq(roomId), anyLong(), anyInt())).thenReturn(false);
        // ✅ Match N+1 optimized lookup
        User studentUser = User.builder().id(123L).studentId(studentId).build();
        lenient().when(userRepository.findByStudentIdIn(anyList())).thenReturn(List.of(studentUser));
        lenient().when(userRepository.findByStudentId(anyLong())).thenReturn(Optional.of(studentUser));
        lenient().when(onlineSessionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        onlineSessionService.detectInactiveParticipants();

        assertEquals(RoomStatus.ENDED, session.getRoomStatus());
        verify(onlineSessionRepository, atLeastOnce()).save(session);
    }

    @Test
    @DisplayName("Should set zero duration when there is NO overlap")
    void endSession_NoOverlap() {
        String roomId = "no-overlap";
        // Tutor: 10:00-10:15
        // Student: 10:30-10:45
        LocalDateTime tutorJoined = LocalDateTime.of(2024, 1, 15, 10, 0);
        LocalDateTime tutorLeft = LocalDateTime.of(2024, 1, 15, 10, 15);
        LocalDateTime studentJoined = LocalDateTime.of(2024, 1, 15, 10, 30);
        LocalDateTime studentLeft = LocalDateTime.of(2024, 1, 15, 10, 45);

        OnlineSession session = OnlineSession.builder()
                .roomId(roomId).roomStatus(RoomStatus.ACTIVE)
                .tutor(tutor).student(student)
                .tutorJoinedAt(tutorJoined).studentJoinedAt(studentJoined)
                .tutorLeftAt(tutorLeft).studentLeftAt(studentLeft)
                .build();

        LocalDateTime now = LocalDateTime.of(2024, 1, 15, 11, 0);
        Clock fixedClock = Clock.fixed(now.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        when(clock.instant()).thenReturn(fixedClock.instant());
        when(clock.getZone()).thenReturn(fixedClock.getZone());

        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(session));
        when(userRepository.findByStudentId(any())).thenReturn(Optional.of(User.builder().id(123L).build()));
        when(onlineSessionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        onlineSessionService.endSession(roomId, userId);

        assertEquals(0, session.getTotalDurationMinutes());
    }

    @Test
    @DisplayName("Should NOT end room if ONE participant is still active")
    void detectInactiveParticipants_OneParticipantStillActive() {
        String roomId = "partial-active-room";
        LocalDateTime now = LocalDateTime.of(2024, 1, 15, 15, 0);
        
        Clock fixedClock = Clock.fixed(now.atZone(ZoneId.systemDefault()).toInstant(), ZoneId.systemDefault());
        when(clock.instant()).thenReturn(fixedClock.instant());
        when(clock.getZone()).thenReturn(fixedClock.getZone());
        
        OnlineSession session = OnlineSession.builder()
                .roomId(roomId).roomStatus(RoomStatus.ACTIVE)
                .tutor(tutor).student(student)
                .tutorJoinedAt(now.minusHours(1))
                .studentJoinedAt(now.minusHours(1))
                .tutorLeftAt(now.minusMinutes(5)) // Left 5m ago
                .studentLeftAt(null) // Still in room
                .build();

        when(onlineSessionRepository.findByRoomStatus(RoomStatus.ACTIVE)).thenReturn(List.of(session));
        
        // Presence mocks: Tutor inactive, Student active
        when(presenceService.isUserActive(eq(roomId), eq(userId), anyInt())).thenReturn(false);
        // Student user ID lookup
        User studentUser = User.builder().id(123L).studentId(studentId).build();
        lenient().when(userRepository.findByStudentIdIn(anyList())).thenReturn(List.of(studentUser));
        lenient().when(presenceService.isUserActive(eq(roomId), eq(123L), anyInt())).thenReturn(true);

        onlineSessionService.detectInactiveParticipants();

        // Room should STILL be ACTIVE
        assertEquals(RoomStatus.ACTIVE, session.getRoomStatus());
    }

    @Test
    @DisplayName("Should clear leftAt and warning when heartbeat received after disconnect")
    void updateHeartbeat_ClearLeftTime_AfterReconnect() {
        // Given
        String roomId = "reconnect-room";
        LocalDateTime now = LocalDateTime.of(2024, 1, 15, 15, 0);
        LocalDateTime leftTime = now.minusMinutes(1);
        
        OnlineSession session = OnlineSession.builder()
                .roomId(roomId)
                .roomStatus(RoomStatus.ACTIVE)
                .tutor(tutor)
                .student(student)
                .tutorJoinedAt(now.minusHours(1))
                .tutorLeftAt(leftTime) // ✅ Marked as left
                .inactivityWarningSentAt(leftTime) // ✅ Warning sent
                .build();

        when(onlineSessionRepository.findByRoomIdForUpdate(roomId))
                .thenReturn(Optional.of(session));
        when(onlineSessionRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        // When
        onlineSessionService.updateHeartbeat(roomId, userId);

        // Then
        assertNull(session.getTutorLeftAt()); // ✅ Cleared
        assertNull(session.getInactivityWarningSentAt()); // ✅ Cleared
        
        ArgumentCaptor<SessionStatusResponse> captor = ArgumentCaptor.forClass(SessionStatusResponse.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/room/" + roomId + "/status"), captor.capture());
        
        SessionStatusResponse broadcast = captor.getValue();
        assertEquals(SessionStatusResponse.Type.PARTICIPANT_JOINED, broadcast.getType());
    }

    @Test
    @DisplayName("Should NOT auto-end room if admin override is enabled")
    void detectInactiveParticipants_PreventAutoEnd_WhenAdminOverride() {
        String roomId = "admin-override-room";
        LocalDateTime now = LocalDateTime.of(2024, 1, 15, 15, 0);
        
        OnlineSession session = OnlineSession.builder()
                .roomId(roomId).roomStatus(RoomStatus.ACTIVE)
                .tutor(tutor).student(student)
                .tutorJoinedAt(now.minusHours(1))
                .studentJoinedAt(now.minusHours(1))
                .tutorLeftAt(now.minusMinutes(10))
                .studentLeftAt(now.minusMinutes(10))
                .preventAutoEnd(true) // ✅ ADMIN OVERRIDE
                .build();

        onlineSessionService.processSessionInactivity(session, now, null);

        // Room should STILL be ACTIVE despite being long inactive
        assertEquals(RoomStatus.ACTIVE, session.getRoomStatus());
        verify(onlineSessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should convert session record to online successfully")
    void convertToOnline_Success() {
        // Given
        Long sessionRecordId = 500L;

        // ✅ ADD CLOCK MOCK FIRST
        LocalDateTime now = LocalDateTime.of(2024, 1, 15, 9, 0); // 9 AM
        when(clock.instant()).thenReturn(now.atZone(ZoneId.systemDefault()).toInstant());
        when(clock.getZone()).thenReturn(ZoneId.systemDefault());

        // Session scheduled at 10 AM (1 hour in future)
        java.time.LocalDate futureDate = java.time.LocalDate.of(2024, 1, 15);
        java.time.LocalTime start = java.time.LocalTime.of(10, 0);
        java.time.LocalTime end = java.time.LocalTime.of(12, 0);

        SessionRecord sessionRecord = SessionRecord.builder()
                .id(sessionRecordId)
                .tutorId(tutorId)
                .student(student)
                .sessionDate(futureDate)
                .startTime(start)
                .endTime(end)
                .status(LessonStatus.SCHEDULED)
                .subject("Math")
                .build();

        when(sessionRecordRepository.findByIdForUpdate(sessionRecordId))
                .thenReturn(Optional.of(sessionRecord));
        when(tutorRepository.findByUserId(userId)).thenReturn(Optional.of(tutor));
        when(onlineSessionRepository.existsBySessionRecordId(sessionRecordId)).thenReturn(false);
        when(onlineSessionRepository.save(any(OnlineSession.class))).thenAnswer(i -> {
            OnlineSession s = i.getArgument(0);
            s.setId(1001L);
            return s;
        });

        // When
        OnlineSessionResponse response = onlineSessionService.convertToOnline(sessionRecordId, userId);

        // Then
        assertNotNull(response);
        assertEquals(tutorId, response.getTutorId());
        assertEquals(studentId, response.getStudentId());
        assertEquals(LocalDateTime.of(futureDate, start), response.getScheduledStart());
        assertEquals(LocalDateTime.of(futureDate, end), response.getScheduledEnd());

        verify(eventPublisher).publishEvent(any(SessionConvertedToOnlineEvent.class));
    }

    @Test
    @DisplayName("Should throw exception when session record already online")
    void convertToOnline_AlreadyOnline_ThrowsException() {
        // Given
        Long sessionRecordId = 500L;
        SessionRecord sessionRecord = SessionRecord.builder()
                .id(sessionRecordId)
                .tutorId(tutorId)
                .student(student)
                .status(LessonStatus.SCHEDULED)
                .build();

        // ✅ FIX: Use findByIdForUpdate
        when(sessionRecordRepository.findByIdForUpdate(sessionRecordId))
                .thenReturn(Optional.of(sessionRecord));
        when(tutorRepository.findByUserId(userId)).thenReturn(Optional.of(tutor));
        when(onlineSessionRepository.existsBySessionRecordId(sessionRecordId)).thenReturn(true);

        // When & Then
        assertThrows(SessionAlreadyOnlineException.class,
                () -> onlineSessionService.convertToOnline(sessionRecordId, userId));
    }

    @Test
    @DisplayName("Should throw exception when session status cannot be converted")
    void convertToOnline_InvalidStatus_ThrowsException() {
        // Given
        Long sessionRecordId = 500L;
        SessionRecord sessionRecord = SessionRecord.builder()
                .id(sessionRecordId)
                .tutorId(tutorId)
                .student(student)
                .status(LessonStatus.COMPLETED)
                .build();

        when(sessionRecordRepository.findByIdForUpdate(sessionRecordId))
                .thenReturn(Optional.of(sessionRecord));
        when(tutorRepository.findByUserId(userId)).thenReturn(Optional.of(tutor));
        when(onlineSessionRepository.existsBySessionRecordId(sessionRecordId)).thenReturn(false);

        // When & Then
        assertThrows(SessionCannotBeConvertedException.class,
                () -> onlineSessionService.convertToOnline(sessionRecordId, userId));
    }

    @Test
    @DisplayName("Should throw exception when unauthorized tutor tries to convert")
    void convertToOnline_Unauthorized_ThrowsException() {
        // Given
        Long sessionRecordId = 500L;
        SessionRecord sessionRecord = SessionRecord.builder()
                .id(sessionRecordId)
                .tutorId(999L) // Different tutor ID
                .student(student)  // ✅ ADD THIS
                .status(LessonStatus.SCHEDULED)  // ✅ ADD THIS
                .build();

        // ✅ FIX: Use findByIdForUpdate
        when(sessionRecordRepository.findByIdForUpdate(sessionRecordId))
                .thenReturn(Optional.of(sessionRecord));
        when(tutorRepository.findByUserId(userId)).thenReturn(Optional.of(tutor));

        // When & Then
        // ✅ FIX: Assert specific exception type
        UnauthorizedSessionConversionException exception = assertThrows(
                UnauthorizedSessionConversionException.class,
                () -> onlineSessionService.convertToOnline(sessionRecordId, userId)
        );

        // ✅ Verify exception message
        assertTrue(exception.getMessage().contains("không có quyền"));
        assertTrue(exception.getMessage().contains(String.valueOf(tutor.getId())));
        assertTrue(exception.getMessage().contains(String.valueOf(sessionRecordId)));
    }

    @Test
    @DisplayName("Should throw exception when session record not found")
    void convertToOnline_NotFound_ThrowsException() {
        Long sessionRecordId = 999L;
        when(sessionRecordRepository.findByIdForUpdate(sessionRecordId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, 
                () -> onlineSessionService.convertToOnline(sessionRecordId, userId));
    }

    @Test
    @DisplayName("Should throw exception when session is in the past")
    void convertToOnline_PastTime_ThrowsException() {
        Long sessionRecordId = 500L;

        // ✅ Current time: 12:00 PM
        LocalDateTime now = LocalDateTime.of(2024, 1, 15, 12, 0);
        when(clock.instant()).thenReturn(now.atZone(ZoneId.systemDefault()).toInstant());
        when(clock.getZone()).thenReturn(ZoneId.systemDefault());

        // ✅ Session scheduled at 10:00 AM (2 hours in past)
        SessionRecord sessionRecord = SessionRecord.builder()
                .id(sessionRecordId)
                .tutorId(tutorId)
                .student(student)
                .sessionDate(java.time.LocalDate.of(2024, 1, 15))
                .startTime(java.time.LocalTime.of(10, 0))  // 10 AM < 12 PM (now)
                .endTime(java.time.LocalTime.of(11, 0))   // ✅ ADD END TIME
                .status(LessonStatus.SCHEDULED)
                .build();

        when(sessionRecordRepository.findByIdForUpdate(sessionRecordId))
                .thenReturn(Optional.of(sessionRecord));
        when(tutorRepository.findByUserId(userId)).thenReturn(Optional.of(tutor));
        when(onlineSessionRepository.existsBySessionRecordId(sessionRecordId)).thenReturn(false);

        assertThrows(SessionCannotBeConvertedException.class,
                () -> onlineSessionService.convertToOnline(sessionRecordId, userId));
    }

    @Test
    @DisplayName("Should handle race condition during session conversion")
    void convertToOnline_RaceCondition_ThrowsException() {
        Long sessionRecordId = 500L;

        // ✅ ADD CLOCK MOCK FIRST
        LocalDateTime now = LocalDateTime.of(2024, 1, 15, 9, 0); // 9 AM
        when(clock.instant()).thenReturn(now.atZone(ZoneId.systemDefault()).toInstant());
        when(clock.getZone()).thenReturn(ZoneId.systemDefault());

        // Session scheduled at 10 AM (1 hour in future)
        SessionRecord sessionRecord = SessionRecord.builder()
                .id(sessionRecordId)
                .tutorId(tutorId)
                .student(student)
                .sessionDate(java.time.LocalDate.of(2024, 1, 15))
                .startTime(java.time.LocalTime.of(10, 0))
                .endTime(java.time.LocalTime.of(12, 0))
                .status(LessonStatus.SCHEDULED)
                .build();

        when(sessionRecordRepository.findByIdForUpdate(sessionRecordId))
                .thenReturn(Optional.of(sessionRecord));
        when(tutorRepository.findByUserId(userId)).thenReturn(Optional.of(tutor));
        when(onlineSessionRepository.existsBySessionRecordId(sessionRecordId)).thenReturn(false);

        when(onlineSessionRepository.save(any(OnlineSession.class)))
                .thenThrow(new org.springframework.dao.DataIntegrityViolationException("Duplicate key"));

        assertThrows(SessionAlreadyOnlineException.class,
                () -> onlineSessionService.convertToOnline(sessionRecordId, userId));
    }

    @Test
    @DisplayName("Should return sessions for tutor")
    void getMySessions_Tutor_Success() {
        // Given
        Tutor tutor = Tutor.builder().id(tutorId).user(User.builder().id(userId).build()).fullName("Tutor Name").build();
        OnlineSession session = OnlineSession.builder()
                .id(1L)
                .roomId("room-1")
                .roomStatus(RoomStatus.WAITING)
                .scheduledStart(LocalDateTime.now(clock).plusHours(1))
                .tutor(tutor)
                .student(student)
                .build();
        KeysetScrollPosition scrollPosition = ScrollPosition.keyset();
        Limit limit = Limit.of(10);
        Window<OnlineSession> window = Window.from(List.of(session), pos -> scrollPosition);
        when(userRepository.findById(userId)).thenReturn(Optional.of(User.builder().id(userId).role(tutorRole).build()));
        when(tutorRepository.findByUserId(userId)).thenReturn(Optional.of(tutor));
        when(onlineSessionRepository.findAllByTutorIdAndRoomStatusNotOrderByScheduledStartAscIdAsc(eq(tutorId), eq(RoomStatus.ENDED), any(org.springframework.data.domain.KeysetScrollPosition.class), eq(limit)))
                .thenReturn(window);

        // When
        org.springframework.data.domain.Window<OnlineSessionResponse> results = onlineSessionService.getMySessions(userId, null, 10);

        // Then
        assertFalse(results.isEmpty());
        assertEquals("room-1", results.getContent().getFirst().getRoomId());
        assertFalse(results.getContent().getFirst().isCanJoinNow());
    }

    @Test
    @DisplayName("Should return sessions for student")
    void getMySessions_Student_Success() {
        // Given
        Long studentId = student.getId();
        OnlineSession session = OnlineSession.builder()
                .id(1L)
                .roomId("room-1")
                .roomStatus(RoomStatus.WAITING)
                .scheduledStart(LocalDateTime.now(clock).plusHours(1))
                .tutor(tutor)
                .student(student)
                .build();
        KeysetScrollPosition scrollPosition = ScrollPosition.keyset();
        Window<OnlineSession> window = Window.from(List.of(session), pos -> scrollPosition);

        when(userRepository.findById(userId)).thenReturn(Optional.of(User.builder().id(userId).role(studentRole).studentId(studentId).build()));
        when(onlineSessionRepository.findAllByStudentIdAndRoomStatusNotOrderByScheduledStartAscIdAsc(eq(studentId), eq(RoomStatus.ENDED), any(org.springframework.data.domain.KeysetScrollPosition.class), any(org.springframework.data.domain.Limit.class)))
                .thenReturn(window);

        // When
        org.springframework.data.domain.Window<OnlineSessionResponse> results = onlineSessionService.getMySessions(userId, null, 10);

        // Then
        assertFalse(results.isEmpty());
        assertEquals("room-1", results.getContent().get(0).getRoomId());
    }

    @Test
    @DisplayName("Should correctly calculate canJoinNow")
    void canJoinNow_Calculation_Scenarios() {
        // Current time: 10:00 AM
        LocalDateTime now = LocalDateTime.of(2024, 1, 15, 10, 0);
        when(clock.instant()).thenReturn(now.atZone(ZoneId.systemDefault()).toInstant());
        when(clock.getZone()).thenReturn(ZoneId.systemDefault());

        // 1. Scheduled at 10:16 AM (16m in future) -> False
        OnlineSession s1 = OnlineSession.builder()
                .roomStatus(RoomStatus.WAITING)
                .scheduledStart(now.plusMinutes(16))
                .tutor(tutor).student(student).build();
        
        // 2. Scheduled at 10:14 AM (14m in future) -> True
        OnlineSession s2 = OnlineSession.builder()
                .roomStatus(RoomStatus.WAITING)
                .scheduledStart(now.plusMinutes(14))
                .tutor(tutor).student(student).build();

        // 3. Already Active -> True
        OnlineSession s3 = OnlineSession.builder()
                .roomStatus(RoomStatus.ACTIVE)
                .scheduledStart(now.minusHours(1))
                .tutor(tutor).student(student).build();

        // 4. Ended -> False
        OnlineSession s4 = OnlineSession.builder()
                .roomStatus(RoomStatus.ENDED)
                .scheduledStart(now.minusHours(1))
                .tutor(tutor).student(student).build();

        // Need to use getMySessions or mock mapToResponse indirectly? 
        // OnlineSessionServiceImpl's mapToResponse is private. 
        // Let's test via getMySessions.

        KeysetScrollPosition scrollPosition = ScrollPosition.keyset();
        Window<OnlineSession> window = Window.from(List.of(s1, s2, s3, s4), pos -> scrollPosition);
        when(userRepository.findById(userId)).thenReturn(Optional.of(User.builder().id(userId).role(tutorRole).build()));
        when(tutorRepository.findByUserId(userId)).thenReturn(Optional.of(tutor));
        when(onlineSessionRepository.findAllByTutorIdAndRoomStatusNotOrderByScheduledStartAscIdAsc(any(), any(), any(org.springframework.data.domain.KeysetScrollPosition.class), any(org.springframework.data.domain.Limit.class)))
                .thenReturn(window);

        org.springframework.data.domain.Window<OnlineSessionResponse> results = onlineSessionService.getMySessions(userId, null, 10);

        // All non-ended sessions should return true for isCanJoinNow
        assertTrue(results.getContent().get(0).isCanJoinNow()); // s1: WAITING
        assertTrue(results.getContent().get(1).isCanJoinNow()); // s2: WAITING
        assertTrue(results.getContent().get(2).isCanJoinNow()); // s3: ACTIVE
        assertFalse(results.getContent().get(3).isCanJoinNow()); // s4: ENDED
    }
}
