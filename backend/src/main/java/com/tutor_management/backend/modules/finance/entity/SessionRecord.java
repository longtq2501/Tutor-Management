package com.tutor_management.backend.modules.finance.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

import com.tutor_management.backend.modules.finance.LessonStatus;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.lesson.entity.Lesson;
import com.tutor_management.backend.modules.document.entity.Document;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;

/**
 * Domain entity representing an individual tutoring session record.
 * Tracks teaching hours, pricing, subjects, and payment status.
 * Supports linking to {@link Lesson} materials and {@link Document} resources.
 */
@Entity
@Table(name = "session_records", indexes = {
        @Index(name = "idx_session_student_id", columnList = "student_id"),
        @Index(name = "idx_session_month", columnList = "month"),
        @Index(name = "idx_session_student_month", columnList = "student_id, month"),
        @Index(name = "idx_session_date", columnList = "sessionDate"),
        @Index(name = "idx_session_status", columnList = "status"),
        @Index(name = "idx_session_tutor_month_paid", columnList = "tutor_id, month, paid")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"lessons", "documents", "student"})
public class SessionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Foreign key to owning Tutor (multi-tenancy).
     */
    @Column(name = "tutor_id", nullable = false)
    private Long tutorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    /**
     * Billing month in format YYYY-MM.
     */
    @Column(nullable = false)
    private String month;

    /**
     * Number of sessions (usually 1 per record).
     */
    @Column(nullable = false)
    private Integer sessions;

    /**
     * Duration of the session in decimal hours.
     */
    @Column(nullable = false)
    private Double hours;

    @Column(nullable = false)
    private Long pricePerHour;

    @Column(nullable = false)
    private Long totalAmount;

    @Column(nullable = false)
    private Boolean paid;

    private LocalDateTime paidAt;

    @Column(length = 1000)
    private String notes;

    /**
     * The actual date the session took place.
     */
    @Column(nullable = false)
    private LocalDate sessionDate;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * @deprecated Use {@link #status} instead. 
     * Kept for backward compatibility with existing data migrations.
     */
    @Builder.Default
    @Column(nullable = false)
    @Deprecated
    private Boolean completed = false;

    // --- Scheduling Details ---

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Column(length = 100)
    private String subject;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private LessonStatus status = LessonStatus.SCHEDULED;

    @Builder.Default
    @Version
    private Integer version = 0;

    // --- Media & Content Links ---

    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @BatchSize(size = 50)
    @JoinTable(name = "session_lessons", 
               joinColumns = @JoinColumn(name = "session_id"), 
               inverseJoinColumns = @JoinColumn(name = "lesson_id"))
    private Set<Lesson> lessons = new HashSet<>();

    @Builder.Default
    @ManyToMany(fetch = FetchType.LAZY)
    @BatchSize(size = 50)
    @JoinTable(name = "session_documents", 
               joinColumns = @JoinColumn(name = "session_id"), 
               inverseJoinColumns = @JoinColumn(name = "document_id"))
    private Set<Document> documents = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (paid == null) paid = false;
        if (completed == null) completed = false;
        if (status == null) status = LessonStatus.SCHEDULED;
        if (version == null) version = 0;
    }
}
