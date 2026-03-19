package com.tutor_management.backend.modules.submission.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.domain.Persistable;

import java.util.UUID;

/**
 * Domain entity representing a student's answer to a specific question item within a {@link Submission}.
 */
@Entity
@Table(name = "student_answers", indexes = {
    @Index(name = "idx_answer_submission_id", columnList = "submission_id"),
    @Index(name = "idx_answer_question_id", columnList = "question_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "submission")
public class StudentAnswer implements Persistable<String> {
    
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
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    @JsonBackReference
    private Submission submission;
    
    /**
     * Unique identifier of the question being answered.
     */
    @Column(name = "question_id", nullable = false, length = 36)
    private String questionId;
    
    /**
     * Selected option (e.g., 'A', 'B') for MCQ items.
     */
    @Column(name = "selected_option", length = 1)
    private String selectedOption;
    
    /**
     * Raw text response for essay/open-ended items.
     */
    @Column(name = "essay_text", columnDefinition = "TEXT")
    private String essayText;
    
    /**
     * Computed flag for MCQ correctness.
     */
    @Column(name = "is_correct")
    private Boolean isCorrect;
    
    /**
     * Points awarded for this specific answer.
     */
    @Column(name = "points", precision = 10, scale = 2)
    @Builder.Default
    private Double points = 0.0;
    
    /**
     * Specific feedback/annotation for this answer from the tutor.
     */
    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;
    
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
