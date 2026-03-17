package com.tutor_management.backend.modules.onlinesession.security;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.auth.service.JwtService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;

/**
 * Interceptor for WebSocket messages to handle authentication.
 * Extracts JWT from CONNECT headers and sets the SecurityContext Principal.
 *
 * <p>Supports two token types:
 * <ol>
 *   <li><b>Room token</b> – short-lived token scoped to a live-teaching room. Used by the
 *       live-room feature. Principal name = userId string, session attributes include roomId.</li>
 *   <li><b>Main app JWT</b> – the standard application JWT. Used by the support-chat feature
 *       and any future non-room-scoped WebSocket handler.</li>
 * </ol>
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final RoomTokenService roomTokenService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String rawHeader = accessor.getFirstNativeHeader("Authorization");

            if (rawHeader != null && rawHeader.startsWith("Bearer ")) {
                String token = rawHeader.substring(7);

                // ── Attempt 1: room-scoped token ──────────────────────────────────────
                if (tryAuthenticateRoomToken(token, accessor)) {
                    return message;
                }

                // ── Attempt 2: main app JWT ──────────────────────────────────────────
                if (tryAuthenticateAppJwt(token, accessor)) {
                    return message;
                }

                log.warn("WebSocket CONNECT: token validation failed for all strategies");
            } else {
                log.warn("WebSocket CONNECT attempted without valid Authorization header");
            }
        }

        return message;
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private boolean tryAuthenticateRoomToken(String token, StompHeaderAccessor accessor) {
        try {
            Claims claims = roomTokenService.validateToken(token);
            Long userId = roomTokenService.extractUserId(token);
            String roomId = roomTokenService.extractRoomId(token);
            String roleName = roomTokenService.extractRole(token);

            setAuthPrincipal(accessor, userId.toString(), roleName);

            Map<String, Object> attrs = accessor.getSessionAttributes();
            if (attrs != null) {
                attrs.put("roomId", roomId);
                attrs.put("role", roleName);
            }

            log.info("WebSocket authenticated via room token: userId={}, roomId={}, role={}", userId, roomId, roleName);
            return true;
        } catch (Exception e) {
            log.debug("Room token validation failed, trying main JWT: {}", e.getMessage());
            return false;
        }
    }

    private boolean tryAuthenticateAppJwt(String token, StompHeaderAccessor accessor) {
        try {
            String email = jwtService.extractUsername(token);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalStateException("User not found: " + email));

            if (!jwtService.isTokenValid(token, user)) {
                log.warn("Main JWT is invalid or expired for user: {}", email);
                return false;
            }

            String roleName = user.getRole().getName();
            setAuthPrincipal(accessor, user.getId().toString(), roleName);

            log.info("WebSocket authenticated via app JWT: userId={}, email={}, role={}", user.getId(), email, roleName);
            return true;
        } catch (Exception e) {
            log.debug("Main JWT validation failed: {}", e.getMessage());
            return false;
        }
    }

    private void setAuthPrincipal(StompHeaderAccessor accessor, String principalName, String roleName) {
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principalName,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + roleName))
        );
        accessor.setUser(auth);
    }
}
