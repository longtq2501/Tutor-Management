package com.tutor_management.backend.modules.report.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SaveCommentRequest {

    @NotNull
    private Long studentId;

    @NotNull
    @Min(1)
    @Max(12)
    private Integer month;

    @NotNull
    @Min(2000)
    @Max(2100)
    private Integer year;

    private String comment;
}
