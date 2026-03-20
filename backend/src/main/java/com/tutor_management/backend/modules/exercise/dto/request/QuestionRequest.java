package com.tutor_management.backend.modules.exercise.dto.request;

import com.tutor_management.backend.modules.exercise.domain.QuestionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Declaration for a single assessment question, supporting both MCQ and Essay formats.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionRequest {
    
    /**
     * Interaction format (MCQ or ESSAY).
     */
    @NotNull(message = "Loại câu hỏi không được để trống")
    private QuestionType type;
    
    /**
     * The prompt or instruction text.
     */
    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String questionText;

    /**
     * Optional image URL attached to the question prompt.
     */
    private String imageUrl;
    
    /**
     * Scoring weight for this item.
     */
    @NotNull(message = "Điểm số không được để trống")
    @DecimalMin(value = "0.01", message = "Điểm số phải lớn hơn 0")
    @Digits(integer = 8, fraction = 2, message = "Điểm số tối đa 2 chữ số thập phân")
    private Double points;
    
    /**
     * Visual sequence index.
     */
    @NotNull(message = "Vị trí không được để trống")
    @Min(value = 0, message = "Vị trí không được là số âm")
    private Integer orderIndex;
    
    /**
     * Collection of choices (Required if type is MCQ).
     */
    private List<OptionRequest> options;
    
    /**
     * The label of the correct option (e.g., 'B'). Required if type is MCQ.
     */
    private String correctAnswer;
    
    /**
     * Assessment guidelines or grading key (primarily for ESSAY).
     */
    private String rubric;
}
