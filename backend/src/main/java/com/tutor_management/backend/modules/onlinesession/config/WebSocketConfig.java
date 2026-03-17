package com.tutor_management.backend.modules.onlinesession.config;

import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.auth.service.JwtService;
import com.tutor_management.backend.modules.onlinesession.security.RoomTokenService;
import com.tutor_management.backend.modules.onlinesession.security.WebSocketAuthInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configuration for WebSocket message broker using STOMP.
 * Enables real-time communication for live teaching sessions.
 */
@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final RoomTokenService roomTokenService;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public WebSocketAuthInterceptor webSocketAuthInterceptor() {
        return new WebSocketAuthInterceptor(roomTokenService, jwtService, userRepository);
    }

    @Value("${app.online-session.websocket.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple memory-based message broker to carry the messages back to the client
        // on destinations prefixed with /topic, /queue or /user
        config.enableSimpleBroker("/topic", "/queue", "/user");

        // Designate the /app prefix for messages that are bound for methods annotated with @MessageMapping
        config.setApplicationDestinationPrefixes("/app");

        // Prefix for user-specific messaging (e.g. /user/queue/notifications)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register the "/ws/room" endpoint for WebSocket handshake
        // Supports SockJS fallback for browsers that don't support WebSocket
        registry.addEndpoint("/ws/room")
                .setAllowedOrigins(allowedOrigins.split(","))
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(webSocketAuthInterceptor());
    }
}
