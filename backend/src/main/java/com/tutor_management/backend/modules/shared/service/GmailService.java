package com.tutor_management.backend.modules.shared.service;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import jakarta.activation.DataHandler;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import jakarta.mail.util.ByteArrayDataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;
import java.util.Properties;

@Service
@RequiredArgsConstructor
@Slf4j
public class GmailService {

    private final UserRepository userRepository;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    @Value("${app.gmail.enabled:true}")
    private boolean gmailEnabled;

    public void sendFromTutor(Long tutorUserId, String toEmail, String subject,
                              String htmlBody, byte[] attachmentBytes, String attachmentName) {
        if (!gmailEnabled) {
            throw new RuntimeException("Gmail API đang tắt trên hệ thống.");
        }

        User tutor = userRepository.findById(tutorUserId)
                .orElseThrow(() -> new RuntimeException("Tutor not found"));

        if (tutor.getGoogleRefreshToken() == null || tutor.getGoogleRefreshToken().isBlank()) {
            throw new RuntimeException("Tutor chưa kết nối Gmail. Vui lòng đăng nhập lại bằng Google.");
        }

        String accessToken = getValidAccessToken(tutor);
        sendViaGmailApi(accessToken, tutor.getEmail(), toEmail, subject, htmlBody, attachmentBytes, attachmentName);
    }

    public boolean isConnected(Long userId) {
        return userRepository.findById(userId)
                .map(user -> user.getGoogleRefreshToken() != null && !user.getGoogleRefreshToken().isBlank())
                .orElse(false);
    }

    private String getValidAccessToken(User tutor) {
        if (tutor.getGoogleAccessToken() != null
                && tutor.getGoogleTokenExpiry() != null
                && tutor.getGoogleTokenExpiry().isAfter(LocalDateTime.now().plusMinutes(5))) {
            return tutor.getGoogleAccessToken();
        }
        return refreshAccessToken(tutor);
    }

    private String refreshAccessToken(User tutor) {
        try {
            RestTemplate restTemplate = new RestTemplate();

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("client_id", clientId);
            params.add("client_secret", clientSecret);
            params.add("refresh_token", tutor.getGoogleRefreshToken());
            params.add("grant_type", "refresh_token");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://oauth2.googleapis.com/token",
                    new HttpEntity<>(params, headers),
                    Map.class
            );

            Map<String, Object> body = response.getBody();
            if (body == null || body.get("access_token") == null) {
                throw new RuntimeException("Google token response is empty");
            }

            String newAccessToken = (String) body.get("access_token");
            Number expiresIn = (Number) body.getOrDefault("expires_in", 3600);

            tutor.setGoogleAccessToken(newAccessToken);
            tutor.setGoogleTokenExpiry(LocalDateTime.now().plusSeconds(expiresIn.longValue()));
            userRepository.save(tutor);

            return newAccessToken;
        } catch (Exception e) {
            throw new RuntimeException("Không thể refresh Google token. Gia sư cần đăng nhập lại bằng Google.", e);
        }
    }

    private void sendViaGmailApi(String accessToken, String fromEmail, String toEmail,
                                 String subject, String htmlBody,
                                 byte[] attachmentBytes, String attachmentName) {
        try {
            Session mailSession = Session.getDefaultInstance(new Properties());
            MimeMessage mimeMessage = new MimeMessage(mailSession);

            mimeMessage.setFrom(new InternetAddress(fromEmail));
            mimeMessage.addRecipient(Message.RecipientType.TO, new InternetAddress(toEmail));
            mimeMessage.setSubject(subject, "UTF-8");

            MimeMultipart multipart = new MimeMultipart();

            MimeBodyPart bodyPart = new MimeBodyPart();
            bodyPart.setContent(htmlBody, "text/html; charset=UTF-8");
            multipart.addBodyPart(bodyPart);

            if (attachmentBytes != null && attachmentName != null) {
                MimeBodyPart attachPart = new MimeBodyPart();
                attachPart.setDataHandler(new DataHandler(new ByteArrayDataSource(attachmentBytes, "application/pdf")));
                attachPart.setFileName(attachmentName);
                multipart.addBodyPart(attachPart);
            }

            mimeMessage.setContent(multipart);

            ByteArrayOutputStream buffer = new ByteArrayOutputStream();
            mimeMessage.writeTo(buffer);
            String encodedEmail = Base64.getUrlEncoder().encodeToString(buffer.toByteArray());

            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = Map.of("raw", encodedEmail);

            restTemplate.postForEntity(
                    "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                    new HttpEntity<>(body, headers),
                    Map.class
            );

            log.info("Gmail sent successfully from {} to {}", fromEmail, toEmail);
        } catch (Exception e) {
            log.error("Failed to send Gmail from {} to {}: {}", fromEmail, toEmail, e.getMessage());
            throw new RuntimeException("Gửi Gmail thất bại: " + e.getMessage(), e);
        }
    }
}
