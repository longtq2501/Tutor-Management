package com.tutor_management.backend.modules.exercise.service;

import com.tutor_management.backend.modules.exercise.domain.QuestionType;
import com.tutor_management.backend.modules.exercise.dto.response.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Implementation of {@link ExerciseParserService} using Regular Expressions.
 * Designed to parse a specific Vietnamese-English hybrid format used by tutors.
 */
@Service
@Slf4j
public class ExerciseParserServiceImpl implements ExerciseParserService {
    
    // --- Regex patterns for orchestration ---
    
    private static final Pattern METADATA_SECTION_PATTERN = 
        Pattern.compile("===\\s*THÔNG TIN BÀI TẬP\\s*===(.*?)(?====|$)", Pattern.DOTALL);
    
    private static final Pattern MCQ_SECTION_PATTERN = 
        Pattern.compile("===\\s*PHẦN 1:\\s*TRẮC NGHIỆM\\s*===(.*?)(?====|$)", Pattern.DOTALL);
    
    private static final Pattern ESSAY_SECTION_PATTERN = 
        Pattern.compile("===\\s*PHẦN 2:\\s*TỰ LUẬN\\s*===(.*?)$", Pattern.DOTALL);
    
    // --- Regex patterns for detailed extraction ---
    
    private static final Pattern TITLE_PATTERN = 
        Pattern.compile("Tiêu đề:\\s*(.+?)(?=Mô tả:|Thời gian:|Tổng điểm:|===|$)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    
    private static final Pattern DESCRIPTION_PATTERN = 
        Pattern.compile("Mô tả:\\s*(.+?)(?=Thời gian:|Tổng điểm:|===|$)", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    
    private static final Pattern TIME_LIMIT_PATTERN = 
        Pattern.compile("Thời gian:\\s*(\\d+)", Pattern.CASE_INSENSITIVE);
    
    private static final Pattern TOTAL_POINTS_PATTERN = 
        Pattern.compile("Tổng điểm:\\s*(\\d+)", Pattern.CASE_INSENSITIVE);
    
    private static final Pattern MCQ_QUESTION_PATTERN = 
        Pattern.compile("\\[MCQ-(\\d+)\\]\\s*(.+?)(?=A\\.)", Pattern.DOTALL);
    
    private static final Pattern OPTION_PATTERN = 
        Pattern.compile("([A-D])\\.\\s*(.+?)(?=[A-D]\\.|ANSWER:|POINTS:|\\[|$)", Pattern.DOTALL);
    
    private static final Pattern ANSWER_PATTERN = 
        Pattern.compile("ANSWER:\\s*([A-D])", Pattern.CASE_INSENSITIVE);
    
    private static final Pattern POINTS_PATTERN = 
        Pattern.compile("POINTS:\\s*(\\d+(?:\\.\\d+)?)", Pattern.CASE_INSENSITIVE);

    private static final Pattern IMAGE_PATTERN =
        Pattern.compile("IMAGE:\\s*(https?://\\S+)", Pattern.CASE_INSENSITIVE);
    
    private static final Pattern ESSAY_QUESTION_PATTERN = 
        Pattern.compile("\\[ESSAY-(\\d+)\\]\\s*(.+?)(?=POINTS:)", Pattern.DOTALL);
    
    private static final Pattern RUBRIC_PATTERN = 
        Pattern.compile("RUBRIC:\\s*(.+?)(?=\\[|$)", Pattern.DOTALL | Pattern.CASE_INSENSITIVE);
    
    @Override
    public ImportPreviewResponse parseFromText(String content) {
        log.info("Starting ingestion of raw exercise text. Length: {} chars", content.length());
        
        List<String> validationErrors = new ArrayList<>();
        ImportPreviewResponse response = ImportPreviewResponse.builder()
            .validationErrors(validationErrors)
            .build();
        
        try {
            // 1. Ingest metadata
            ExerciseMetadata metadata = ingestMetadata(content, validationErrors);
            response.setMetadata(metadata);
            
            // 2. Ingest assessment content
            List<QuestionPreview> questions = ingestAssignedContent(content, validationErrors);
            response.setQuestions(questions);
            
            // 3. Post-parsing integrity check
            performIntegrityCheck(metadata, questions, validationErrors);
            
            response.setIsValid(validationErrors.isEmpty());
            log.info("Ingestion completed. Result: {}, Error count: {}", response.getIsValid(), validationErrors.size());
            
        } catch (Exception e) {
            log.error("Fatal exception during ingestion pipeline", e);
            validationErrors.add("Lỗi hệ thống trong quá trình xử lý nội dung: " + e.getMessage());
            response.setIsValid(false);
        }
        
        return response;
    }

    /**
     * Extracts and validates the exercise header information.
     */
    private ExerciseMetadata ingestMetadata(String content, List<String> errors) {
        String metadataSection = extractSection(content, METADATA_SECTION_PATTERN);
        
        if (!StringUtils.hasText(metadataSection)) {
            errors.add("Không tìm thấy phần thông tin chung (=== THÔNG TIN BÀI TẬP ===)");
            return ExerciseMetadata.builder().build();
        }
        
        String title = extractField(metadataSection, TITLE_PATTERN);
        String description = extractField(metadataSection, DESCRIPTION_PATTERN);
        Integer timeLimit = extractIntField(metadataSection, TIME_LIMIT_PATTERN);
        Integer totalPoints = extractIntField(metadataSection, TOTAL_POINTS_PATTERN);
        
        if (!StringUtils.hasText(title)) {
            errors.add("Tiêu đề bài tập không được để trống");
        }
        if (totalPoints == null || totalPoints <= 0) {
            errors.add("Tổng điểm bài tập phải là số dương");
        }
        
        return ExerciseMetadata.builder()
            .title(title)
            .description(description)
            .timeLimit(timeLimit)
            .totalPoints(totalPoints)
            .build();
    }

    /**
     * Orchestrates the extraction of MCQ and Essay questions from their respective blocks.
     */
    private List<QuestionPreview> ingestAssignedContent(String content, List<String> errors) {
        List<QuestionPreview> questions = new ArrayList<>();
        
        // Handle MCQ Section
        String mcqSection = extractSection(content, MCQ_SECTION_PATTERN);
        if (StringUtils.hasText(mcqSection)) {
            questions.addAll(parseMCQQuestions(mcqSection, 0, errors));
        }
        
        // Handle Essay Section
        String essaySection = extractSection(content, ESSAY_SECTION_PATTERN);
        if (StringUtils.hasText(essaySection)) {
            questions.addAll(parseEssayQuestions(essaySection, questions.size(), errors));
        }
        
        return questions;
    }
    
    /**
     * Splits and parses the MCQ block.
     */
    private List<QuestionPreview> parseMCQQuestions(String section, int startIndex, List<String> errors) {
        List<QuestionPreview> questions = new ArrayList<>();
        String[] questionBlocks = section.split("(?=\\[MCQ-\\d+\\])");
        
        for (String block : questionBlocks) {
            if (StringUtils.hasText(block) && block.contains("[MCQ-")) {
                QuestionPreview question = parseSingleMCQ(block, startIndex + questions.size(), errors);
                if (question != null) {
                    questions.add(question);
                }
            }
        }
        return questions;
    }
    
    /**
     * Details extraction logic for MCQ format.
     */
    private QuestionPreview parseSingleMCQ(String block, int sequenceIndex, List<String> errors) {
        Matcher questionMatcher = MCQ_QUESTION_PATTERN.matcher(block);
        if (!questionMatcher.find()) {
            errors.add("Định dạng câu hỏi trắc nghiệm không hợp lệ tại vị trí: " + sequenceIndex);
            return null;
        }
        
        String questionRef = questionMatcher.group(1);
        String questionText = cleanQuestionText(questionMatcher.group(2));
        String imageUrl = extractField(block, IMAGE_PATTERN);
        List<OptionPreview> options = extractOptions(block);
        
        String correctAnswer = extractField(block, ANSWER_PATTERN);
        if (!StringUtils.hasText(correctAnswer)) {
            errors.add("MCQ-" + questionRef + ": Thiếu đáp án đúng (ANSWER)");
        } else {
            verifyCorrectAnswerMapping(questionRef, options, correctAnswer, errors);
        }
        
        Double points = extractDoubleField(block, POINTS_PATTERN);
        if (points == null || points <= 0) {
            errors.add("MCQ-" + questionRef + ": Điểm số phải là số dương");
            points = 0.0;
        }
        
        if (options.size() != 4) {
            errors.add("MCQ-" + questionRef + ": Phải có chính xác 4 lựa chọn (A, B, C, D), tìm thấy: " + options.size());
        }
        
        return QuestionPreview.builder()
            .type(QuestionType.MCQ)
            .questionText(questionText)
            .imageUrl(imageUrl)
            .points(points)
            .orderIndex(sequenceIndex)
            .options(options)
            .correctAnswer(correctAnswer)
            .build();
    }

    /**
     * Sub-parser for MCQ options.
     */
    private List<OptionPreview> extractOptions(String block) {
        List<OptionPreview> options = new ArrayList<>();
        Matcher optionMatcher = OPTION_PATTERN.matcher(block);
        while (optionMatcher.find()) {
            options.add(OptionPreview.builder()
                .label(optionMatcher.group(1))
                .optionText(optionMatcher.group(2).trim())
                .isCorrect(false)
                .build());
        }
        return options;
    }

    /**
     * Links the ANSWER label to the correct option object and validates existence.
     */
    private void verifyCorrectAnswerMapping(String ref, List<OptionPreview> options, String answer, List<String> errors) {
        boolean mapped = false;
        for (OptionPreview option : options) {
            if (option.getLabel().equalsIgnoreCase(answer)) {
                option.setIsCorrect(true);
                mapped = true;
                break;
            }
        }
        if (!mapped) {
            errors.add("MCQ-" + ref + ": Không tìm thấy lựa chọn " + answer + " trong danh sách");
        }
    }
    
    /**
     * Splits and parses the Essay block.
     */
    private List<QuestionPreview> parseEssayQuestions(String section, int startIndex, List<String> errors) {
        List<QuestionPreview> questions = new ArrayList<>();
        String[] questionBlocks = section.split("(?=\\[ESSAY-\\d+\\])");
        
        for (String block : questionBlocks) {
            if (StringUtils.hasText(block) && block.contains("[ESSAY-")) {
                QuestionPreview question = parseSingleEssay(block, startIndex + questions.size(), errors);
                if (question != null) {
                    questions.add(question);
                }
            }
        }
        return questions;
    }
    
    /**
     * Details extraction logic for Essay format.
     */
    private QuestionPreview parseSingleEssay(String block, int sequenceIndex, List<String> errors) {
        Matcher questionMatcher = ESSAY_QUESTION_PATTERN.matcher(block);
        if (!questionMatcher.find()) {
            errors.add("Định dạng câu hỏi tự luận không hợp lệ tại vị trí: " + sequenceIndex);
            return null;
        }
        
        String questionRef = questionMatcher.group(1);
        String questionText = cleanQuestionText(questionMatcher.group(2));
        String imageUrl = extractField(block, IMAGE_PATTERN);
        Double points = extractDoubleField(block, POINTS_PATTERN);
        
        if (points == null || points <= 0) {
            errors.add("ESSAY-" + questionRef + ": Điểm số phải là số dương");
            points = 0.0;
        }
        
        String rubric = extractField(block, RUBRIC_PATTERN);
        
        return QuestionPreview.builder()
            .type(QuestionType.ESSAY)
            .questionText(questionText)
            .imageUrl(imageUrl)
            .points(points)
            .orderIndex(sequenceIndex)
            .rubric(rubric != null ? rubric.trim() : null)
            .build();
    }
    
    /**
     * Validates logical consistency across the entire exercise structure.
     */
    private void performIntegrityCheck(ExerciseMetadata metadata, List<QuestionPreview> questions, List<String> errors) {
        if (questions.isEmpty()) {
            errors.add("Bài tập phải có ít nhất một câu hỏi");
            return;
        }
        
        double calculatedPoints = questions.stream()
            .mapToDouble(q -> q.getPoints() != null ? q.getPoints() : 0.0)
            .sum();
        
        if (metadata.getTotalPoints() != null && Math.abs(calculatedPoints - metadata.getTotalPoints()) > 0.0001) {
            errors.add("Tổng điểm không khớp: Thông tin chung là " + metadata.getTotalPoints() + 
                      " nhưng tổng điểm các câu hỏi là " + formatPoints(calculatedPoints));
        }
    }
    
    // --- Basic Regex Helper Methods ---

    private String extractSection(String content, Pattern pattern) {
        Matcher matcher = pattern.matcher(content);
        return matcher.find() ? matcher.group(1) : null;
    }
    
    private String extractField(String content, Pattern pattern) {
        Matcher matcher = pattern.matcher(content);
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    private String cleanQuestionText(String rawQuestionText) {
        if (rawQuestionText == null) {
            return null;
        }

        return rawQuestionText
            .replaceAll("(?im)^\\s*IMAGE:\\s*\\S+\\s*$", "")
            .trim();
    }
    
    private Integer extractIntField(String content, Pattern pattern) {
        String value = extractField(content, pattern);
        if (StringUtils.hasText(value)) {
            try {
                return Integer.parseInt(value);
            } catch (NumberFormatException e) {
                log.warn("Regex matched non-integer value: {}", value);
            }
        }
        return null;
    }

    private Double extractDoubleField(String content, Pattern pattern) {
        String value = extractField(content, pattern);
        if (StringUtils.hasText(value)) {
            try {
                return Double.parseDouble(value);
            } catch (NumberFormatException e) {
                log.warn("Regex matched non-decimal value: {}", value);
            }
        }
        return null;
    }

    private String formatPoints(double value) {
        if (Math.abs(value - Math.rint(value)) < 0.0001) {
            return String.valueOf((int) Math.rint(value));
        }
        return String.format(java.util.Locale.ROOT, "%.2f", value);
    }
}
