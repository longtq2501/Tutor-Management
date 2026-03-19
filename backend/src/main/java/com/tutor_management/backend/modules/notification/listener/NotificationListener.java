package com.tutor_management.backend.modules.notification.listener;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.notification.enums.NotificationType;
import com.tutor_management.backend.modules.notification.event.ExamGradedEvent;
import com.tutor_management.backend.modules.notification.event.ExamSubmittedEvent;
import com.tutor_management.backend.modules.notification.event.ExerciseAssignedEvent;
import com.tutor_management.backend.modules.notification.event.ExerciseUpdatedEvent;
import com.tutor_management.backend.modules.notification.event.ScheduleCreatedEvent;
import com.tutor_management.backend.modules.notification.event.ScheduleUpdatedEvent;
import com.tutor_management.backend.modules.notification.event.OnlineSessionCreatedEvent;
import com.tutor_management.backend.modules.notification.event.OnlineSessionEndedEvent;
import com.tutor_management.backend.modules.notification.event.SessionConvertedToOnlineEvent;
import com.tutor_management.backend.modules.notification.event.SessionCreatedEvent;
import com.tutor_management.backend.modules.notification.event.SessionRescheduledEvent;
import com.tutor_management.backend.modules.notification.event.SupportMessageReceivedEvent;
import com.tutor_management.backend.modules.exercise.repository.ExerciseAssignmentRepository;
import com.tutor_management.backend.modules.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * Event Listener for Notification module.
 * Orchestrates the creation and delivery of notifications when domain events are published.
 * 
 * Follows the Single Responsibility Principle by delegating persistence and 
 * SSE delivery to the NotificationService.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationListener {

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ExerciseAssignmentRepository assignmentRepository;

    /**
     * Handles when a student submits an exam. Notifies the tutor.
     * @param event The exam submission event details
     */
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleExamSubmitted(ExamSubmittedEvent event) {
        log.info("Processing ExamSubmittedEvent for submission: {}", event.getSubmissionId());
        
        try {
            Long tutorId = Long.parseLong(event.getTutorId());
            User tutor = userRepository.findById(tutorId)
                    .orElseThrow(() -> new RuntimeException("Tutor not found for ID: " + tutorId));

            notificationService.createAndSend(
                    tutor,
                    "Bài tập mới được nộp",
                    String.format("Học sinh %s đã nộp bài tập: %s", event.getStudentName(), event.getExerciseTitle()),
                    NotificationType.EXAM_SUBMITTED
            );
        } catch (Exception e) {
            log.error("Failed to notify tutor {} for submission {}: {}", 
                    event.getTutorId(), event.getSubmissionId(), e.getMessage());
        }
    }

    /**
     * Handles when a tutor grades an exam. Notifies the student.
     * @param event The exam grading event details
     */
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleExamGraded(ExamGradedEvent event) {
        log.info("Processing ExamGradedEvent for submission: {}", event.getSubmissionId());
        
        try {
            Long studentId = Long.parseLong(event.getStudentId());
            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student user not found for ID: " + studentId));

            notificationService.createAndSend(
                    student,
                    "Bài tập đã được chấm điểm",
                            String.format(Locale.ROOT, "Bài tập '%s' của bạn đã được chấm điểm. Điểm số: %.2f/%s",
                                    event.getExerciseTitle(), event.getScore() != null ? event.getScore() : 0.0, "100"),
                    NotificationType.EXAM_GRADED
            );
        } catch (Exception e) {
            log.error("Failed to notify student {} for graded submission {}: {}", 
                    event.getStudentId(), event.getSubmissionId(), e.getMessage());
        }
    }

    /**
     * Handles when a tutor assigns a new exercise to a student.
     * @param event The exercise assignment details
     */
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleExerciseAssigned(ExerciseAssignedEvent event) {
        log.info("Processing ExerciseAssignedEvent for student: {}", event.getStudentId());
        try {
            Long studentId = Long.parseLong(event.getStudentId());
            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student user not found for ID: " + studentId));

            notificationService.createAndSend(
                    student,
                    "Bạn có bài tập mới",
                    String.format("Giáo viên %s đã giao bài tập mới: %s", event.getTutorName(), event.getExerciseTitle()),
                    NotificationType.EXAM_ASSIGNED
            );
        } catch (Exception e) {
            log.error("Failed to notify student {} for exercise assignment: {}", 
                    event.getStudentId(), e.getMessage());
        }
    }

    /**
     * Handles when a tutor updates an already assigned exercise. 
     * Notifies all students currently assigned to this exercise.
     * @param event The exercise update details
     */
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleExerciseUpdated(ExerciseUpdatedEvent event) {
        log.info("Processing ExerciseUpdatedEvent for exercise: {}", event.getExerciseId());
        
        try {
            var assignments = assignmentRepository.findByExerciseId(event.getExerciseId());
            if (assignments.isEmpty()) {
                return;
            }

            for (var assignment : assignments) {
                try {
                    Long studentId = Long.parseLong(assignment.getStudentId());
                    User student = userRepository.findById(studentId).orElse(null);
                    if (student == null) continue;

                    notificationService.createAndSend(
                            student,
                            "Bài tập đã cập nhật",
                            String.format("Giáo viên %s đã cập nhật nội dung bài tập: %s. Vui lòng kiểm tra lại.", 
                                    event.getTutorName(), event.getExerciseTitle()),
                            NotificationType.EXAM_UPDATED
                    );
                } catch (Exception e) {
                    log.warn("Could not notify student {} for exercise update {}", 
                            assignment.getStudentId(), event.getExerciseId());
                }
            }
        } catch (Exception e) {
            log.error("Critical error in handleExerciseUpdated for exercise {}: {}", 
                    event.getExerciseId(), e.getMessage());
        }
    }

    /**
     * Handles when a new recurring schedule is created for a student.
     * @param event The schedule creation details
     */
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleScheduleCreated(ScheduleCreatedEvent event) {
        log.info("Processing ScheduleCreatedEvent for student: {}", event.getStudentId());
        try {
            Long studentId = Long.parseLong(event.getStudentId());
            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student user not found for ID: " + studentId));

            notificationService.createAndSend(
                    student,
                    "Lịch học mới",
                    String.format("Giáo viên %s đã tạo lịch học mới cho môn %s vào %s lúc %s", 
                            event.getTutorName(), event.getSubject(), event.getDaysOfWeek(), event.getStartTime()),
                    NotificationType.SCHEDULE_CREATED
            );
        } catch (Exception e) {
            log.error("Failed to notify student {} for schedule creation: {}", 
                    event.getStudentId(), e.getMessage());
        }
    }

    /**
     * Handles when a student's existing recurring schedule is modified.
     * @param event The schedule update details
     */
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleScheduleUpdated(ScheduleUpdatedEvent event) {
        log.info("Processing ScheduleUpdatedEvent for student: {}", event.getStudentId());
        try {
            Long studentId = Long.parseLong(event.getStudentId());
            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student user not found for ID: " + studentId));

            notificationService.createAndSend(
                    student,
                    "Lịch học của bạn đã được cập nhật",
                    String.format("Giáo viên %s đã cập nhật lịch học môn %s: học vào %s lúc %s", 
                            event.getTutorName(), event.getSubject(), event.getDaysOfWeek(), event.getStartTime()),
                    NotificationType.SCHEDULE_UPDATED
            );
        } catch (Exception e) {
            log.error("Failed to notify student {} for schedule update: {}", 
                    event.getStudentId(), e.getMessage());
        }
    }

    /**
     * Handles when a single manual session is created.
     * @param event The session record details
     */
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleSessionCreated(SessionCreatedEvent event) {
        log.info("Processing SessionCreatedEvent for student: {}", event.getStudentId());
        try {
            User student = userRepository.findByStudentId(event.getStudentId()).stream()
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Student user mapping not found for student ID: " + event.getStudentId()));

            notificationService.createAndSend(
                    student,
                    "Buổi học mới đã được lên lịch",
                    String.format("Bạn có một buổi học mới môn %s vào ngày %s lúc %s", 
                            event.getSubject(), event.getSessionDate(), event.getStartTime()),
                    NotificationType.SESSION_CREATED
            );
        } catch (Exception e) {
            log.error("Failed to notify student by ID {} for session creation: {}", 
                    event.getStudentId(), e.getMessage());
        }
    }

    /**
     * Handles when a manual session is rescheduled or its time is changed.
     * @param event The session rescheduling details
     */
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleSessionRescheduled(SessionRescheduledEvent event) {
        log.info("Processing SessionRescheduledEvent for student: {}", event.getStudentId());
        try {
            User student = userRepository.findByStudentId(event.getStudentId()).stream()
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Student user mapping not found for student ID: " + event.getStudentId()));

            notificationService.createAndSend(
                    student,
                    "Buổi học của bạn có thay đổi",
                    String.format("Buổi học môn %s đã được dời lịch sang ngày %s lúc %s", 
                            event.getSubject(), event.getNewDate(), event.getNewStartTime()),
                    NotificationType.SESSION_RESCHEDULED
            );
        } catch (Exception e) {
            log.error("Failed to notify student by ID {} for session rescheduling: {}", 
                    event.getStudentId(), e.getMessage());
        }
    }

    /**
     * Handles when a new online live teaching session is created.
     * Notifies both the tutor and the student.
     * 
     * @param event The online session creation details
     */
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleOnlineSessionCreated(OnlineSessionCreatedEvent event) {
        log.info("Processing OnlineSessionCreatedEvent for room: {}", event.getRoomId());
        
        // 1. Notify Student
        try {
                User student = userRepository.findByStudentId(event.getStudentId()).stream()
                        .findFirst()
                        .orElseThrow(() -> new RuntimeException("Student user mapping not found for student ID: " + event.getStudentId()));

                // ADD JOIN URL
                String joinUrl = String.format("https://yourapp.com/room/%s/join", event.getRoomId());
                
                notificationService.createAndSend(
                        student,
                        "Lịch học trực tuyến mới",
                        String.format(
                        "Bạn có một buổi học trực tuyến mới vào lúc %s.\n\n" +
                        "🔗 Tham gia ngay: %s\n\n" +
                        "Room ID: %s", 
                        event.getScheduledStart(), 
                        joinUrl, // Clickable link
                        event.getRoomId()
                        ),
                        NotificationType.ONLINE_SESSION_CREATED
                );
        } catch (Exception e) {
                log.error("Failed to notify student {} for online session {}: {}", 
                        event.getStudentId(), event.getRoomId(), e.getMessage());
        }

        // 2. Notify Tutor
        try {
                User tutor = userRepository.findById(event.getTutorId())
                        .orElseThrow(() -> new RuntimeException("Tutor user not found for ID: " + event.getTutorId()));

                // ADD START URL
                String startUrl = String.format("https://yourapp.com/room/%s/start", event.getRoomId());
                
                notificationService.createAndSend(
                        tutor,
                        "Lịch dạy trực tuyến mới",
                        String.format(
                        "Bạn đã lên lịch một buổi dạy trực tuyến mới cho học sinh %s vào lúc %s.\n\n" +
                        "🔗 Bắt đầu buổi học: %s\n\n" +
                        "Room ID: %s", 
                        event.getStudentName(), 
                        event.getScheduledStart(), 
                        startUrl, // Clickable link
                        event.getRoomId()
                        ),
                        NotificationType.ONLINE_SESSION_CREATED
                );
        } catch (Exception e) {
                log.error("Failed to notify tutor {} for online session {}: {}", 
                        event.getTutorId(), event.getRoomId(), e.getMessage());
        }
    }

    /**
     * Handles when an online session ends.
     * Sends summary notification to both tutor and student.
     * 
     * @param event The session end details
     */
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleOnlineSessionEnded(OnlineSessionEndedEvent event) {
        log.info("Processing OnlineSessionEndedEvent for room: {}", event.getRoomId());

        String summary = String.format("Buổi học đã kết thúc. Thời lượng: %d phút.", event.getDurationMinutes());

        // Notify Student
        if (event.getStudentId() != null) { 
                try {
                User student = userRepository.findById(event.getStudentId())
                        .orElseThrow(() -> new RuntimeException("Student user not found for ID: " + event.getStudentId()));

                notificationService.createAndSend(
                        student,
                        "Buổi học đã kết thúc",
                        summary,
                        NotificationType.ONLINE_SESSION_ENDED
                );
                } catch (Exception e) {
                log.error("Failed to notify student {} for session end {}: {}", 
                        event.getStudentId(), event.getRoomId(), e.getMessage());
                }
        } else {
                log.warn("Cannot notify student for session end {}: studentId is null", event.getRoomId());
        }

        // Notify Tutor
        try {
                User tutor = userRepository.findById(event.getTutorId())
                        .orElseThrow(() -> new RuntimeException("Tutor user not found for ID: " + event.getTutorId()));

                notificationService.createAndSend(
                        tutor,
                        "Kết thúc buổi dạy",
                        summary,
                        NotificationType.ONLINE_SESSION_ENDED
                );
        } catch (Exception e) {
            log.error("Failed to notify tutor {} for session end {}: {}", 
                    event.getTutorId(), event.getRoomId(), e.getMessage());
        }
    }

    /**
     * Handles when a calendar session is converted to an online session.
     * Notifies the student with the join link.
     * 
     * @param event The session conversion details
     */
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleSessionConvertedToOnline(SessionConvertedToOnlineEvent event) {
        log.info("Processing SessionConvertedToOnlineEvent for session: {}", event.getSessionId());
        
        try {
            User student = userRepository.findByStudentId(event.getStudentId()).stream()
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Student user mapping not found for student ID: " + event.getStudentId()));

            // ADD JOIN URL (Using placeholder URL as per existing patterns)
            String joinUrl = String.format("https://yourapp.com/room/%s/join", event.getRoomId());
            
            notificationService.createAndSend(
                    student,
                    "🌐 Buổi học đã chuyển sang online",
                    String.format(
                        "Giảng viên %s đã chuyển buổi học %s ngày %s sang hình thức online.\n\n" +
                        "🔗 Tham gia ngay: %s",
                        event.getTutorName(),
                        event.getSubject(),
                        event.getSessionDate(),
                        joinUrl
                    ),
                    NotificationType.SESSION_CONVERTED_ONLINE
            );
        } catch (Exception e) {
            log.error("Failed to notify student {} for session conversion {}: {}",
                    event.getStudentId(), event.getSessionId(), e.getMessage());
        }
    }

    /**
     * Handles when a TUTOR or STUDENT sends a message in the in-app support chat.
     * Notifies all ADMIN users via SSE so they can see the unread badge update.
     *
     * @param event Details of the new support message
     */
    @EventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleSupportMessageReceived(SupportMessageReceivedEvent event) {
        log.info("Processing SupportMessageReceivedEvent: conversationId={}, sender={}",
                event.getConversationId(), event.getSenderName());

        List<User> admins = userRepository.findByRoleName("ADMIN");
        if (admins.isEmpty()) {
            log.warn("No admin users found to notify for support message in conversation {}", event.getConversationId());
            return;
        }

        String title = "Tin nhắn hỗ trợ mới";
        String content = String.format("[%s] %s: %s",
                event.getSenderRole(), event.getSenderName(), event.getPreviewContent());

        for (User admin : admins) {
            try {
                notificationService.createAndSend(admin, title, content, NotificationType.SUPPORT_MESSAGE);
            } catch (Exception e) {
                log.warn("Failed to notify admin {} for support message: {}", admin.getId(), e.getMessage());
            }
        }
    }
}
