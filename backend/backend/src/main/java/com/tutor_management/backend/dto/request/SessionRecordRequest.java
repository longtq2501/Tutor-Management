package com.tutor_management.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SessionRecordRequest {
    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotBlank(message = "Month is required")
    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Month must be in format YYYY-MM")
    private String month;

    @NotNull(message = "Number of sessions is required")
    @Min(value = 1, message = "Sessions must be at least 1")
    private Integer sessions;

    private String notes;
}
