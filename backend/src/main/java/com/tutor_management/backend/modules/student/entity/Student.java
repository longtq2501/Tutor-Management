package com.tutor_management.backend.modules.student.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.tutor_management.backend.modules.parent.entity.Parent;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Domain entity representing a Student in the system.
 * Contains demographic information, billing rates, and academic schedules.
 * Students can be linked to a {@link Parent} for administrative purposes.
 * 
 * Multi-tenancy: Each student belongs to exactly one Tutor (tutor_id).
 */
@Entity
@Table(name = "students", indexes = {
    @Index(name = "idx_student_tutor_id", columnList = "tutor_id"),
    @Index(name = "idx_student_parent_id", columnList = "parent_id"),
    @Index(name = "idx_student_active", columnList = "active")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Foreign key to the owning Tutor.
     * Every student MUST belong to a tutor (multi-tenancy isolation).
     */
    @Column(name = "tutor_id", nullable = false)
    private Long tutorId;

    /**
     * Full name of the student.
     */
    @Column(nullable = false)
    private String name;

    /**
     * Optional contact phone number for the student.
     */
    private String phone;

    /**
     * Description of the weekly schedule (e.g., "Monday 18:00").
     */
    @Column(nullable = false)
    private String schedule;

    /**
     * Billing rate per hour of instruction.
     */
    @Column(nullable = false)
    private Long pricePerHour;

    /**
     * Additional academic or behavioral notes.
     */
    @Column(length = 1000)
    private String notes;

    /**
     * Lifecycle status of the student (active/inactive).
     */
    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;

    /**
     * The first month the student enrolled (YYYY-MM).
     */
    private String startMonth;

    /**
     * The most recent month with recorded attendance (YYYY-MM).
     */
    private String lastActiveMonth;

    /**
     * Associated parent or guardian record.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    @JsonIgnore
    private Parent parent;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }
}