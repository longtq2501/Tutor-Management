package com.tutor_management.backend.modules.schedule.service;

import com.tutor_management.backend.exception.ResourceNotFoundException;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.finance.entity.SessionRecord;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.notification.event.ScheduleCreatedEvent;
import com.tutor_management.backend.modules.notification.event.ScheduleUpdatedEvent;
import com.tutor_management.backend.modules.schedule.dto.request.RecurringScheduleRequest;
import com.tutor_management.backend.modules.schedule.dto.response.RecurringScheduleResponse;
import com.tutor_management.backend.modules.schedule.entity.RecurringSchedule;
import com.tutor_management.backend.modules.schedule.repository.RecurringScheduleRepository;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for managing recurring lesson schedules and auto-generating session records.
 * Orchestrates the translation of weekly slots into monthly attendance logs.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RecurringScheduleService {

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_DATE_TIME;
    private static final String[] DAY_NAMES = { "", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN" };

    private final RecurringScheduleRepository recurringScheduleRepository;
    private final StudentRepository studentRepository;
    private final SessionRecordRepository sessionRecordRepository;
    private final ApplicationEventPublisher eventPublisher;
    
    // Dependencies for isolation
    private final com.tutor_management.backend.modules.auth.UserRepository userRepository;
    private final com.tutor_management.backend.modules.tutor.repository.TutorRepository tutorRepository;

    /**
     * Retrieves all recurring schedules.
     */
    @Transactional(readOnly = true)
    public List<RecurringScheduleResponse> getAllSchedules() {
        Long tutorId = getCurrentTutorId();
        if (tutorId != null) {
            return recurringScheduleRepository.findAllByTutorIdOrderByCreatedAtDesc(tutorId).stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
        }
        return recurringScheduleRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all currently active schedules.
     */
    @Transactional(readOnly = true)
    public List<RecurringScheduleResponse> getActiveSchedules() {
        Long tutorId = getCurrentTutorId();
        if (tutorId != null) {
            return recurringScheduleRepository.findAllActiveByTutorIdWithStudent(tutorId).stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());
        }
        return recurringScheduleRepository.findAllActiveWithStudent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Fetches a specific schedule by ID.
     */
    @Transactional(readOnly = true)
    public RecurringScheduleResponse getScheduleById(Long id) {
        Long tutorId = getCurrentTutorId();
        if (tutorId != null) {
            return recurringScheduleRepository.findByIdAndTutorIdWithStudent(id, tutorId)
                    .map(this::convertToResponse)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch học với ID: " + id));
        }
        return recurringScheduleRepository.findByIdWithStudent(id)
                .map(this::convertToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch học với ID: " + id));
    }

    /**
     * Finds the active schedule for a student.
     */
    @Transactional(readOnly = true)
    public RecurringScheduleResponse getScheduleByStudentId(Long studentId) {
        Long tutorId = getCurrentTutorId();
        if (tutorId != null) {
            return recurringScheduleRepository.findByStudentIdAndTutorIdAndActiveTrueOrderByCreatedAtDesc(studentId, tutorId)
                    .map(this::convertToResponse)
                    .orElseThrow(() -> new ResourceNotFoundException("Học sinh chưa có lịch học cố định hoặc bạn không có quyền truy cập."));
        }
        return recurringScheduleRepository.findByStudentIdAndActiveTrueOrderByCreatedAtDesc(studentId)
                .map(this::convertToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Học sinh chưa có lịch học cố định."));
    }

    /**
     * Creates a new schedule and deactivates any existing ones for the student.
     */
    @Transactional
    public RecurringScheduleResponse createSchedule(RecurringScheduleRequest request, String tutorName) {
        log.info("Creating schedule for student ID: {}", request.getStudentId());
        
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));
        
        Long tutorId = getCurrentTutorId();
        if (tutorId != null && !student.getTutorId().equals(tutorId)) {
             throw new RuntimeException("Không có quyền tạo lịch học cho học sinh này");
        }

        deactivateExistingSchedules(request.getStudentId());

        RecurringSchedule schedule = RecurringSchedule.builder()
                .student(student)
                .startTime(LocalTime.parse(request.getStartTime()))
                .endTime(LocalTime.parse(request.getEndTime()))
                .hoursPerSession(request.getHoursPerSession())
                .startMonth(request.getStartMonth())
                .endMonth(request.getEndMonth())
                .active(request.getActive() != null ? request.getActive() : true)
                .notes(request.getNotes())
                .subject(request.getSubject())
                .build();

        schedule.setDaysOfWeekArray(request.getDaysOfWeek());
        RecurringSchedule saved = recurringScheduleRepository.save(schedule);
        
        publishEvent(new ScheduleCreatedEvent(saved.getId(), student.getId().toString(), student.getName(), tutorName, 
                saved.getSubject(), formatDaysOfWeek(saved.getDaysOfWeekArray()), saved.getStartTime()));

        updateStudentScheduleString(student.getId());

        return convertToResponse(saved);
    }

    /**
     * Updates an existing schedule.
     */
    @Transactional
    public RecurringScheduleResponse updateSchedule(Long id, RecurringScheduleRequest request) {
        log.info("Updating schedule ID: {}", id);
        
        RecurringSchedule schedule = recurringScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch học"));

        applyRequestToEntity(schedule, request);
        RecurringSchedule updated = recurringScheduleRepository.save(schedule);
        
        publishEvent(new ScheduleUpdatedEvent(updated.getId(), updated.getStudent().getId().toString(), 
                updated.getStudent().getName(), "Giáo viên", updated.getSubject(), 
                formatDaysOfWeek(updated.getDaysOfWeekArray()), updated.getStartTime()));

        updateStudentScheduleString(updated.getStudent().getId());

        return convertToResponse(updated);
    }

    /**
     * Removes a schedule record.
     */
    @Transactional
    public void deleteSchedule(Long id) {
        Long tutorId = getCurrentTutorId();
        RecurringSchedule schedule;
        
        if (tutorId != null) {
            schedule = recurringScheduleRepository.findByIdAndTutorIdWithStudent(id, tutorId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch học hoặc bạn không có quyền truy cập"));
        } else {
            if (!recurringScheduleRepository.existsById(id)) {
                throw new ResourceNotFoundException("Không tìm thấy lịch học cần xóa");
            }
            // Need to fetch entity to delete properly if passing object, or just invoke deleteById
            // For consistency with other methods and cascading if any, fetch first
            schedule = recurringScheduleRepository.findById(id).orElseThrow();
        }
        Long stuId = schedule.getStudent().getId();
        recurringScheduleRepository.delete(schedule);
        updateStudentScheduleString(stuId);
    }

    /**
     * Toggles the active status of a schedule.
     */
    @Transactional
    public RecurringScheduleResponse toggleActive(Long id) {
        Long tutorId = getCurrentTutorId();
        RecurringSchedule schedule;
        
        if (tutorId != null) {
            schedule = recurringScheduleRepository.findByIdAndTutorIdWithStudent(id, tutorId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch học hoặc bạn không có quyền truy cập"));
        } else {
            schedule = recurringScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch học"));
        }
        schedule.setActive(!schedule.getActive());
        RecurringSchedule saved = recurringScheduleRepository.save(schedule);
        updateStudentScheduleString(saved.getStudent().getId());
        return convertToResponse(saved);
    }

    // --- Session Generation Logic ---

    /**
     * Generates session records for a given month based on active schedules.
     */
    @Transactional
    public int generateSessionsForMonth(String month, List<Long> studentIds) {
        List<RecurringSchedule> schedules = getTargetSchedules(studentIds);
        if (schedules.isEmpty()) return 0;

        Set<String> existingLookup = buildExistingSessionLookup(month, schedules);
        List<SessionRecord> toSave = new ArrayList<>();

        for (RecurringSchedule schedule : schedules) {
            if (isApplicable(schedule, month)) {
                toSave.addAll(generateDatesForSchedule(schedule, month, existingLookup));
            }
        }

        if (!toSave.isEmpty()) {
            sessionRecordRepository.saveAll(toSave);
            log.info("Successfully generated {} sessions for {}", toSave.size(), month);
            return toSave.size();
        }
        return 0;
    }

    @Transactional(readOnly = true)
    public boolean hasSessionsForMonth(String month, Long studentId) {
        return !sessionRecordRepository.findByMonthAndStudentIdIn(month,
                studentId != null ? List.of(studentId) : Collections.emptyList()).isEmpty();
    }

    @Transactional(readOnly = true)
    public int countSessionsToGenerate(String month, List<Long> studentIds) {
        return getTargetSchedules(studentIds).stream()
                .filter(s -> isApplicable(s, month))
                .mapToInt(s -> countOccurrences(s.getDaysOfWeekArray(), month))
                .sum();
    }

    // --- Internal Helpers ---



    private Long getCurrentTutorId() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        String email = auth.getName();
        
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        if ("ADMIN".equals(user.getRole().getName())) {
            return null;
        }
        
        com.tutor_management.backend.modules.tutor.entity.Tutor tutor = tutorRepository.findByUserId(user.getId())
            .orElseThrow(() -> new RuntimeException("Tutor profile not found for user: " + user.getId()));
        
        return tutor.getId();
    }

    private void deactivateExistingSchedules(Long studentId) {
        Long tutorId = getCurrentTutorId();
        List<RecurringSchedule> active;
        
        if (tutorId != null) {
             active = recurringScheduleRepository.findByStudentIdAndTutorIdAndActiveTrue(studentId, tutorId);
        } else {
             active = recurringScheduleRepository.findByStudentIdAndActiveTrue(studentId);
        }
        
        active.forEach(s -> s.setActive(false));
        recurringScheduleRepository.saveAll(active);
        // We do not call updateStudentScheduleString here because this is called within createSchedule
        // Which will call updateStudentScheduleString at the end.
    }

    private void applyRequestToEntity(RecurringSchedule entity, RecurringScheduleRequest request) {
        entity.setDaysOfWeekArray(request.getDaysOfWeek());
        entity.setStartTime(LocalTime.parse(request.getStartTime()));
        entity.setEndTime(LocalTime.parse(request.getEndTime()));
        entity.setHoursPerSession(request.getHoursPerSession());
        entity.setStartMonth(request.getStartMonth());
        entity.setEndMonth(request.getEndMonth());
        if (request.getActive() != null) entity.setActive(request.getActive());
        if (request.getNotes() != null) entity.setNotes(request.getNotes());
        if (request.getSubject() != null) entity.setSubject(request.getSubject());
    }

    private List<RecurringSchedule> getTargetSchedules(List<Long> studentIds) {
        Long tutorId = getCurrentTutorId();
        List<RecurringSchedule> allActive;
        
        if (tutorId != null) {
            allActive = recurringScheduleRepository.findAllActiveByTutorIdWithStudent(tutorId);
        } else {
            allActive = recurringScheduleRepository.findAllActiveWithStudent();
        }
        
        if (studentIds == null) return allActive;
        if (studentIds.isEmpty()) return Collections.emptyList();
        return allActive.stream().filter(s -> studentIds.contains(s.getStudent().getId())).toList();
    }

    private void updateStudentScheduleString(Long studentId) {
        Long tutorId = getCurrentTutorId();
        List<RecurringSchedule> activeSchedules;
        if (tutorId != null) {
            activeSchedules = recurringScheduleRepository.findByStudentIdAndTutorIdAndActiveTrue(studentId, tutorId);
        } else {
            activeSchedules = recurringScheduleRepository.findByStudentIdAndActiveTrue(studentId);
        }
        
        String formatted = formatSchedulesForStudent(activeSchedules);
        studentRepository.findById(studentId).ifPresent(student -> {
            student.setSchedule(formatted.isEmpty() ? "Chưa có lịch cố định" : formatted);
            studentRepository.save(student);
        });
    }

    private String formatSchedulesForStudent(List<RecurringSchedule> schedules) {
        if (schedules == null || schedules.isEmpty()) return "";
        return schedules.stream()
                .map(s -> {
                    String days = Arrays.stream(s.getDaysOfWeekArray())
                        .sorted()
                        .map(d -> d == 8 ? "CN" : "T" + d)
                        .collect(Collectors.joining(", "));
                    return days + " (" + s.getStartTime() + " - " + s.getEndTime() + ")";
                })
                .collect(Collectors.joining(" | "));
    }

    private boolean isApplicable(RecurringSchedule s, String month) {
        return s.getStartMonth().compareTo(month) <= 0 && 
               (s.getEndMonth() == null || s.getEndMonth().compareTo(month) >= 0);
    }

    private List<SessionRecord> generateDatesForSchedule(RecurringSchedule s, String month, Set<String> lookup) {
        List<SessionRecord> sessions = new ArrayList<>();
        YearMonth ym = YearMonth.parse(month);
        LocalDate start = ym.atDay(1);
        LocalDate end = ym.atEndOfMonth();

        for (int day : s.getDaysOfWeekArray()) {
            LocalDate date = start.with(TemporalAdjusters.nextOrSame(DayOfWeek.of(day)));
            while (!date.isAfter(end)) {
                String key = s.getStudent().getId() + "_" + date;
                if (!lookup.contains(key)) {
                    sessions.add(createSessionRecord(s, date, month));
                    lookup.add(key);
                }
                date = date.plusWeeks(1);
            }
        }
        return sessions;
    }

    private SessionRecord createSessionRecord(RecurringSchedule s, LocalDate date, String month) {
        Student std = s.getStudent();
        return SessionRecord.builder()
                .student(std).tutorId(std.getTutorId()).month(month).sessions(1).hours(s.getHoursPerSession())
                .pricePerHour(std.getPricePerHour()).totalAmount((long)(std.getPricePerHour() * s.getHoursPerSession()))
                .paid(false).sessionDate(date).startTime(s.getStartTime()).endTime(s.getEndTime())
                .subject(s.getSubject()).status(com.tutor_management.backend.modules.finance.LessonStatus.SCHEDULED)
                .notes("Tự động tạo từ lịch học cố định").build();
    }

    private Set<String> buildExistingSessionLookup(String month, List<RecurringSchedule> schedules) {
        List<Long> ids = schedules.stream().map(s -> s.getStudent().getId()).distinct().toList();
        return sessionRecordRepository.findByMonthAndStudentIdIn(month, ids).stream()
                .map(r -> r.getStudent().getId() + "_" + r.getSessionDate())
                .collect(Collectors.toSet());
    }

    private int countOccurrences(Integer[] days, String month) {
        int count = 0;
        YearMonth ym = YearMonth.parse(month);
        for (int day : days) {
            LocalDate d = ym.atDay(1).with(TemporalAdjusters.nextOrSame(DayOfWeek.of(day)));
            while (!d.isAfter(ym.atEndOfMonth())) { count++; d = d.plusWeeks(1); }
        }
        return count;
    }

    private void publishEvent(Object event) {
        try { eventPublisher.publishEvent(event); }
        catch (Exception e) { log.error("Failed to publish schedule event: {}", e.getMessage()); }
    }

    private String formatDaysOfWeek(Integer[] days) {
        if (days == null || days.length == 0) return "";
        return Arrays.stream(days).map(d -> DAY_NAMES[d]).collect(Collectors.joining(", "));
    }

    private RecurringScheduleResponse convertToResponse(RecurringSchedule s) {
        return RecurringScheduleResponse.builder()
                .id(s.getId()).studentId(s.getStudent().getId()).studentName(s.getStudent().getName())
                .daysOfWeek(s.getDaysOfWeekArray()).daysOfWeekDisplay(formatDaysOfWeek(s.getDaysOfWeekArray()))
                .startTime(s.getStartTime().toString()).endTime(s.getEndTime().toString())
                .timeRange(s.getStartTime() + " - " + s.getEndTime()).hoursPerSession(s.getHoursPerSession())
                .startMonth(s.getStartMonth()).endMonth(s.getEndMonth()).active(s.getActive()).notes(s.getNotes())
                .subject(s.getSubject()).createdAt(s.getCreatedAt().format(ISO_FORMATTER))
                .updatedAt(s.getUpdatedAt().format(ISO_FORMATTER)).build();
    }
}
