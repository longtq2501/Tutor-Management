package com.tutor_management.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "session_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String month; // Format: YYYY-MM

    @Column(nullable = false)
    private Integer sessions;

    @Column(nullable = false)
    private Integer hours;

    @Column(nullable = false)
    private Long pricePerHour;

    @Column(nullable = false)
    private Long totalAmount;

    @Column(nullable = false)
    private Boolean paid;

    private LocalDateTime paidAt;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (paid == null) {
            paid = false;
        }
    }
}