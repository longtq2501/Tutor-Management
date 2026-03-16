package com.tutor_management.backend.modules.feedback.service;

import java.util.ArrayList;
import java.util.List;

import com.tutor_management.backend.exception.ResourceNotFoundException;
import com.tutor_management.backend.modules.feedback.FeedbackStatus;
import com.tutor_management.backend.modules.feedback.entity.SessionFeedback;
import com.tutor_management.backend.modules.feedback.repository.SessionFeedbackRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tutor_management.backend.modules.feedback.dto.request.GenerateCommentRequest;
import com.tutor_management.backend.modules.feedback.dto.response.GenerateCommentResponse;
import com.tutor_management.backend.modules.feedback.dto.request.SessionFeedbackRequest;
import com.tutor_management.backend.modules.feedback.dto.response.SessionFeedbackResponse;
import com.tutor_management.backend.modules.finance.entity.SessionRecord;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Standard implementation of the Feedback Management service.
 * Features an AI-powered Smart Comment Generator.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SessionFeedbackService {

    private final SessionFeedbackRepository sessionFeedbackRepository;
    private final SessionRecordRepository sessionRecordRepository;
    private final StudentRepository studentRepository;
    private final com.tutor_management.backend.modules.feedback.service.ai.AiGeneratorService aiGeneratorService;

    // --- CRUD Operations for Session Feedback ---
    @Transactional
    public Long createFeedback(SessionFeedbackRequest request) {
        log.info("Creating new feedback for session {} and student {}", request.getSessionRecordId(), request.getStudentId());
        
        SessionRecord sessionRecord = sessionRecordRepository.findById(request.getSessionRecordId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin buổi học"));
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin học sinh"));

        SessionFeedback feedback = SessionFeedback.builder()
                .sessionRecord(sessionRecord)
                .student(student)
                .lessonContent(request.getLessonContent())
                .attitudeRating(request.getAttitudeRating())
                .attitudeComment(request.getAttitudeComment())
                .absorptionRating(request.getAbsorptionRating())
                .absorptionComment(request.getAbsorptionComment())
                .knowledgeGaps(request.getKnowledgeGaps())
                .solutions(request.getSolutions())
                .status(request.getStatus() != null ? request.getStatus() : FeedbackStatus.DRAFT)
                .build();

        return sessionFeedbackRepository.save(feedback).getId();
    }

    // Update existing feedback by ID
    @Transactional
    public Long updateFeedback(Long id, SessionFeedbackRequest request) {
        log.info("Updating feedback ID: {}", id);
        
        SessionFeedback feedback = sessionFeedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phản hồi buổi học"));

        feedback.setLessonContent(request.getLessonContent());
        feedback.setAttitudeRating(request.getAttitudeRating());
        feedback.setAttitudeComment(request.getAttitudeComment());
        feedback.setAbsorptionRating(request.getAbsorptionRating());
        feedback.setAbsorptionComment(request.getAbsorptionComment());
        feedback.setKnowledgeGaps(request.getKnowledgeGaps());
        feedback.setSolutions(request.getSolutions());
        feedback.setStatus(request.getStatus());

        return sessionFeedbackRepository.save(feedback).getId();
    }

    // Get the latest feedback for a specific session and student
    @Transactional(readOnly = true)
    public SessionFeedbackResponse getFeedbackBySession(Long sessionId, Long studentId) {
        return sessionFeedbackRepository
                .findFirstBySessionRecordIdAndStudentIdOrderByUpdatedAtDesc(sessionId, studentId)
                .map(this::convertToResponse)
                .orElse(null);
    }

    // Get feedback by its unique ID
    @Transactional(readOnly = true)
    public SessionFeedbackResponse getFeedbackById(Long id) {
        return sessionFeedbackRepository.findById(id)
                .map(this::convertToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phản hồi"));
    }

    // Get paginated feedback history for a student
    @Transactional(readOnly = true)
    public Page<SessionFeedbackResponse> getFeedbackHistory(Long studentId, Pageable pageable) {
        return sessionFeedbackRepository.findByStudentId(studentId, pageable)
                .map(this::convertToResponse);
    }

    // --- SMART GENERATOR LOGIC ---

    /**
     * Generates a natural-sounding Vietnamese comment based on ratings and selected keywords using AI.
     */
    @Cacheable(value = "aiGeneratedComments", 
               key = "{#request.category, #request.ratingLevel, #request.keywords, #request.tone, #request.length}",
               condition = "!#request.forceRefresh")
    public GenerateCommentResponse generateComment(GenerateCommentRequest request) {
        log.info("Generating AI comment for student {} [Category: {}], ForceRefresh: {}", 
                 request.getStudentName(), request.getCategory(), request.isForceRefresh());
        
        if (aiGeneratorService.isEnabled()) {
            String aiComment = aiGeneratorService.generate(request);
            if (aiComment != null && !aiComment.isEmpty()) {
                log.info("Successfully generated AI comment for {}", request.getStudentName());
                return GenerateCommentResponse.builder()
                        .generatedComment(aiComment)
                        .build();
            }
            log.warn("AI generation failed or returned empty content.");
        }

        return GenerateCommentResponse.builder()
                .generatedComment("")
                .build();
    }

    // --- Utility Methods ---

    // Method to get clipboard content for a specific feedback, formatted for easy copying
    @Transactional(readOnly = true)
    public String getClipboardContent(Long id) {
        SessionFeedback feedback = sessionFeedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phản hồi"));

        return String.format(
            "Học sinh: %s\nNgày: %s\n\nNỘI DUNG: %s\n\nTHÁI ĐỘ (%s):\n%s\n\nTIẾP THU (%s):\n%s\n\nKIẾN THỨC HỔNG:\n%s\n\nGIẢI PHÁP:\n%s",
            feedback.getStudent().getName(),
            feedback.getSessionRecord().getSessionDate(),
            feedback.getLessonContent(),
            feedback.getAttitudeRating(), feedback.getAttitudeComment(),
            feedback.getAbsorptionRating(), feedback.getAbsorptionComment(),
            feedback.getKnowledgeGaps(),
            feedback.getSolutions()
        );
    }

    // --- Excel Export Logic ---
    @Transactional(readOnly = true)
    public void exportFeedbacksToExcel(Long studentId, jakarta.servlet.http.HttpServletResponse response)
            throws java.io.IOException {
        List<SessionFeedback> allFeedbacks = sessionFeedbackRepository.findLatestByStudent(studentId,
                Pageable.unpaged());

        // Deduplicate: Keep only the latest feedback per session
        java.util.Map<Long, SessionFeedback> uniqueMap = new java.util.HashMap<>();
        for (SessionFeedback fb : allFeedbacks) {
            uniqueMap.merge(fb.getSessionRecord().getId(), fb,
                    (existing, replacement) -> existing.getUpdatedAt().isAfter(replacement.getUpdatedAt()) ? existing
                            : replacement);
        }

        List<SessionFeedback> feedbacks = new ArrayList<>(uniqueMap.values());
        // Sort by Session Date (Desc)
        feedbacks
                .sort((a, b) -> b.getSessionRecord().getSessionDate().compareTo(a.getSessionRecord().getSessionDate()));

        try (org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
            org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Student Feedback");

            // Header Row
            org.apache.poi.ss.usermodel.Row headerRow = sheet.createRow(0);
            String[] headers = { "STT", "Họ và Tên", "Ngày", "Nội dung bài học", "Thái độ học", "Khả năng tập trung",
                    "Kiến thức hổng", "Giải pháp" };

            org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            for (int i = 0; i < headers.length; i++) {
                org.apache.poi.ss.usermodel.Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data Rows
            int rowNum = 1;
            for (SessionFeedback feedback : feedbacks) {
                org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowNum++);

                row.createCell(0).setCellValue(rowNum - 1);
                row.createCell(1).setCellValue(feedback.getStudent().getName());
                row.createCell(2).setCellValue(feedback.getSessionRecord().getSessionDate().toString());
                row.createCell(3).setCellValue(feedback.getLessonContent());

                // Combine Rating + Comment
                String attitude = String.format("[%s] %s", feedback.getAttitudeRating(), feedback.getAttitudeComment());
                row.createCell(4).setCellValue(attitude);

                String absorption = String.format("[%s] %s", feedback.getAbsorptionRating(),
                        feedback.getAbsorptionComment());
                row.createCell(5).setCellValue(absorption);

                row.createCell(6).setCellValue(feedback.getKnowledgeGaps());
                row.createCell(7).setCellValue(feedback.getSolutions());
            }

            // Auto size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=feedback_" + studentId + ".xlsx");

            workbook.write(response.getOutputStream());
        }
    }

    // --- Helper Methods ---
    private SessionFeedbackResponse convertToResponse(SessionFeedback fb) {
        return SessionFeedbackResponse.builder()
                .id(fb.getId())
                .sessionRecordId(fb.getSessionRecord().getId())
                .studentId(fb.getStudent().getId())
                .studentName(fb.getStudent().getName())
                .sessionDate(fb.getSessionRecord().getSessionDate())
                .lessonContent(fb.getLessonContent())
                .attitudeRating(fb.getAttitudeRating())
                .attitudeComment(fb.getAttitudeComment())
                .absorptionRating(fb.getAbsorptionRating())
                .absorptionComment(fb.getAbsorptionComment())
                .knowledgeGaps(fb.getKnowledgeGaps())
                .solutions(fb.getSolutions())
                .status(fb.getStatus())
                .createdAt(fb.getCreatedAt())
                .updatedAt(fb.getUpdatedAt())
                .build();
    }
}
