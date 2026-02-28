package com.tutor_management.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;

import java.util.LinkedHashMap;
import java.util.Map;

public class CustomOAuth2AuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private final OAuth2AuthorizationRequestResolver defaultResolver;

    public CustomOAuth2AuthorizationRequestResolver(ClientRegistrationRepository clientRegistrationRepository) {
        this.defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(clientRegistrationRepository, "/oauth2/authorization");
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request) {
        OAuth2AuthorizationRequest authorizationRequest = defaultResolver.resolve(request);
        return customize(authorizationRequest, request);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest request, String clientRegistrationId) {
        OAuth2AuthorizationRequest authorizationRequest = defaultResolver.resolve(request, clientRegistrationId);
        return customize(authorizationRequest, request);
    }

    private OAuth2AuthorizationRequest customize(OAuth2AuthorizationRequest authorizationRequest, HttpServletRequest request) {
        if (authorizationRequest == null) {
            return null;
        }

        String role = request.getParameter("role");
        if (role != null) {
            Map<String, Object> additionalParameters = new LinkedHashMap<>(authorizationRequest.getAdditionalParameters());
            additionalParameters.put("role_hint", role);
            
            // 1. Store it in session (Existing logic - works for local)
            request.getSession().setAttribute("OAUTH2_ROLE_HINT", role);

            // 2. Store it in a Secure, Cross-Site Cookie (Fix for Production/Railway)
            try {
                org.springframework.web.context.request.ServletRequestAttributes attr = 
                    (org.springframework.web.context.request.ServletRequestAttributes) 
                    org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes();
                jakarta.servlet.http.HttpServletResponse response = attr.getResponse();
                
                if (response != null) {
                    // Manual header for SameSite=None support
                    String cookieHeader = String.format("OAUTH2_ROLE_HINT=%s; Path=/; Max-Age=300; HttpOnly; Secure; SameSite=None", role);
                    response.addHeader("Set-Cookie", cookieHeader);
                }
            } catch (Exception e) {
                // Fallback: log error but continue with session-only
            }
            
            return OAuth2AuthorizationRequest.from(authorizationRequest)
                    .additionalParameters(additionalParameters)
                    .build();
        }

        return authorizationRequest;
    }
}
