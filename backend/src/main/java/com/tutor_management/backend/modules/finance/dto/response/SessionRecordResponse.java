package com.tutor_management.backend.modules.finance.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Response payload for session record details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SessionRecordResponse {
    
    private Long id;
    private Long studentId;
    private String studentName;
    private String month;
    private Integer sessions;
    private Double hours;
    private Long pricePerHour;
    private Long totalAmount;
    private Boolean paid;
    private String paidAt;
    private String notes;
    private String sessionDate;
    private String createdAt;
    
    /**
     * @deprecated Use status instead.
     */
    @Deprecated
    private Boolean completed;

    private String startTime;
    private String endTime;
    private String subject;
    private String status;
    private Integer version;
    private Boolean isOnline;

    private Long tutorId;
    private String tutorName;

    private List<DocumentDTO> documents;
    private List<LessonDTO> lessons;

    /**
     * Simplified document metadata for session attachments.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DocumentDTO {
        private Long id;
        private String title;
        private String fileName;
        private String fileType;
        private Long fileSize;
        private String filePath;
    }

    /**
     * Simplified lesson metadata for session attachments.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LessonDTO {
        private Long id;
        private String title;
        private String summary;
        private String thumbnailUrl;
        private Integer durationMinutes;
        private boolean isPublished;
    }
}
