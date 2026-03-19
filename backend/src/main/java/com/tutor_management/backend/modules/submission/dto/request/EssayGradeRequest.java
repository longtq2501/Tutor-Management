package com.tutor_management.backend.modules.submission.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for grading an individual essay response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EssayGradeRequest {
    
    @NotBlank(message = "ID câu hỏi không được để trống")
    private String questionId;
    
    @NotNull(message = "Điểm số không được để trống")
    @DecimalMin(value = "0.0", inclusive = true, message = "Điểm số không được nhỏ hơn 0")
    @Digits(integer = 8, fraction = 2, message = "Điểm số tối đa 2 chữ số thập phân")
    private Double points;
    
    /**
     * Specific feedback for this specific answer.
     */
    private String feedback;
}
