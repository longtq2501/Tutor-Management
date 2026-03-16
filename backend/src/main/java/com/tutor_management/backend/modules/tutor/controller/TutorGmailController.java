package com.tutor_management.backend.modules.tutor.controller;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/tutor")
@RequiredArgsConstructor
@Slf4j
public class TutorGmailController {

    private static final String GMAIL_CONNECT_EMAIL_COOKIE = "GMAIL_CONNECT_EMAIL";
    private static final String GMAIL_CONNECT_STATE_COOKIE = "GMAIL_CONNECT_STATE";

    private final UserRepository userRepository;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Value("${app.backend.url:http://localhost:8080}")
    private String backendUrl;

    @Value("${spring.security.oauth2.client.registration.google.client-id}")
    private String clientId;

    @Value("${spring.security.oauth2.client.registration.google.client-secret}")
    private String clientSecret;

    @GetMapping("/gmail-status")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<Map<String, Object>> getGmailStatus(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        return ResponseEntity.ok(Map.of(
                "connected", user.getGoogleRefreshToken() != null && !user.getGoogleRefreshToken().isBlank(),
                "email", user.getEmail()
        ));
    }

    @GetMapping("/gmail/connect")
    @PreAuthorize("hasRole('TUTOR')")
    public void initiateGmailConnect(Authentication authentication, HttpServletRequest request, HttpServletResponse response) throws IOException {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        String state = UUID.randomUUID().toString();
        setFlowCookie(response, GMAIL_CONNECT_EMAIL_COOKIE, user.getEmail(), request.isSecure());
        setFlowCookie(response, GMAIL_CONNECT_STATE_COOKIE, state, request.isSecure());

        String redirectUri = backendUrl + "/api/tutor/gmail/connect/callback";
        String redirectUrl = UriComponentsBuilder.fromHttpUrl("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", "https://www.googleapis.com/auth/gmail.send")
                .queryParam("access_type", "offline")
                .queryParam("prompt", "consent")
                .queryParam("state", state)
                .queryParam("login_hint", user.getEmail())
                .build(true)
                .toUriString();

        response.sendRedirect(redirectUrl);
    }

    @GetMapping("/gmail/connect/callback")
    public void handleGmailConnectCallback(
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String error,
            HttpServletRequest request,
            HttpServletResponse response) throws IOException {

        if (error != null) {
            clearFlowCookies(response, request.isSecure());
            response.sendRedirect(buildSettingsRedirect("error", null));
            return;
        }

        String emailFromCookie = readCookie(request, GMAIL_CONNECT_EMAIL_COOKIE);
        String stateFromCookie = readCookie(request, GMAIL_CONNECT_STATE_COOKIE);

        if (code == null || code.isBlank() || emailFromCookie == null || stateFromCookie == null || !stateFromCookie.equals(state)) {
            clearFlowCookies(response, request.isSecure());
            response.sendRedirect(buildSettingsRedirect("error", "invalid_state"));
            return;
        }

        try {
            Map<String, String> tokens = exchangeCodeForTokens(code);
            String refreshToken = tokens.get("refresh_token");

            if (refreshToken == null || refreshToken.isBlank()) {
                log.warn("Google connect returned no refresh_token for user {}", emailFromCookie);
                clearFlowCookies(response, request.isSecure());
                response.sendRedirect(buildSettingsRedirect("error", "no_refresh_token"));
                return;
            }

            User user = userRepository.findByEmail(emailFromCookie)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

            user.setGoogleAccessToken(tokens.get("access_token"));
            user.setGoogleRefreshToken(refreshToken);
            user.setGoogleTokenExpiry(LocalDateTime.now().plusSeconds(Long.parseLong(tokens.get("expires_in"))));
            userRepository.save(user);

            clearFlowCookies(response, request.isSecure());
            response.sendRedirect(buildSettingsRedirect("connected", null));
        } catch (Exception e) {
            log.error("Gmail connect failed for {}: {}", emailFromCookie, e.getMessage());
            clearFlowCookies(response, request.isSecure());
            response.sendRedirect(buildSettingsRedirect("error", null));
        }
    }

    @DeleteMapping("/gmail/disconnect")
    @PreAuthorize("hasRole('TUTOR')")
    public ResponseEntity<Map<String, Object>> disconnectGmail(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        user.setGoogleAccessToken(null);
        user.setGoogleRefreshToken(null);
        user.setGoogleTokenExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("disconnected", true));
    }

    private Map<String, String> exchangeCodeForTokens(String code) {
        RestTemplate restTemplate = new RestTemplate();

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("code", code);
        params.add("grant_type", "authorization_code");
        params.add("redirect_uri", backendUrl + "/api/tutor/gmail/connect/callback");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        ResponseEntity<Map> tokenResponse = restTemplate.postForEntity(
                "https://oauth2.googleapis.com/token",
                new HttpEntity<>(params, headers),
                Map.class
        );

        Map<String, Object> body = tokenResponse.getBody();
        if (body == null || body.get("access_token") == null || body.get("expires_in") == null) {
            throw new RuntimeException("Google token response is invalid");
        }

        Map<String, String> result = new HashMap<>();
        result.put("access_token", (String) body.get("access_token"));
        result.put("refresh_token", body.get("refresh_token") != null ? String.valueOf(body.get("refresh_token")) : null);
        result.put("expires_in", String.valueOf(body.get("expires_in")));
        return result;
    }

    private void setFlowCookie(HttpServletResponse response, String name, String value, boolean secure) {
        String encodedValue = URLEncoder.encode(value, StandardCharsets.UTF_8);
        String cookieHeader = String.format(
                "%s=%s; Path=/; Max-Age=600; HttpOnly; SameSite=Lax%s",
                name,
                encodedValue,
                secure ? "; Secure" : ""
        );
        response.addHeader("Set-Cookie", cookieHeader);
    }

    private void clearFlowCookies(HttpServletResponse response, boolean secure) {
        response.addHeader("Set-Cookie", buildDeleteCookieHeader(GMAIL_CONNECT_EMAIL_COOKIE, secure));
        response.addHeader("Set-Cookie", buildDeleteCookieHeader(GMAIL_CONNECT_STATE_COOKIE, secure));
    }

    private String buildDeleteCookieHeader(String cookieName, boolean secure) {
        return String.format(
                "%s=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax%s",
                cookieName,
                secure ? "; Secure" : ""
        );
    }

    private String readCookie(HttpServletRequest request, String cookieName) {
        if (request.getCookies() == null) {
            return null;
        }

        for (var cookie : request.getCookies()) {
            if (cookieName.equals(cookie.getName())) {
                return java.net.URLDecoder.decode(cookie.getValue(), StandardCharsets.UTF_8);
            }
        }
        return null;
    }

    private String buildSettingsRedirect(String gmailStatus, String reason) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(frontendUrl + "/dashboard")
                .queryParam("view", "settings")
                .queryParam("gmail", gmailStatus);
        if (reason != null && !reason.isBlank()) {
            builder.queryParam("reason", reason);
        }
        return builder.build(true).toUriString();
    }
}
