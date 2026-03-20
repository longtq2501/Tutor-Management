package com.tutor_management.backend.modules.exercise.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.tutor_management.backend.modules.exercise.domain.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Detailed representation of an assessment task in the resource library.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QuestionResponse {
    
    private String id;
    private QuestionType type;
    private String questionText;
    private String imageUrl;
    private Double points;
    private Integer orderIndex;
    
    /**
     * Guidelines for evaluation.
     */
    private String rubric;
    
    /**
     * Flat list of possible responses (for MCQ).
     */
    private List<OptionResponse> options;
}
