package com.tutor_management.backend.modules.submission.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data response for an individual student answer.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudentAnswerResponse {
    
    private String id;
    private String questionId;
    private String selectedOption;
    private String essayText;
    private Boolean isCorrect;
    private Double points;
    private String feedback;
}
