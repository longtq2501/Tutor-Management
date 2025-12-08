package com.tutor_management.backend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentRequest {
    @NotBlank(message = "Student name is required")
    private String name;

    private String phone;

    @NotBlank(message = "Schedule is required")
    private String schedule;

    @NotNull(message = "Price per hour is required")
    @Min(value = 0, message = "Price must be positive")
    private Long pricePerHour;

    private String notes;
}