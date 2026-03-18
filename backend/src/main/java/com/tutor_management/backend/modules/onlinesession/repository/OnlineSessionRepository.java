package com.tutor_management.backend.modules.onlinesession.repository;

import com.tutor_management.backend.modules.onlinesession.entity.OnlineSession;
import com.tutor_management.backend.modules.onlinesession.enums.RoomStatus;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Window;
import org.springframework.data.repository.query.FluentQuery;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for OnlineSession data access.
 */
@Repository
public interface OnlineSessionRepository extends JpaRepository<OnlineSession, Long> {

    /**
     * Finds an online session by its unique room ID.
     * 
     * @param roomId The unique identifier for the room.
     * @return Optional containing the OnlineSession if found.
     */
    Optional<OnlineSession> findByRoomId(String roomId);

    /**
     * Checks if a room exists by its ID.
     * @param roomId The room ID
     * @return true if exists
     */
    boolean existsByRoomId(String roomId);

    @EntityGraph(attributePaths = {"tutor", "student"})
    List<OnlineSession> findByRoomStatus(RoomStatus status);

    long countByRoomStatus(RoomStatus status);

    @Query("SELECT SUM(s.totalDurationMinutes) FROM OnlineSession s WHERE s.totalDurationMinutes IS NOT NULL")
    Optional<Long> sumTotalDurationMinutes();

    long countByScheduledStartBetween(LocalDateTime start, LocalDateTime end);

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM OnlineSession s WHERE s.roomId = :roomId")
    Optional<OnlineSession> findByRoomIdForUpdate(@org.springframework.data.repository.query.Param("roomId") String roomId);

    Optional<OnlineSession> findFirstByStudentIdAndRoomStatusNotOrderByScheduledStartAsc(Long studentId, RoomStatus status);

    Optional<OnlineSession> findFirstByTutorIdAndRoomStatusNotOrderByScheduledStartAsc(Long tutorId, RoomStatus status);

    @EntityGraph(attributePaths = {"tutor.user", "student"})
    Window<OnlineSession> findAllByTutorIdAndRoomStatusNotOrderByScheduledStartAscIdAsc(Long tutorId, RoomStatus status, ScrollPosition scrollPosition, Limit limit);

    @EntityGraph(attributePaths = {"tutor.user", "student"})
    Window<OnlineSession> findAllByStudentIdAndRoomStatusNotOrderByScheduledStartAscIdAsc(Long studentId, RoomStatus status, ScrollPosition scrollPosition, Limit limit);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
                    UPDATE OnlineSession s
                    SET s.roomStatus = com.tutor_management.backend.modules.onlinesession.enums.RoomStatus.ENDED,
                            s.actualEnd = :now
                    WHERE s.tutor.id = :tutorId
                        AND s.roomStatus = com.tutor_management.backend.modules.onlinesession.enums.RoomStatus.WAITING
                        AND s.scheduledEnd < :now
                    """)
    int expireWaitingSessionsByTutorId(Long tutorId, LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
                    UPDATE OnlineSession s
                    SET s.roomStatus = com.tutor_management.backend.modules.onlinesession.enums.RoomStatus.ENDED,
                            s.actualEnd = :now
                    WHERE s.student.id = :studentId
                        AND s.roomStatus = com.tutor_management.backend.modules.onlinesession.enums.RoomStatus.WAITING
                        AND s.scheduledEnd < :now
                    """)
    int expireWaitingSessionsByStudentId(Long studentId, LocalDateTime now);

    /**
     * Checks if an online session already exists for a specific session record.
     * 
     * @param sessionRecordId The ID of the session record.
     * @return true if an online session already exists.
     */
    boolean existsBySessionRecordId(Long sessionRecordId);

    /**
     * Finds the online session associated with a specific session record.
     * 
     * @param sessionRecordId The ID of the session record.
     * @return Optional containing the OnlineSession if found.
     */
    Optional<OnlineSession> findBySessionRecordId(Long sessionRecordId);
}
