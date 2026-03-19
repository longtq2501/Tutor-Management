package com.tutor_management.backend.modules.exercise.domain;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import org.springframework.data.domain.Persistable;

import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Individual assessment task within an exercise.
 * Supports multiple formats including multiple choice and essays.
 */
@Entity
@Table(name = "questions", indexes = {
    @Index(name = "idx_question_exercise_id", columnList = "exercise_id"),
    @Index(name = "idx_question_order", columnList = "exercise_id, order_index")
})
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question implements Persistable<String> {
    
    @Id
    @EqualsAndHashCode.Include
    @Column(length = 36)
    @Builder.Default
    private String id = java.util.UUID.randomUUID().toString();
    
    @Transient
    @Builder.Default
    @JsonIgnore
    private boolean isNew = true;

    @Override
    public boolean isNew() {
        return isNew;
    }
    
    /**
     * The parent assessment containing this question.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_id", nullable = false)
    @JsonBackReference
    private Exercise exercise;
    
    /**
     * Interaction format (MCQ or ESSAY).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuestionType type;
    
    /**
     * The actual query or instruction presented to the student.
     */
    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;
    
    /**
     * Scoring weight for this question.
     */
    @Column(nullable = false, precision = 10, scale = 2)
    private Double points;
    
    /**
     * Sequence number defining the flow of the exercise.
     */
    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;
    
    /**
     * Grading criteria or reference answer guidelines (primarily for essays).
     */
    @Column(columnDefinition = "TEXT")
    private String rubric;
    
    /**
     * Available selections for multiple choice formatted questions.
     */
    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("label ASC")
    @JsonManagedReference
    @BatchSize(size = 20)
    @Builder.Default
    private Set<Option> options = new LinkedHashSet<>();
    
    /**
     * Bi-directional association helper.
     */
    public void addOption(Option option) {
        options.add(option);
        option.setQuestion(this);
    }
    
    /**
     * Bi-directional association helper.
     */
    public void removeOption(Option option) {
        options.remove(option);
        option.setQuestion(null);
    }
    
    @PostPersist
    @PostLoad
    protected void markNotNew() {
        this.isNew = false;
    }
}
