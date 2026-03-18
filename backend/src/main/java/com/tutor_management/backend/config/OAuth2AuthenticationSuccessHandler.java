package com.tutor_management.backend.config;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.auth.service.JwtService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ServletException("User not found after successful OAuth2 authentication"));

        String token = jwtService.generateToken(user);

        String redirectBaseUrl = resolveRedirectBaseUrl(request);

        String targetUrl = UriComponentsBuilder.fromUriString(redirectBaseUrl + "/auth/success")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }

    private String resolveRedirectBaseUrl(HttpServletRequest request) {
        Optional<String> redirectUri = CookieUtils
                .getCookie(request, HttpCookieOAuth2AuthorizationRequestRepository.REDIRECT_URI_PARAM_COOKIE_NAME)
                .map(jakarta.servlet.http.Cookie::getValue)
                .filter(this::isAllowedRedirectUri);

        if (redirectUri.isPresent()) {
            return normalizeBaseUrl(redirectUri.get());
        }

        return normalizeBaseUrl(frontendUrl);
    }

    private boolean isAllowedRedirectUri(String uri) {
        URI clientRedirect;
        try {
            clientRedirect = new URI(uri);
        } catch (URISyntaxException e) {
            return false;
        }

        if (clientRedirect.getHost() == null || clientRedirect.getScheme() == null) {
            return false;
        }

        List<String> allowed = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isBlank())
                .toList();

        for (String allowedOrigin : allowed) {
            try {
                URI allowedUri = new URI(allowedOrigin);
                boolean sameHost = clientRedirect.getHost().equalsIgnoreCase(allowedUri.getHost());
                boolean sameScheme = clientRedirect.getScheme().equalsIgnoreCase(allowedUri.getScheme());
                int clientPort = clientRedirect.getPort() == -1 ? defaultPort(clientRedirect.getScheme()) : clientRedirect.getPort();
                int allowedPort = allowedUri.getPort() == -1 ? defaultPort(allowedUri.getScheme()) : allowedUri.getPort();
                if (sameHost && sameScheme && clientPort == allowedPort) {
                    return true;
                }
            } catch (URISyntaxException ignored) {
                // Ignore invalid configured origin entries
            }
        }

        return false;
    }

    private String normalizeBaseUrl(String rawUrl) {
        String trimmed = rawUrl == null ? "" : rawUrl.trim();
        if (trimmed.endsWith("/")) {
            return trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }

    private int defaultPort(String scheme) {
        return "https".equalsIgnoreCase(scheme) ? 443 : 80;
    }
}
