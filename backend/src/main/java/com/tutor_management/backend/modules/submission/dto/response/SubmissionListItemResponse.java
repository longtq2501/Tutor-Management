package com.tutor_management.backend.modules.submission.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.tutor_management.backend.modules.submission.entity.SubmissionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Summary data response for submission listings.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SubmissionListItemResponse {
    
    private String id;
    private String studentId;
    private String studentName;
    private SubmissionStatus status;
    private Double mcqScore;
    private Double essayScore;
    private Double totalScore;
    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;
}
