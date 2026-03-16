package com.tutor_management.backend.modules.feedback.service.ai;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tutor_management.backend.modules.feedback.dto.request.GenerateCommentRequest;

import lombok.extern.slf4j.Slf4j;

/**
 * Groq-powered implementation of AI feedback generation.
 * Uses Llama 3 models via Groq's high-performance inference API.
 */
@Service
@Slf4j
public class GroqGeneratorServiceImpl implements AiGeneratorService {

    private final String apiKey;
    private final String apiUrl;
    private final String model;
    private final boolean enabled;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    // Constructor with configuration properties injected
    public GroqGeneratorServiceImpl(
            @Value("${feedback.ai.groq.api-key:}") String apiKey,
            @Value("${feedback.ai.groq.api-url:https://api.groq.com/openai/v1/chat/completions}") String apiUrl,
            @Value("${feedback.ai.groq.model:llama-3.3-70b-versatile}") String model,
            @Value("${feedback.ai.groq.enabled:true}") boolean enabled,
            ObjectMapper objectMapper) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.model = model;
        this.enabled = enabled;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    // Main method to generate feedback comment using Groq API
    @Override
    public String generate(GenerateCommentRequest request) {
        if (!isEnabled()) {
            log.warn("Groq AI is disabled or API Key is missing.");
            return null;
        }

        try {
            String prompt = buildPrompt(request);
            if (request.isForceRefresh()) {
                prompt += String.format("\nVariation nonce: %d", System.currentTimeMillis());
            }

            double temperature = request.isForceRefresh() ? 0.9 : 0.7;

            String requestBody = objectMapper.writeValueAsString(Map.of(
                "model", model,
                "messages", List.of(
                    Map.of("role", "system", "content", "You are a professional tutor assistant. Generate feedback comments based on student performance. " +
                            "Match the requested TONE and LENGTH. Output ONLY the comment text in the requested LANGUAGE."),
                    Map.of("role", "user", "content", prompt)
                ),
                "temperature", temperature,
                "max_tokens", 300
            ));

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("Groq API error: {} - {}", response.statusCode(), response.body());
                return null;
            }

            JsonNode root = objectMapper.readTree(response.body());
            return root.path("choices").get(0).path("message").path("content").asText().trim();

        } catch (Exception e) {
            log.error("Failed to generate comment with Groq: {}", e.getMessage());
            return null;
        }
    }

    @Override
    public boolean isEnabled() {
        return enabled && apiKey != null && !apiKey.isEmpty();
    }

    // Helper method to build a detailed prompt for the Groq model based on the request parameters
    private String buildPrompt(GenerateCommentRequest request) {
        String student = (request.getStudentName() != null) ? request.getStudentName() : "Con";
        String lang = (request.getLanguage() != null) ? request.getLanguage() : "Vietnamese";
        String subject = (request.getSubject() != null) ? request.getSubject() : "the current subject";
        String kws = (request.getKeywords() != null && !request.getKeywords().isEmpty()) 
                ? String.join(", ", request.getKeywords()) : "general performance";
        String tone = (request.getTone() != null) ? request.getTone() : "PROFESSIONAL";
        String length = (request.getLength() != null) ? request.getLength() : "MEDIUM";

        String lengthInstruction;
        switch (length.toUpperCase()) {
            case "SHORT": lengthInstruction = "MAXIMUM 2 sentences, VERY COMPACT (under 100 characters)."; break;
            case "LONG": lengthInstruction = "At least 4-5 sentences, VERY DETAILED and specific (approx 300-400 characters)."; break;
            default: lengthInstruction = "Approx 2-3 sentences (MEDIUM length)."; break;
        }

        return String.format(
            "CRITICAL: You are a professional tutor. Generate feedback for student '%s'.\n" +
            "CONSTRAINTS:\n" +
            "- Language: %s\n" +
            "- Tone: %s (STRICTLY follow this style)\n" +
            "- Length: %s\n" +
            "- Subject: %s\n" +
            "- Keywords to include (incorporate naturally): %s\n" +
            "- Rating: %s (%s)\n\n" +
            "INSTRUCTIONS:\n" +
            "1. Output ONLY the response text.\n" +
            "2. Use appropriate Vietnamese pronouns (con/em/%s).\n" +
            "3. STRENGTH: If 'Xuất sắc' or 'Giỏi', be very encouraging. If 'Khá' or below, be constructive but supportive.\n" +
            "4. MANDATORY: Follow the Length Constraint: %s",
            student, lang, tone, length, subject, kws, request.getRatingLevel(), request.getCategory(), student, lengthInstruction
        );
    }
}
