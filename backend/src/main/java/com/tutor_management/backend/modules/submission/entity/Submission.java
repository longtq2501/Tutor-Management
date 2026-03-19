package com.tutor_management.backend.modules.submission.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.data.domain.Persistable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Domain entity representing a student's attempt/submission for an {@link com.tutor_management.backend.modules.exercise.Exercise}.
 * Tracks scores for both auto-graded multiple choice questions (MCQ) and manually graded essays.
 */
@Entity
@Table(name = "submissions", indexes = {
    @Index(name = "idx_submission_exercise_id", columnList = "exercise_id"),
    @Index(name = "idx_submission_student_id", columnList = "student_id"),
    @Index(name = "idx_submission_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "answers")
public class Submission implements Persistable<String> {
    
    @Id
    @Column(length = 36)
    private String id;
    
    @Transient
    @Builder.Default
    @JsonIgnore
    private boolean isNew = true;

    @Override
    public boolean isNew() {
        return isNew;
    }
    
    /**
     * Unique identifier of the target exercise.
     */
    @Column(name = "exercise_id", nullable = false, length = 36)
    private String exerciseId;
    
    /**
     * Unique identifier of the student.
     */
    @Column(name = "student_id", nullable = false, length = 36)
    private String studentId;
    
    /**
     * Current workflow state of the submission.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private SubmissionStatus status = SubmissionStatus.DRAFT;
    
    /**
     * Points earned from auto-graded MCQ/Question items.
     */
    @Column(name = "mcq_score", precision = 10, scale = 2)
    @Builder.Default
    private Double mcqScore = 0.0;
    
    /**
     * Points awarded manually for written/open-ended items.
     */
    @Column(name = "essay_score", precision = 10, scale = 2)
    @Builder.Default
    private Double essayScore = 0.0;
    
    /**
     * Aggregate score (mcqScore + essayScore).
     */
    @Column(name = "total_score", precision = 10, scale = 2)
    @Builder.Default
    private Double totalScore = 0.0;
    
    /**
     * Official submission timestamp (transition from DRAFT to SUBMITTED).
     */
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
    
    /**
     * When the grading process was finalized.
     */
    @Column(name = "graded_at")
    private LocalDateTime gradedAt;
    
    /**
     * Global feedback provided by the tutor for the entire submission.
     */
    @Column(name = "teacher_comment", columnDefinition = "TEXT")
    private String teacherComment;
    
    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    /**
     * Detailed individual answers within this submission.
     */
    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<StudentAnswer> answers = new ArrayList<>();
    
    // --- Logic Helpers ---

    /**
     * Attaches an answer to this submission and manages bidirectional state.
     */
    public void addAnswer(StudentAnswer answer) {
        answers.add(answer);
        answer.setSubmission(this);
    }
    
    /**
     * Detaches an answer from this submission.
     */
    public void removeAnswer(StudentAnswer answer) {
        answers.remove(answer);
        answer.setSubmission(null);
    }
    
    /**
     * Synchonizes the total score from individual component scores.
     */
    public void calculateTotalScore() {
        this.totalScore = roundTwoDecimals((mcqScore != null ? mcqScore : 0.0) + (essayScore != null ? essayScore : 0.0));
    }

    private double roundTwoDecimals(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
    
    @PrePersist
    protected void onCreate() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }

    @PostPersist
    @PostLoad
    protected void markNotNew() {
        this.isNew = false;
    }
}
