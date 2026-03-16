package com.tutor_management.backend.modules.finance.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import com.tutor_management.backend.modules.document.repository.DocumentRepository;
import com.tutor_management.backend.modules.document.entity.Document;
import com.tutor_management.backend.modules.finance.LessonStatus;
import com.tutor_management.backend.modules.finance.entity.SessionRecord;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.finance.StatusTransitionValidator;
import com.tutor_management.backend.modules.lesson.repository.LessonRepository;
import com.tutor_management.backend.modules.lesson.entity.Lesson;
import com.tutor_management.backend.modules.onlinesession.repository.OnlineSessionRepository;
import com.tutor_management.backend.modules.tutor.entity.Tutor;
import com.tutor_management.backend.modules.tutor.repository.TutorRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tutor_management.backend.modules.finance.dto.request.SessionRecordRequest;
import com.tutor_management.backend.modules.finance.dto.request.SessionRecordUpdateRequest;
import com.tutor_management.backend.modules.finance.dto.response.SessionRecordResponse;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import com.tutor_management.backend.modules.notification.event.SessionCreatedEvent;
import com.tutor_management.backend.modules.notification.event.SessionRescheduledEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.cache.annotation.CacheEvict;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Standard implementation for managing {@link SessionRecord} lifecycle.
 * Handles accounting, scheduling, and student notifications for individual lessons.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class SessionRecordService {

    private final SessionRecordRepository sessionRecordRepository;
    private final StudentRepository studentRepository;
    private final DocumentRepository documentRepository;
    private final LessonRepository lessonRepository;
    private final StatusTransitionValidator statusTransitionValidator;
    private final ApplicationEventPublisher eventPublisher;
    
    // Dependencies for isolation
    private final com.tutor_management.backend.modules.auth.UserRepository userRepository;
    private final TutorRepository tutorRepository;
    private final OnlineSessionRepository onlineSessionRepository;
    private final com.tutor_management.backend.modules.admin.service.AdminStatsService adminStatsService;

    private final DateTimeFormatter isoFormatter = DateTimeFormatter.ISO_DATE_TIME;
    private final DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

    private Long getCurrentTutorId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;

        return userRepository.findByEmail(auth.getName())
                .flatMap(user -> {
                    if ("TUTOR".equals(user.getRole().getName())) {
                        return tutorRepository.findByUserId(user.getId()).map(Tutor::getId);
                    }
                    return Optional.empty();
                })
                .orElse(null);
    }

    /**
     * Retrieves all session records ordered by creation date (newest first).
     * 
     * @return List of all session records in the system.
     */
    /**
     * Retrieves session records with flexible filtering options.
     */
    @Transactional(readOnly = true)
    public Page<SessionRecordResponse> getAllRecordsFiltered(String search, String month, Boolean paid, Pageable pageable) {
        Long tutorId = getCurrentTutorId();
        return sessionRecordRepository.findWithFilters(search, month, paid, tutorId, pageable)
                .map(this::mapToListResponse);
    }

    /**
     * Retrieves all session records for all students, filtered by current tutor if applicable.
     */
    @Transactional(readOnly = true)
    public Page<SessionRecordResponse> getAllRecords(Pageable pageable) {
        Long tutorId = getCurrentTutorId();
        if (tutorId != null) {
            return sessionRecordRepository.findAllByTutorIdOrderByCreatedAtDesc(tutorId, pageable)
                    .map(this::mapToListResponse);
        }
        return sessionRecordRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToListResponse);
    }

    /**
     * Retrieves all session records for a specific billing month.
     * 
     * @param month The billing month in YYYY-MM format.
     * @return List of session records for the specified month.
     */
    @Transactional(readOnly = true)
    public Page<SessionRecordResponse> getRecordsByMonth(String month, Pageable pageable) {
        Long tutorId = getCurrentTutorId();
        if (tutorId != null) {
            return sessionRecordRepository.findByMonthAndTutorIdOrderByCreatedAtDesc(month, tutorId, pageable)
                    .map(this::mapToListResponse);
        }
        return sessionRecordRepository.findByMonthOrderByCreatedAtDesc(month, pageable)
                .map(this::mapToListResponse);
    }

    /**
     * Retrieves all distinct billing months that have session records.
     * Useful for populating month filter dropdowns in the UI.
     * 
     * @return List of month strings in YYYY-MM format, ordered by month descending.
     */
    @Transactional(readOnly = true)
    public List<String> getDistinctMonths() {
        Long tutorId = getCurrentTutorId();
        if (tutorId != null) {
            return sessionRecordRepository.findDistinctMonthsByTutorId(tutorId);
        }
        return sessionRecordRepository.findDistinctMonths();
    }

    /**
     * Creates a new session record with automatic price calculation and resource attachment.
     * Publishes a {@link SessionCreatedEvent} for student notifications.
     * 
     * @param r The session creation request containing student, date, and subject details.
     * @return The created session record with full details.
     * @throws RuntimeException if the student is not found.
     */
    @CacheEvict(value = {"dashboardStats", "monthlyStats"}, allEntries = true)
    public SessionRecordResponse createRecord(SessionRecordRequest r) {
        log.info("🗓️ Creating session record for student {} on {}", r.getStudentId(), r.getSessionDate());
        
        Student student = studentRepository.findById(r.getStudentId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học sinh"));
        
        Long currentTutorId = getCurrentTutorId();
        if (currentTutorId != null) {
            // Verify student belongs to this tutor
            if (!student.getTutorId().equals(currentTutorId)) {
                 throw new RuntimeException("Không có quyền tạo buổi học cho học sinh này");
            }
        }

        double hours = r.getHoursPerSession() * r.getSessions();
        long amount = (long) (hours * student.getPricePerHour());

        LocalDate sessionDate = LocalDate.parse(r.getSessionDate());
        String month = sessionDate.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        SessionRecord record = SessionRecord.builder()
                .student(student)
                .tutorId(student.getTutorId()) // Explicitly set tutorId from student
                .month(month)
                .sessions(r.getSessions())
                .hours(hours)
                .pricePerHour(student.getPricePerHour())
                .totalAmount(amount)
                .paid(false)
                .notes(r.getNotes())
                .sessionDate(sessionDate)
                .startTime(parseTime(r.getStartTime()))
                .endTime(parseTime(r.getEndTime()))
                .subject(r.getSubject())
                .status(parseStatus(r.getStatus()))
                .build();

        attachResources(record, r.getDocumentIds(), r.getLessonIds());
        SessionRecord saved = sessionRecordRepository.saveAndFlush(record);
        
        publishCreatedEvent(saved);
        return mapToFullResponse(saved);
    }

    /**
     * Updates an existing session record with optimistic locking support.
     * Recalculates hours and amounts when session count or time changes.
     * Publishes a {@link SessionRescheduledEvent} for student notifications.
     * 
     * @param id The session record ID to update.
     * @param r The update request with modified fields.
     * @return The updated session record.
     * @throws RuntimeException if the record is not found or version conflict occurs.
     */
    @CacheEvict(value = {"dashboardStats", "monthlyStats"}, allEntries = true)
    public SessionRecordResponse updateRecord(Long id, SessionRecordUpdateRequest r) {
        log.info("📝 Updating session record: {}", id);
        
        SessionRecord record;
        Long tutorId = getCurrentTutorId();
        
        if (tutorId != null) {
            record = sessionRecordRepository.findByIdAndTutorId(id, tutorId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi buổi học hoặc bạn không có quyền truy cập"));
        } else {
             record = sessionRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi buổi học"));
        }

        log.info("Checking version for Session {}: DB={}, Request={}", id, record.getVersion(), r.getVersion());
        checkVersion(record, r.getVersion());

        if (r.getSessionDate() != null) {
            record.setSessionDate(LocalDate.parse(r.getSessionDate()));
            syncMonthWithDate(record);
        } else if (r.getMonth() != null) {
            record.setMonth(r.getMonth());
        }
        if (r.getNotes() != null) record.setNotes(r.getNotes());
        
        if (r.getSessions() != null) {
            record.setSessions(r.getSessions());
            double ratio = Optional.ofNullable(r.getHoursPerSession()).orElse(record.getHours() / record.getSessions());
            record.setHours(r.getSessions() * ratio);
            record.setTotalAmount((long) (record.getHours() * record.getPricePerHour()));
        }

        if (r.getStartTime() != null) record.setStartTime(parseTime(r.getStartTime()));
        if (r.getEndTime() != null) record.setEndTime(parseTime(r.getEndTime()));

        recalculateHoursFromTime(record);

        if (r.getSubject() != null) record.setSubject(r.getSubject());
        if (r.getStatus() != null) applyStatusChange(record, LessonStatus.valueOf(r.getStatus()));

        attachResources(record, r.getDocumentIds(), r.getLessonIds());

        SessionRecord updated = sessionRecordRepository.saveAndFlush(record);
        publishRescheduledEvent(updated);
        
        return mapToFullResponse(updated);
    }

    /**
     * Permanently removes a session record from the system.
     * 
     * @param id The session record ID to delete.
     * @throws RuntimeException if the record is not found.
     */
    @CacheEvict(value = {"dashboardStats", "monthlyStats"}, allEntries = true)
    public void deleteRecord(Long id) {
        Long tutorId = getCurrentTutorId();
        SessionRecord record;
        
        if (tutorId != null) {
             record = sessionRecordRepository.findByIdAndTutorId(id, tutorId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi buổi học hoặc bạn không có quyền truy cập"));
        } else {
             record = sessionRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi buổi học"));
        }
        sessionRecordRepository.delete(record);
    }

    /**
     * Deletes all session records for a specific billing month.
     * Use with caution - this is a bulk deletion operation.
     * 
     * @param month The billing month in YYYY-MM format.
     */
    @CacheEvict(value = {"dashboardStats", "monthlyStats"}, allEntries = true)
    public void deleteSessionsByMonth(String month) {
        Long tutorId = getCurrentTutorId();
        if (tutorId != null) {
            log.warn("⚠️ Deleting sessions for month: {} for tutor: {}", month, tutorId);
            sessionRecordRepository.deleteByMonthAndTutorId(month, tutorId);
        } else {
            log.warn("⚠️ Deleting all sessions for month: {} (ADMIN)", month);
            sessionRecordRepository.deleteByMonth(month);
        }
    }

    /**
     * Retrieves all unpaid session records ordered by session date (newest first).
     * Useful for generating payment reminders and financial reports.
     * 
     * @return List of unpaid session records.
     */
    @Transactional(readOnly = true)
    public Page<SessionRecordResponse> getAllUnpaidSessions(Pageable pageable, Boolean taughtOnly) {
        Long tutorId = getCurrentTutorId();
        boolean onlyTaught = Boolean.TRUE.equals(taughtOnly);

        if (tutorId != null) {
            if (onlyTaught) {
                return sessionRecordRepository
                        .findByPaidFalseAndTutorIdAndStatusInOrderBySessionDateDesc(tutorId, pageable)
                        .map(this::mapToListResponse);
            }
            return sessionRecordRepository.findByPaidFalseAndTutorIdOrderBySessionDateDesc(tutorId, pageable)
                    .map(this::mapToListResponse);
        }

        if (onlyTaught) {
            return sessionRecordRepository
                    .findByPaidFalseAndStatusInOrderBySessionDateDesc(pageable)
                    .map(this::mapToListResponse);
        }
        return sessionRecordRepository.findByPaidFalseOrderBySessionDateDesc(pageable)
                .map(this::mapToListResponse);
    }

    /**
     * Toggles the payment status of a session record.
     * Automatically updates the status to PAID or COMPLETED and manages timestamps.
     * 
     * @param id The session record ID.
     * @param version The current version for optimistic locking.
     * @return The updated session record.
     * @throws RuntimeException if the record is not found or version conflict occurs.
     */
    @CacheEvict(value = {"dashboardStats", "monthlyStats"}, allEntries = true)
    public SessionRecordResponse togglePayment(Long id, Integer version) {
        Long tutorId = getCurrentTutorId();
        SessionRecord record;
        
        if (tutorId != null) {
             record = sessionRecordRepository.findByIdAndTutorId(id, tutorId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi buổi học hoặc bạn không có quyền truy cập"));
        } else {
             record = sessionRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy bản ghi buổi học"));
        }
        checkVersion(record, version);

        if (!record.getPaid()) {
            applyStatusChange(record, LessonStatus.PAID);
        } else {
            applyStatusChange(record, LessonStatus.COMPLETED);
            record.setPaid(false);
            record.setPaidAt(null);
        }

        return mapToFullResponse(sessionRecordRepository.saveAndFlush(record));
    }

    /**
     * Creates a duplicate of an existing session record.
     * Useful for quickly creating similar sessions without re-entering all data.
     * The new session will have a new ID and creation timestamp.
     * 
     * @param id The ID of the session to duplicate.
     * @return The newly created duplicate session record.
     * @throws RuntimeException if the original session is not found.
     */
    @CacheEvict(value = {"dashboardStats", "monthlyStats"}, allEntries = true)
    public SessionRecordResponse duplicateSession(Long id) {
        log.info("📋 Duplicating session record: {}", id);

        Long tutorId = getCurrentTutorId();
        SessionRecord original;

        if (tutorId != null) {
             original = sessionRecordRepository.findByIdAndTutorIdWithAttachments(id, tutorId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học với ID: " + id));
        } else {
             original = sessionRecordRepository.findByIdWithAttachments(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học với ID: " + id));
        }

        // Create a new session with the same data
        SessionRecord duplicate = SessionRecord.builder()
                .student(original.getStudent())
                .tutorId(original.getTutorId()) // Copy tutorId
                .month(original.getMonth())
                .sessions(original.getSessions())
                .hours(original.getHours())
                .pricePerHour(original.getPricePerHour())
                .totalAmount(original.getTotalAmount())
                .paid(false)  // New session starts as unpaid
                .notes(original.getNotes())
                .sessionDate(original.getSessionDate())
                .startTime(original.getStartTime())
                .endTime(original.getEndTime())
                .subject(original.getSubject())
                .status(LessonStatus.SCHEDULED)  // New session starts as scheduled
                .documents(new HashSet<>(original.getDocuments()))
                .lessons(new HashSet<>(original.getLessons()))
                .build();

        SessionRecord saved = sessionRecordRepository.save(duplicate);
        return mapToFullResponse(saved);
    }

    /**
     * Retrieves all session records for a specific student.
     * 
     * @param studentId The student's unique identifier.
     * @return List of session records for the student.
     */
    @Transactional(readOnly = true)
    public Page<SessionRecordResponse> getRecordsByStudentId(Long studentId, Pageable pageable) {
        return sessionRecordRepository.findByStudentIdOrderByCreatedAtDesc(studentId, pageable)
                .map(this::mapToListResponse);
    }

    /**
     * Retrieves session records for a specific student and billing month.
     * 
     * @param studentId The student's unique identifier.
     * @param month The billing month in YYYY-MM format.
     * @return List of session records matching the criteria.
     * @throws RuntimeException if the student is not found.
     */
    @Transactional(readOnly = true)
    public List<SessionRecordResponse> getRecordsByStudentIdAndMonth(Long studentId, String month) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học sinh"));

        Long tutorId = getCurrentTutorId();
        if (tutorId != null && !student.getTutorId().equals(tutorId)) {
             throw new RuntimeException("Không có quyền truy cập dữ liệu của học sinh này");
        }

        return sessionRecordRepository.findByStudentAndMonthFilteredOrderByDateAsc(student, month).stream()
                .map(this::mapToFullResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a single session record with all attached documents and lessons.
     * 
     * @param id The session record ID.
     * @return The complete session record with attachments.
     * @throws RuntimeException if the record is not found.
     */
    @Transactional(readOnly = true)
    public SessionRecordResponse getSessionById(Long id) {
        Long tutorId = getCurrentTutorId();
        SessionRecord record;

        if (tutorId != null) {
             record = sessionRecordRepository.findByIdAndTutorIdWithAttachments(id, tutorId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học với ID: " + id));
        } else {
             record = sessionRecordRepository.findByIdWithAttachments(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học với ID: " + id));
        }
        return mapToFullResponse(record);
    }

    /**
     * Specialized status update with validation and optimistic locking.
     */
    @CacheEvict(value = {"dashboardStats", "monthlyStats"}, allEntries = true)
    public SessionRecordResponse updateStatus(Long id, LessonStatus next, Integer version) {
        Long tutorId = getCurrentTutorId();
        SessionRecord record;
        
        if (tutorId != null) {
             record = sessionRecordRepository.findByIdAndTutorId(id, tutorId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học với ID: " + id));
        } else {
             record = sessionRecordRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy buổi học với ID: " + id));
        }

        checkVersion(record, version);
        statusTransitionValidator.validate(record.getStatus(), next);
        
        applyStatusChange(record, next);
        SessionRecord updated = sessionRecordRepository.saveAndFlush(record);
        
        publishRescheduledEvent(updated);
        return mapToFullResponse(updated);
    }

    // --- Private Helpers ---

    private void applyStatusChange(SessionRecord record, LessonStatus next) {
        record.setStatus(next);
        if (next == LessonStatus.PAID) {
            record.setPaid(true);
            record.setCompleted(true);
            if (record.getPaidAt() == null) record.setPaidAt(LocalDateTime.now());

            // Log administrative activity
            adminStatsService.logActivity(
                    "PAYMENT_CONFIRMED",
                    record.getStudent().getName(),
                    "SYSTEM",
                    "Thanh toán thành công cho buổi học: " + record.getSubject() + " (Tháng " + record.getMonth() + ")"
            );
        } else if (next == LessonStatus.COMPLETED || next == LessonStatus.PENDING_PAYMENT) {
            record.setCompleted(true);
        }
    }

    private void recalculateHoursFromTime(SessionRecord r) {
        if (r.getStartTime() != null && r.getEndTime() != null) {
            java.time.Duration d = java.time.Duration.between(r.getStartTime(), r.getEndTime());
            if (d.isNegative()) d = d.plusDays(1);
            double h = d.toMinutes() / 60.0;
            if (h > 0) {
                r.setHours(h);
                r.setTotalAmount((long) (h * r.getPricePerHour()));
            }
        }
    }

    /**
     * Ensures the billing month is synchronized with the actual session date.
     */
    private void syncMonthWithDate(SessionRecord r) {
        if (r.getSessionDate() != null) {
            String derivedMonth = r.getSessionDate().format(DateTimeFormatter.ofPattern("yyyy-MM"));
            if (r.getMonth() == null || !r.getMonth().equals(derivedMonth)) {
                log.info("🔄 Syncing month for session {}: {} -> {}", r.getId(), r.getMonth(), derivedMonth);
                r.setMonth(derivedMonth);
            }
        }
    }

    private void attachResources(SessionRecord r, List<Long> docIds, List<Long> lesIds) {
        if (docIds != null) {
            r.setDocuments(new HashSet<>(documentRepository.findAllById(docIds)));
        }
        if (lesIds != null) {
            r.setLessons(new HashSet<>(lessonRepository.findAllById(lesIds)));
        }
    }

    private void checkVersion(SessionRecord r, Integer version) {
        if (version != null && !r.getVersion().equals(version)) {
            throw new RuntimeException("Dữ liệu đã bị thay đổi bởi người dùng khác. Vui lòng tải lại trang.");
        }
    }

    private LocalTime parseTime(String t) {
        return (t == null || t.isEmpty()) ? null : LocalTime.parse(t);
    }

    private LessonStatus parseStatus(String s) {
        return (s == null || s.isEmpty()) ? LessonStatus.SCHEDULED : LessonStatus.valueOf(s);
    }

    private void publishCreatedEvent(SessionRecord s) {
        try {
            eventPublisher.publishEvent(SessionCreatedEvent.builder()
                .sessionId(s.getId()).studentId(s.getStudent().getId()).tutorName("Giáo viên")
                .subject(s.getSubject()).sessionDate(s.getSessionDate()).startTime(s.getStartTime())
                .build());
        } catch (Exception e) { log.error("Failed to publish SessionCreatedEvent", e); }
    }

    private void publishRescheduledEvent(SessionRecord s) {
        try {
            eventPublisher.publishEvent(SessionRescheduledEvent.builder()
                .sessionId(s.getId()).studentId(s.getStudent().getId()).tutorName("Giáo viên")
                .subject(s.getSubject()).newDate(s.getSessionDate()).newStartTime(s.getStartTime())
                .build());
        } catch (Exception e) { log.error("Failed to publish SessionRescheduledEvent", e); }
    }

    // --- Mappers ---

    private SessionRecordResponse mapToListResponse(SessionRecord r) {
        return mapToResponse(r, true);
    }

    private SessionRecordResponse mapToFullResponse(SessionRecord r) {
        return mapToResponse(r, false);
    }

    private SessionRecordResponse mapToResponse(SessionRecord r, boolean lightweight) {
        SessionRecordResponse.SessionRecordResponseBuilder b = SessionRecordResponse.builder()
            .id(r.getId()).studentId(r.getStudent().getId()).studentName(r.getStudent().getName())
            .month(r.getMonth()).sessions(r.getSessions()).hours(r.getHours())
            .pricePerHour(r.getPricePerHour()).totalAmount(r.getTotalAmount())
            .paid(r.getPaid()).paidAt(formatDateTime(r.getPaidAt())).notes(r.getNotes())
            .sessionDate(r.getSessionDate().toString()).createdAt(formatDateTime(r.getCreatedAt()))
            .completed(r.getCompleted()).startTime(formatTime(r.getStartTime()))
            .endTime(formatTime(r.getEndTime())).subject(r.getSubject())
            .status(r.getStatus() != null ? r.getStatus().name() : null).version(r.getVersion())
            .sessionNumber(r.getTutorId() != null && r.getStatus() != null && r.getStatus() != LessonStatus.CANCELLED_BY_STUDENT && r.getStatus() != LessonStatus.CANCELLED_BY_TUTOR ? sessionRecordRepository.calculateSessionNumberForTutor(r.getTutorId(), r.getSessionDate(), r.getId()) : null)
            .isOnline(onlineSessionRepository.existsBySessionRecordId(r.getId()))
            .tutorId(r.getTutorId())
            .tutorName("N/A");

        if (lightweight) {
            b.documents(Collections.emptyList()).lessons(Collections.emptyList());
        } else {
            b.documents(r.getDocuments().stream().map(this::mapDoc).toList());
            b.lessons(r.getLessons().stream().map(this::mapLesson).toList());
        }
        return b.build();
    }

    private String formatDateTime(LocalDateTime dt) {
        return dt != null ? dt.format(isoFormatter) : null;
    }

    private String formatTime(LocalTime t) {
        return t != null ? t.format(timeFormatter) : null;
    }

    private SessionRecordResponse.DocumentDTO mapDoc(Document d) {
        return SessionRecordResponse.DocumentDTO.builder()
            .id(d.getId()).title(d.getTitle()).fileName(d.getFileName())
            .fileType(d.getFileType()).fileSize(d.getFileSize()).filePath(d.getFilePath())
            .build();
    }

    private SessionRecordResponse.LessonDTO mapLesson(Lesson l) {
        return SessionRecordResponse.LessonDTO.builder()
            .id(l.getId()).title(l.getTitle()).summary(l.getSummary())
            .thumbnailUrl(l.getThumbnailUrl()).durationMinutes(l.getDurationMinutes())
            .isPublished(l.getIsPublished())
            .build();
    }
}
