package com.tutor_management.backend.modules.onlinesession.security;

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
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final RoomTokenService roomTokenService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("Authorization");

            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
                try {
                    // 1. Validate ROOM token directly
                    Claims claims = roomTokenService.validateToken(token);

                    // 2. Extract roomId, userId and role from the token
                    Long userId = roomTokenService.extractUserId(token);
                    String roomId = roomTokenService.extractRoomId(token);
                    String roleName = roomTokenService.extractRole(token);

                    // 3. Set Principal with userId as name for easy access in controllers
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userId.toString(),
                            null,
                            Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + roleName))
                    );

                    accessor.setUser(auth);

                    // 4. Store roomId and role in session attributes for future use
                    Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                    if (sessionAttributes != null) {
                        sessionAttributes.put("roomId", roomId);
                        sessionAttributes.put("role", roleName);
                    }

                    log.info("WebSocket user authenticated: userId={}, roomId={}, role={}", userId, roomId, roleName);
                } catch (Exception e) {
                    log.error("WebSocket authentication failed: {}", e.getMessage());
                }
            } else {
                log.warn("WebSocket CONNECT attempted without valid Authorization header");
            }
        }

        return message;
    }
}
