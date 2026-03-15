package com.tutor_management.backend.modules.feedback.service.ai;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.tutor_management.backend.modules.feedback.dto.request.GenerateCommentRequest;

import com.tutor_management.backend.AbstractIntegrationTest;

public class GroqAiIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private AiGeneratorService aiGeneratorService;

    @Test
    void testAiGeneration() {
        if (!aiGeneratorService.isEnabled()) {
            System.out.println("⚠️ AI Generator is not enabled. Skipping test.");
            return;
        }

        GenerateCommentRequest request = GenerateCommentRequest.builder()
                .category("ATTITUDE")
                .ratingLevel("XUAT_SAC")
                .studentName("Anh Tuấn")
                .subject("Tiếng Anh")
                .language("Vietnamese")
                .keywords(java.util.List.of("chăm chỉ", "tự giác"))
                .build();

        String comment = aiGeneratorService.generate(request);
        
        System.out.println("🤖 AI Generated Comment: " + comment);
        
        assertNotNull(comment);
        assertFalse(comment.isEmpty());
        assertTrue(comment.length() > 10);
    }
}
