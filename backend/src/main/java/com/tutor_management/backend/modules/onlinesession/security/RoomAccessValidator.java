package com.tutor_management.backend.modules.onlinesession.security;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.onlinesession.entity.OnlineSession;
import com.tutor_management.backend.modules.onlinesession.enums.RoomStatus;
import com.tutor_management.backend.modules.onlinesession.exception.RoomAccessDeniedException;
import com.tutor_management.backend.modules.onlinesession.exception.RoomNotFoundException;
import com.tutor_management.backend.modules.onlinesession.repository.OnlineSessionRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import java.util.Objects;

/**
 * Validator for securing room access.
 * Ensures only authorized participants (Tutor, Student, or Admin) can enter a room.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class RoomAccessValidator {

    private final OnlineSessionRepository onlineSessionRepository;
    private final UserRepository userRepository;
    private final TutorRepository tutorRepository;

    /**
     * Validates if a user has permission to access a specific room.
     * 
     * @param roomId The unique room identifier.
     * @param userId The ID of the user requesting access.
     * @return true if access is granted, false otherwise.
     */
    public boolean hasAccess(String roomId, Long userId) {
        try {
            validateAccess(roomId, userId);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Checks if a user can join a room (has access AND room is not ended).
     */
    public boolean canJoin(String roomId, Long userId) {
        try {
            // 1. Check basic access
            validateAccess(roomId, userId);

            // 2. Check room status
            var session = onlineSessionRepository.findByRoomId(roomId)
                    .orElseThrow(() -> new RoomNotFoundException(roomId));

            if (session.getRoomStatus() == RoomStatus.ENDED) {
                log.warn("Access denied: User {} tried to join ended room {}", userId, roomId);
                return false;
            }

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Validates if a user has permission to access a specific room.
     * 
     * @param roomId The unique room identifier.
     * @param userId The ID of the user requesting access.
     * @throws RoomNotFoundException if the room does not exist.
     * @throws RoomAccessDeniedException if the user is not authorized.
     */
    public void validateAccess(String roomId, Long userId) {
        OnlineSession session = onlineSessionRepository.findByRoomId(roomId)
            .orElseThrow(() -> new RoomNotFoundException("Room not found: " + roomId));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new UsernameNotFoundException("User not found with ID: " + userId));

        // ADMIN has global access
        if ("ADMIN".equals(user.getRole().getName())) {
            return;
        }

        // TUTOR must be the assigned tutor for this session
        if ("TUTOR".equals(user.getRole().getName())) {
            Tutor tutor = tutorRepository.findByUserId(userId)
                .orElseThrow(() -> new RoomAccessDeniedException("Tutor profile not found for user: " + userId));

            if (session.getTutor() == null) {
                throw new RoomAccessDeniedException("Session has no assigned tutor (data corruption).");
            }
            
            if (!Objects.equals(tutor.getId(), session.getTutor().getId())) {
                throw new RoomAccessDeniedException("You are not the designated tutor for this room.");
            }
            return;
        }

        // STUDENT must be the assigned student for this session
        if ("STUDENT".equals(user.getRole().getName())) {
            if (session.getStudent() == null) {
                log.error("RoomAccessValidator: Session {} has no student assigned", roomId);
                throw new RoomAccessDeniedException("Session has no assigned student (data corruption).");
            }
            if (user.getStudentId() == null) {
                log.error("RoomAccessValidator: User {} (Student) has no studentId", userId);
                throw new RoomAccessDeniedException("You are not authorized to join this room.");
            }
            if (!Objects.equals(user.getStudentId(), session.getStudent().getId())) {
                log.error("RoomAccessValidator: Mismatch for room {}. User StudentID: {}, Session StudentID: {}", 
                     roomId, user.getStudentId(), session.getStudent().getId());
                throw new RoomAccessDeniedException("You are not authorized to join this room.");
            }
            return;
        }

        // Fallback for any other unauthorized roles
        throw new RoomAccessDeniedException("Unauthorized role for room access.");
    }
}
