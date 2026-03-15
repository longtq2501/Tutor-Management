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
import com.tutor_management.backend.modules.onlinesession.dto.request.UpdateRecordingMetadataRequest;
import com.tutor_management.backend.modules.onlinesession.dto.response.JoinRoomResponse;
import com.tutor_management.backend.modules.onlinesession.dto.response.OnlineSessionResponse;
import com.tutor_management.backend.modules.onlinesession.dto.response.RoomStatsResponse;
import com.tutor_management.backend.modules.onlinesession.dto.response.GlobalStatsResponse;
import com.tutor_management.backend.modules.onlinesession.entity.OnlineSession;
import com.tutor_management.backend.modules.onlinesession.enums.RoomStatus;
import com.tutor_management.backend.modules.onlinesession.dto.response.SessionStatusResponse;
import com.tutor_management.backend.modules.onlinesession.dto.response.UserJoinedMessage;
import com.tutor_management.backend.modules.onlinesession.dto.response.UserLeftMessage;
import com.tutor_management.backend.modules.onlinesession.repository.OnlineSessionRepository;
import com.tutor_management.backend.modules.onlinesession.security.RoomTokenService;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Limit;
import org.springframework.data.domain.Window;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.KeysetScrollPosition;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.Base64;
import java.util.Optional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OnlineSessionServiceImpl implements OnlineSessionService {

    private final OnlineSessionRepository onlineSessionRepository;
    private final SessionRecordRepository sessionRecordRepository;
    private final TutorRepository tutorRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;
    private final RoomTokenService roomTokenService;
    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;
    private final MeterRegistry meterRegistry;
    private final ObjectMapper objectMapper;

    // Simplified TURN servers to avoid @Value list binding issues in YAML
    private final List<Map<String, Object>> turnServers = List.of(
            Map.of("urls", "stun:stun.l.google.com:19302"),
            Map.of("urls", "stun:stun1.l.google.com:19302"),
            Map.of("urls", "stun:stun2.l.google.com:19302")
    );

    @Value("${app.online-session.auto-end-timeout-minutes:2}")
    private int autoEndTimeoutMinutes;

    @Value("${app.online-session.early-join-minutes:15}")
    private int earlyJoinMinutes;

    @Override
    @Transactional
    public OnlineSessionResponse createSession(CreateOnlineSessionRequest request, Long userId) {
        log.info("Creating new online session for student ID: {}", request.getStudentId());

        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("Current user not found"));

        Long tutorId = request.getTutorId();
        if (tutorId == null) {
            Tutor tutor = tutorRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("Tutor profile not found for current user"));
            tutorId = tutor.getId();
        }

        Long finalTutorId = tutorId;
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new RuntimeException("Tutor not found with ID: " + finalTutorId));
        
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found with ID: " + request.getStudentId()));

        OnlineSession session = OnlineSession.builder()
                .roomId(UUID.randomUUID().toString())
                .roomStatus(RoomStatus.WAITING)
                .scheduledStart(request.getScheduledStart())
                .scheduledEnd(request.getScheduledEnd())
                .tutor(tutor)
                .student(student)
                .build();

        OnlineSession saved = onlineSessionRepository.save(session);

        // Publish Event for Notifications
        eventPublisher.publishEvent(OnlineSessionCreatedEvent.builder()
                .sessionId(saved.getId())
                .roomId(saved.getRoomId())
                .tutorId(tutor.getUser().getId()) // Use User ID for notification targeting
                .tutorName(tutor.getFullName())
                .studentId(request.getStudentId())
                .studentName(student.getName())
                .scheduledStart(saved.getScheduledStart())
                .build());

        return mapToResponse(saved);
    }


    @Override
    @Transactional
    public JoinRoomResponse joinRoom(String roomId, Long userId) {
        log.info("User {} joining room {}", userId, roomId);
        
        OnlineSession session = onlineSessionRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found: " + roomId));

        // ✅ Check room status
        if (session.getRoomStatus() == RoomStatus.ENDED) {
            throw new RoomAlreadyEndedException("Cannot join: session has ended");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // ✅ Record join time
        LocalDateTime now = LocalDateTime.now(clock);
        
        if ("TUTOR".equals(user.getRole().getName())) {
            // New Join
            if (session.getTutorJoinedAt() == null) {
                session.setTutorJoinedAt(now);
                log.info("Tutor {} joined room {}", userId, roomId);
            } 
            // Re-join (Implicit or Explicit)
            else {
                // If LeftAt is null (Silent Disconnect), try to close segment using Last Activity
                if (session.getTutorLeftAt() == null) {
                    LocalDateTime lastActive = presenceService.getLastActivity(roomId, userId);
                    // Threshold: Heartbeat (5s) + Buffer (1s) = 6s
                    // If lastActive is older than 6s, we assume they left.
                    if (lastActive != null && lastActive.isBefore(now.minusSeconds(6))) {
                        // User was gone for >6s, treat as gap
                        session.setTutorLeftAt(lastActive);
                        log.info("Detected silent disconnect for Tutor {}. Closing segment at {}", userId, lastActive);
                    } else {
                         // Very short disconnect or just reload (<5s) -> Don't gap, treat as continuous
                         // Or if lastActive is null (shouldn't happen if they were active)
                         // If we don't set LeftAt, it continues as one segment.
                    }
                }
                
                // If LeftAt is set (either explicitly or via logic above), flush and start new
                if (session.getTutorLeftAt() != null) {
                    flushDuration(session);
                    session.setTutorJoinedAt(now);
                    session.setTutorLeftAt(null);
                    log.info("Tutor {} rejoined room {}", userId, roomId);
                }
            }
        } else if ("STUDENT".equals(user.getRole().getName())) {
            // Verify student ID match
            if (user.getStudentId() != null && user.getStudentId().equals(session.getStudent().getId())) {
                if (session.getStudentJoinedAt() == null) {
                    session.setStudentJoinedAt(now);
                    log.info("Student {} joined room {}", userId, roomId);
                } 
                else {
                    // SILENT DISCONNECT LOGIC FOR STUDENT
                    if (session.getStudentLeftAt() == null) {
                        LocalDateTime lastActive = presenceService.getLastActivity(roomId, userId);
                        if (lastActive != null && lastActive.isBefore(now.minusSeconds(6))) {
                            session.setStudentLeftAt(lastActive);
                             log.info("Detected silent disconnect for Student {}. Closing segment at {}", userId, lastActive);
                        }
                    }

                    if (session.getStudentLeftAt() != null) {
                        flushDuration(session);
                        session.setStudentJoinedAt(now);
                        session.setStudentLeftAt(null);
                        log.info("Student {} rejoined room {}", userId, roomId);
                    }
                }
            }
        }
        
        // ✅ Activate room if still waiting
        if (session.getRoomStatus() == RoomStatus.WAITING) {
            session.setRoomStatus(RoomStatus.ACTIVE);
            session.setActualStart(now);
            log.info("Room {} activated", roomId);
        }
        
        onlineSessionRepository.save(session);

        String token = roomTokenService.generateToken(roomId, userId, user.getRole().getName());

        return JoinRoomResponse.builder()
                .token(token)
                .session(mapToResponse(session))
                .turnServers(turnServers)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public RoomStatsResponse getRoomStats(String roomId, Long userId) {
        log.info("Fetching stats for room {} by user {}", roomId, userId);
        
        OnlineSession session = onlineSessionRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found: " + roomId));

        return RoomStatsResponse.builder()
                .roomId(roomId)
                .roomStatus(session.getRoomStatus().name())
                .tutorId(session.getTutor().getUser().getId()) // Tutor always has User
                // Student might not have User if not registered, but usually does in this system
                // We need the User ID to match WebSocket 'userId'.
                // If student has no User account, we can't match them via WS anyway.
                // Best effort lookup or query via userRepository.findByStudentId
                .studentId(userRepository.findByStudentId(session.getStudent().getId()).map(User::getId).orElse(null))
                .tutorName(session.getTutor().getFullName())
                .studentName(session.getStudent().getName())
                .tutorPresent(presenceService.isUserActive(roomId, session.getTutor().getUser().getId(), 60))
                // Best effort for student presence check (requires User mapping)
                .studentPresent(
                    userRepository.findByStudentId(session.getStudent().getId())
                        .map(u -> presenceService.isUserActive(roomId, u.getId(), 60))
                        .orElse(false)
                )
                .participantCount(calculateParticipantCount(session))
                .scheduledStart(session.getScheduledStart())
                .scheduledEnd(session.getScheduledEnd())
                .actualStart(session.getActualStart())
                .actualEnd(session.getActualEnd())
                .tutorJoinedAt(session.getTutorJoinedAt())
                .studentJoinedAt(session.getStudentJoinedAt())
                .durationMinutes(calculateCurrentDurationSeconds(session) / 60)
                .durationSeconds(calculateCurrentDurationSeconds(session))
                .recordingEnabled(session.getRecordingEnabled())
                .recordingDownloaded(session.getRecordingDownloaded())
                .recordingDurationMinutes(session.getRecordingDurationMinutes())
                .recordingFileSizeMb(session.getRecordingFileSizeMb() != null 
                    ? session.getRecordingFileSizeMb().toString() : null)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public GlobalStatsResponse getGlobalStats() {
        long total = onlineSessionRepository.count();
        long active = onlineSessionRepository.countByRoomStatus(RoomStatus.ACTIVE);
        long waiting = onlineSessionRepository.countByRoomStatus(RoomStatus.WAITING);
        long ended = onlineSessionRepository.countByRoomStatus(RoomStatus.ENDED);
        
        Long totalDuration = onlineSessionRepository.sumTotalDurationMinutes().orElse(0L);
        
        long today = onlineSessionRepository.countByScheduledStartBetween(
                LocalDate.now(clock).atStartOfDay(),
                LocalDate.now(clock).atStartOfDay().plusDays(1)
        );
        
        return GlobalStatsResponse.builder()
                .totalSessions(total)
                .activeSessions(active)
                .waitingSessions(waiting)
                .endedSessions(ended)
                .totalDurationMinutes(totalDuration)
                .sessionsToday(today)
                .averageSessionDuration(total > 0 ? (double) totalDuration / total : 0.0)
                .build();
    }

    private Integer calculateParticipantCount(OnlineSession session) {
        if (session.getRoomStatus() != RoomStatus.ACTIVE) {
            return 0;
        }
        
        int count = 0;
        if (session.getTutorJoinedAt() != null) count++;
        if (session.getStudentJoinedAt() != null) count++;
        return count;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public OnlineSessionResponse endSession(String roomId, Long userId) {
        log.info("Ending online session for room ID: {}", roomId);

        OnlineSession session = onlineSessionRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Online session not found for room: " + roomId));

        if (session.getRoomStatus() == RoomStatus.ENDED) {
                return mapToResponse(session);
        }

        LocalDateTime now = LocalDateTime.now(clock);
        session.setRoomStatus(RoomStatus.ENDED);
        session.setActualEnd(now);

        // Set left times if not already set (e.g., they were still active when tutor clicked end)
        if (session.getTutorJoinedAt() != null && session.getTutorLeftAt() == null) {
            session.setTutorLeftAt(now);
        }
        if (session.getStudentJoinedAt() != null && session.getStudentLeftAt() == null) {
            session.setStudentLeftAt(now);
        }

        // Flush any pending duration before ending
        flushDuration(session);

        OnlineSession saved = onlineSessionRepository.save(session);

        Long tutorUserId = saved.getTutor().getUser().getId();
        Long studentUserId = userRepository.findByStudentId(saved.getStudent().getId())
                .map(User::getId)
                .orElse(null);
        
        // Publish End Event
        eventPublisher.publishEvent(OnlineSessionEndedEvent.builder()
                .sessionId(saved.getId())
                .roomId(saved.getRoomId())
                .tutorId(tutorUserId) // ✅ Correct
                .studentId(studentUserId) // ✅ Correct (may be null, handled in listener)
                .durationMinutes(saved.getTotalDurationMinutes())
                .build());

        return mapToResponse(saved);
    }

    @Override
    @Transactional
    public void updateHeartbeat(String roomId, Long userId) {
        OnlineSession session = onlineSessionRepository.findByRoomIdForUpdate(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found: " + roomId));

        // Only process for ACTIVE rooms
        if (session.getRoomStatus() != RoomStatus.ACTIVE) {
            return;
        }

        // ✅ check participant correctly to avoid NPE
        boolean isParticipant = false;
        
        // Check if tutor
        if (session.getTutor().getUser() != null && 
            session.getTutor().getUser().getId().equals(userId)) {
            isParticipant = true;
        }
        
        // ✅ Check if student (via User.studentId)
        if (!isParticipant) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && user.getStudentId() != null) {
                isParticipant = user.getStudentId().equals(session.getStudent().getId());
            }
        }

        if (isParticipant) {
            // ✅ Update in-memory presence (fast) - avoiding constant DB writes
            presenceService.updateHeartbeat(roomId, userId);
            
            // If they were marked as left, announce they are back and clear left time
            boolean wasMarkedLeft = false;
            LocalDateTime now = LocalDateTime.now(clock);

            if (session.getTutor().getUser() != null && session.getTutor().getUser().getId().equals(userId)) {
                if (session.getTutorLeftAt() != null) {
                    // FLUSH PREVIOUS SEGMENT
                    flushDuration(session);
                    
                    // RESET START TIME FOR NEW SEGMENT
                    session.setTutorJoinedAt(now);
                    session.setTutorLeftAt(null);
                    wasMarkedLeft = true;
                }
            } else {
                if (session.getStudentLeftAt() != null) {
                    // FLUSH PREVIOUS SEGMENT
                    flushDuration(session);
                    
                    // RESET START TIME FOR NEW SEGMENT
                    session.setStudentJoinedAt(now);
                    session.setStudentLeftAt(null);
                    wasMarkedLeft = true;
                }
            }

            if (wasMarkedLeft) {
                if (session.getInactivityWarningSentAt() != null) {
                    session.setInactivityWarningSentAt(null);
                }
                onlineSessionRepository.save(session);
                broadcastStatus(roomId, SessionStatusResponse.Type.PARTICIPANT_JOINED, userId, null, null, "Người dùng đã quay lại.");
            } else if (session.getInactivityWarningSentAt() != null) {
                session.setInactivityWarningSentAt(null);
                onlineSessionRepository.save(session);
                broadcastStatus(roomId, SessionStatusResponse.Type.PARTICIPANT_JOINED, userId, null, null, "Hệ thống đã ổn định trở lại.");
            }
            
            log.trace("Heartbeat updated for room {} by user {}", roomId, userId);
        } else {
            log.warn("Heartbeat rejected: user {} not in room {} (session participants: tutor={}, student={})", 
                userId, roomId, session.getTutor().getUser().getId(), session.getStudent().getId());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public OnlineSessionResponse getCurrentSession(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        Optional<OnlineSession> session = Optional.empty();
        if ("TUTOR".equals(user.getRole().getName())) {
            Tutor tutor = tutorRepository.findByUserId(userId)
                    .orElseThrow(() -> new TutorProfileNotFoundException(userId));
            session = onlineSessionRepository.findFirstByTutorIdAndRoomStatusNotOrderByScheduledStartAsc(
                    tutor.getId(), RoomStatus.ENDED);
        } else if ("STUDENT".equals(user.getRole().getName())) {
            if (user.getStudentId() != null) {
                session = onlineSessionRepository.findFirstByStudentIdAndRoomStatusNotOrderByScheduledStartAsc(
                        user.getStudentId(), RoomStatus.ENDED);
            }
        }

        return session.map(this::mapToResponse).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Window<OnlineSessionResponse> getMySessions(Long userId, String continuationToken, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        ScrollPosition scrollPosition = decodeContinuationToken(continuationToken);
        
        Limit limit = Limit.of(size);
        Window<OnlineSession> window = Window.from(Collections.emptyList(), pos -> scrollPosition);

        if ("TUTOR".equals(user.getRole().getName())) {
            Tutor tutor = tutorRepository.findByUserId(userId)
                    .orElseThrow(() -> new TutorProfileNotFoundException(userId));
            window = onlineSessionRepository.findAllByTutorIdAndRoomStatusNotOrderByScheduledStartAscIdAsc(
                    tutor.getId(), RoomStatus.ENDED, scrollPosition, limit);
        } else if ("STUDENT".equals(user.getRole().getName())) {
            if (user.getStudentId() != null) {
                window = onlineSessionRepository.findAllByStudentIdAndRoomStatusNotOrderByScheduledStartAscIdAsc(
                        user.getStudentId(), RoomStatus.ENDED, scrollPosition, limit);
            }
        }

        return window.map(this::mapToResponse);
    }

    private ScrollPosition decodeContinuationToken(String token) {
        if (token == null || token.isBlank()) {
            return ScrollPosition.keyset();
        }
        try {
            // Spring Data's continuation token is usually a Base64 encoded JSON keyset
            byte[] decoded = Base64.getDecoder().decode(token);
            Map<String, Object> keys = objectMapper.readValue(decoded, new TypeReference<Map<String, Object>>() {});
            return ScrollPosition.keyset();
        } catch (Exception e) {
            log.warn("Failed to decode continuation token, falling back to initial: {}", token);
            return ScrollPosition.keyset();
        }
    }

    private void broadcastStatus(String roomId, SessionStatusResponse.Type type, Long userId, String role, Integer remainingSeconds, String message) {
        SessionStatusResponse response = SessionStatusResponse.builder()
                .roomId(roomId)
                .type(type)
                .userId(userId)
                .role(role)
                .remainingSeconds(remainingSeconds)
                .message(message)
                .build();
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/status", response);
    }

    @Override
    @Scheduled(fixedRate = 60000) // Every 60 seconds
    public void detectInactiveParticipants() {
        LocalDateTime now = LocalDateTime.now(clock);
        List<OnlineSession> activeSessions = onlineSessionRepository.findByRoomStatus(RoomStatus.ACTIVE);
        
        // ✅ N+1 Query Fix: Pre-load all potential student users
        List<Long> studentIds = activeSessions.stream()
                .map(s -> s.getStudent().getId())
                .distinct()
                .toList();
        
        java.util.Map<Long, User> studentUserMap = userRepository.findByStudentIdIn(studentIds).stream()
                .collect(java.util.stream.Collectors.toMap(User::getStudentId, java.util.function.Function.identity(), (a, b) -> a));

        for (OnlineSession session : activeSessions) {
            try {
                User studentUser = studentUserMap.get(session.getStudent().getId());
                processSessionInactivity(session, now, studentUser);
            } catch (Exception e) {
                log.error("Error processing inactivity for room {}: {}", session.getRoomId(), e.getMessage());
            }
        }
    }

    @Override
    @Transactional
    public OnlineSessionResponse updateRecordingMetadata(String roomId, UpdateRecordingMetadataRequest request) {
        log.info("Updating recording metadata for room: {}", roomId);
        
        OnlineSession session = onlineSessionRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found: " + roomId));

        session.setRecordingDurationMinutes(request.getDurationMinutes());
        session.setRecordingFileSizeMb(request.getFileSizeMb());
        session.setRecordingDownloaded(request.getDownloaded());
        
        if (session.getRecordingStartedAt() == null && request.getDurationMinutes() > 0) {
            session.setRecordingStartedAt(LocalDateTime.now(clock).minusMinutes(request.getDurationMinutes()));
        }
        session.setRecordingStoppedAt(LocalDateTime.now(clock));

        return mapToResponse(onlineSessionRepository.save(session));
    }

    @Override
    @Transactional
    public OnlineSessionResponse convertToOnline(Long sessionRecordId, Long userId) {
        log.info("Converting session record ID {} to online by user {}", sessionRecordId, userId);

        // Pessimistic lock to prevent race conditions during status check/conversion
        SessionRecord sessionRecord = sessionRecordRepository.findByIdForUpdate(sessionRecordId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học với ID: " + sessionRecordId));

        // Validate tutor access accurately
        Tutor tutor = tutorRepository.findByUserId(userId)
                .orElseThrow(() -> new TutorProfileNotFoundException(userId));
        
        if (!sessionRecord.getTutorId().equals(tutor.getId())) {
            throw new UnauthorizedSessionConversionException(tutor.getId(), sessionRecordId);
        }

        // Check if already online (Database unique constraint UK_ONLINE_SESSION_RECORD provides safety)
        if (onlineSessionRepository.existsBySessionRecordId(sessionRecordId)) {
            throw new SessionAlreadyOnlineException(sessionRecordId);
        }

        // Validate status (don't convert COMPLETED, CANCELLED, etc.)
        if (sessionRecord.getStatus() != LessonStatus.SCHEDULED) {
             throw new SessionCannotBeConvertedException("Chỉ có thể chuyển đổi buổi học đang ở trạng thái 'Đã xếp lịch'. Trạng thái hiện tại: " + sessionRecord.getStatus());
        }

        LocalDateTime scheduledStart = LocalDateTime.of(sessionRecord.getSessionDate(), sessionRecord.getStartTime());
        LocalDateTime scheduledEnd = LocalDateTime.of(sessionRecord.getSessionDate(), sessionRecord.getEndTime());

        // Validate scheduled time is in future
        if (scheduledStart.isBefore(LocalDateTime.now(clock))) {
            throw new SessionCannotBeConvertedException("Không thể chuyển sang Online cho buổi học đã hoặc đang diễn ra.");
        }

        OnlineSession session = OnlineSession.builder()
                .roomId(UUID.randomUUID().toString())
                .roomStatus(RoomStatus.WAITING)
                .scheduledStart(scheduledStart)
                .scheduledEnd(scheduledEnd)
                .tutor(tutor)
                .student(sessionRecord.getStudent())
                .sessionRecord(sessionRecord)
                .build();

        try {
            OnlineSession saved = onlineSessionRepository.save(session);

            // Publish conversion event
            eventPublisher.publishEvent(SessionConvertedToOnlineEvent.builder()
                    .sessionId(sessionRecordId)
                    .roomId(saved.getRoomId())
                    .studentId(sessionRecord.getStudent().getId())
                    .tutorName(tutor.getFullName())
                    .subject(sessionRecord.getSubject())
                    .sessionDate(sessionRecord.getSessionDate())
                    .startTime(sessionRecord.getStartTime())
                    .build());

            return mapToResponse(saved);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            log.error("Conflict detected during session conversion for ID {}: {}", sessionRecordId, e.getMessage());
            throw new SessionAlreadyOnlineException(sessionRecordId);
        }
    }

    @Override
    @Transactional
    public void revertToOffline(Long sessionRecordId, Long userId) {
        log.info("Reverting session record ID {} to offline by user {}", sessionRecordId, userId);

        OnlineSession session = onlineSessionRepository.findBySessionRecordId(sessionRecordId)
                .orElseThrow(() -> new RoomNotFoundException("Online session not found for record ID: " + sessionRecordId));

        // Validate tutor access (Security check)
        Tutor tutor = tutorRepository.findByUserId(userId)
                .orElseThrow(() -> new TutorProfileNotFoundException(userId));
        
        if (!session.getTutor().getId().equals(tutor.getId())) {
             throw new UnauthorizedSessionConversionException(tutor.getId(), sessionRecordId);
        }

        // Validate Status
        // Allow WAITING, ACTIVE, or ENDED (Total reset/recreate capability)
        // No status check needed as we want to allow deleting any online session to reset to offline.


        // Delete the Online Session
        onlineSessionRepository.delete(session);
        log.info("Deleted online session room {} for record {}", session.getRoomId(), sessionRecordId);
        
        // No need to explicitly update SessionRecord as the isOnline flag is derived from existence of OnlineSession
    }

    @Transactional
    public void processSessionInactivity(OnlineSession session, LocalDateTime now, User studentUser) {
        if (Boolean.TRUE.equals(session.getPreventAutoEnd())) {
            return;
        }

        boolean tutorActive = presenceService.isUserActive(
            session.getRoomId(), 
            session.getTutor().getUser().getId(),
            65
        );
        
        boolean studentActive = false;
        if (studentUser != null) {
            studentActive = presenceService.isUserActive(
                session.getRoomId(),
                studentUser.getId(),
                65
            );
        }
        
        boolean needsSave = false;
        
        // Track when they left
        if (!tutorActive && session.getTutorLeftAt() == null && session.getTutorJoinedAt() != null) {
            // Flush duration up to now before marking as left
            session.setTutorLeftAt(now);
            // Don't flush yet - allow getRoomStats to calculate pending based on LeftAt
            // flushDuration(session); 
            
            needsSave = true;
            broadcastStatus(session.getRoomId(), SessionStatusResponse.Type.PARTICIPANT_LEFT, 
                session.getTutor().getUser().getId(), "TUTOR", null, "Giảng viên đã mất kết nối.");
            log.info("Tutor in room {} marked as inactive at {}", session.getRoomId(), now);
        }

        if (!studentActive && session.getStudentLeftAt() == null && session.getStudentJoinedAt() != null) {
            session.setStudentLeftAt(now);
            // flushDuration(session); 

            needsSave = true;
            if (studentUser != null) {
                broadcastStatus(session.getRoomId(), SessionStatusResponse.Type.PARTICIPANT_LEFT, 
                    studentUser.getId(), "STUDENT", null, "Học sinh đã mất kết nối.");
            }
            log.info("Student in room {} marked as inactive at {}", session.getRoomId(), now);
        }
        
        // Notify if both left (Inactivity warning)
        if (!tutorActive && !studentActive && session.getTutorLeftAt() != null && session.getStudentLeftAt() != null) {
            LocalDateTime overlapLeftAt = session.getTutorLeftAt().isAfter(session.getStudentLeftAt()) 
                    ? session.getTutorLeftAt() : session.getStudentLeftAt();
            
            LocalDateTime autoEndTime = overlapLeftAt.plusMinutes(autoEndTimeoutMinutes);
            
            if (now.isBefore(autoEndTime)) {
                // Throttle warning messages: only send if not sent before or sent > 45s ago (to avoid spamming every minute)
                if (session.getInactivityWarningSentAt() == null) {
                    long remainingSeconds = java.time.Duration.between(now, autoEndTime).toSeconds();
                    broadcastStatus(session.getRoomId(), SessionStatusResponse.Type.INACTIVITY_WARNING, 
                        null, null, (int) remainingSeconds, "Phòng học sẽ tự động đóng do không có người.");
                    session.setInactivityWarningSentAt(now);
                    needsSave = true;
                }
            } else {
                log.warn("Auto-ending abandoned room: {}", session.getRoomId());
                meterRegistry.counter("online_session.auto_end.triggered", "reason", "both_inactive").increment();
                broadcastStatus(session.getRoomId(), SessionStatusResponse.Type.ROOM_AUTO_ENDED, null, null, 0, "Phòng học đã đóng.");
                endSession(session.getRoomId(), null);
                return; // endSession handles save
            }
        } else if (tutorActive || studentActive) {
            session.setLastActivityAt(now);
            needsSave = true;
        }

        if (needsSave) {
            onlineSessionRepository.save(session);
            meterRegistry.counter("online_session.inactivity.detected",
                "tutor_active", String.valueOf(tutorActive),
                "student_active", String.valueOf(studentActive)).increment();
        }
    }

    private OnlineSessionResponse mapToResponse(OnlineSession session) {
        LocalDateTime now = LocalDateTime.now(clock);
        
        // canJoinNow logic:
        // 1. If ACTIVE -> True (Join)
        // 2. If WAITING -> True if within earlyJoinMinutes before scheduledStart
        // 3. If ENDED -> False
        boolean canJoinNow = false;
        if (session.getRoomStatus() == RoomStatus.ACTIVE) {
            canJoinNow = true;
        } else if (session.getRoomStatus() == RoomStatus.WAITING) {
            LocalDateTime earlyJoinTime = session.getScheduledStart().minusMinutes(earlyJoinMinutes);
            canJoinNow = !now.isBefore(earlyJoinTime);
        }

        return OnlineSessionResponse.builder()
                .id(session.getId())
                .roomId(session.getRoomId())
                .roomStatus(session.getRoomStatus().name())
                .scheduledStart(session.getScheduledStart())
                .scheduledEnd(session.getScheduledEnd())
                .actualStart(session.getActualStart())
                .actualEnd(session.getActualEnd())
                .tutorId(session.getTutor().getId())
                .tutorName(session.getTutor().getFullName())
                .studentId(session.getStudent().getId())
                .studentName(session.getStudent().getName())
                .canJoinNow(canJoinNow)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public void notifyUserJoined(String roomId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));

        String name = user.getFullName();
        String role = user.getRole().getName();
        // Assuming avatar logic exists or placeholder
        String avatarUrl = null; // Placeholder: User entity supports no avatar yet

        log.info("Broadcasting JOIN for user {} in room {}", userId, roomId);

        UserJoinedMessage message = UserJoinedMessage.builder()
                .userId(userId)
                .name(name)
                .role(role)
                .avatarUrl(avatarUrl)
                .joinedAt(java.time.Instant.now())
                .build();

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/presence", message);
    }

    @Override
    public void notifyUserLeft(String roomId, Long userId) {
        log.info("Broadcasting LEAVE for user {} in room {}", userId, roomId);
        
        UserLeftMessage message = UserLeftMessage.builder()
                .userId(userId)
                .leftAt(java.time.Instant.now())
                .build();

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/presence", message);
    }

    private void flushDuration(OnlineSession session) {
        LocalDateTime tStart = session.getTutorJoinedAt();
        LocalDateTime tEnd = session.getTutorLeftAt() != null ? session.getTutorLeftAt() : LocalDateTime.now(clock);
        
        LocalDateTime sStart = session.getStudentJoinedAt();
        LocalDateTime sEnd = session.getStudentLeftAt() != null ? session.getStudentLeftAt() : LocalDateTime.now(clock);
        
        if (tStart == null || sStart == null) return;
        
        long seconds = calculateOverlapSeconds(tStart, tEnd, sStart, sEnd);
        if (seconds > 0) {
            int currentTotalSeconds = session.getTotalDurationSeconds() != null ? session.getTotalDurationSeconds() : 0;
            session.setTotalDurationSeconds(currentTotalSeconds + (int) seconds);
            session.setTotalDurationMinutes((currentTotalSeconds + (int) seconds) / 60);
            log.info("Flushed {} seconds to session {}. New Total: {}s", seconds, session.getRoomId(), session.getTotalDurationSeconds());
        }
    }

    private long calculateOverlapSeconds(LocalDateTime start1, LocalDateTime end1, LocalDateTime start2, LocalDateTime end2) {
        if (start1 == null || end1 == null || start2 == null || end2 == null) return 0;
        
        LocalDateTime overlapStart = start1.isAfter(start2) ? start1 : start2;
        LocalDateTime overlapEnd = end1.isBefore(end2) ? end1 : end2;
        
        if (overlapEnd.isAfter(overlapStart)) {
            return java.time.Duration.between(overlapStart, overlapEnd).toSeconds();
        }
        return 0;
    }

    private Integer calculateCurrentDurationSeconds(OnlineSession session) {
        int storedDuration = session.getTotalDurationSeconds() != null ? session.getTotalDurationSeconds() : 0;
        
        if (session.getRoomStatus() != RoomStatus.ACTIVE) {
            return storedDuration;
        }

        // Logic: Add current pending segment duration
        // We simulate a flush logic but without saving
        
        LocalDateTime tStart = session.getTutorJoinedAt();
        LocalDateTime now = LocalDateTime.now(clock);
        
        // If leftAt is null, use lastActivity (capped by now)
        // If leftAt is SET, use leftAt.
        LocalDateTime tEnd = session.getTutorLeftAt();
        if (tEnd == null) {
             LocalDateTime tAct = presenceService.getLastActivity(session.getRoomId(), session.getTutor().getUser().getId());
             // Optimistic: If active within 65s (heartbeat interval + buffer), use NOW to avoid stutter.
             // Pessimistic: If inactive, use LastActivity to stop billing at disconnect time.
             if (tAct == null || tAct.isAfter(now.minusSeconds(65))) {
                 tEnd = now;
             } else {
                 tEnd = tAct;
             }
        }

        LocalDateTime sStart = session.getStudentJoinedAt();
        LocalDateTime sEnd = session.getStudentLeftAt();
        if (sEnd == null) {
             // Resolving student User ID logic mostly duplicated but necessary
              Long sUserId = userRepository.findByStudentId(session.getStudent().getId()).map(User::getId).orElse(null);
              if (sUserId != null) {
                  LocalDateTime sAct = presenceService.getLastActivity(session.getRoomId(), sUserId);
                  if (sAct == null || sAct.isAfter(now.minusSeconds(65))) {
                      sEnd = now;
                  } else {
                      sEnd = sAct;
                  }
              } else {
                  // No user account -> assume active if joined? Or fallback to join time?
                  // Best effort: usage 'now'
                  sEnd = now;
              }
        }
        
        
        long pending = calculateOverlapSeconds(tStart, tEnd, sStart, sEnd);
        
        return storedDuration + (int) pending;
    }
}
