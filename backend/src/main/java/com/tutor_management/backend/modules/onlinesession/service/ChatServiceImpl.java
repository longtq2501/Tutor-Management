package com.tutor_management.backend.modules.onlinesession.service;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.onlinesession.dto.request.ChatMessageRequest;
import com.tutor_management.backend.modules.onlinesession.dto.response.ChatMessageResponse;
import com.tutor_management.backend.modules.onlinesession.dto.response.TypingResponse;
import com.tutor_management.backend.modules.onlinesession.entity.ChatMessage;
import com.tutor_management.backend.modules.onlinesession.entity.OnlineSession;
import com.tutor_management.backend.modules.onlinesession.exception.RoomNotFoundException;
import com.tutor_management.backend.modules.onlinesession.repository.ChatMessageRepository;
import com.tutor_management.backend.modules.onlinesession.repository.OnlineSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of ChatService using JPA repository.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final OnlineSessionRepository onlineSessionRepository;
    private final UserRepository userRepository;

    /**
     * Saves a chat message to the database.
     *
     * @param roomId  the ID of the chat room
     * @param userId  the ID of the user sending the message
     * @param request the chat message request containing the message content
     * @return a response containing the saved chat message details
     */
    @Override
    @Transactional
    public ChatMessageResponse saveMessage(String roomId, Long userId, ChatMessageRequest request) {
        log.info("Saving chat message for room {} by user {}", roomId, userId);

        OnlineSession session = onlineSessionRepository.findByRoomId(roomId)
                .orElseThrow(() -> new RoomNotFoundException("Room not found: " + roomId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));

        ChatMessage message = ChatMessage.builder()
                .roomId(roomId)
                .senderId(userId)
                .senderName(user.getFullName())
                .senderRole(user.getRole().getName())
                .content(request.getContent())
                .build();

        ChatMessage saved = chatMessageRepository.save(message);

        return mapToResponse(saved);
    }

    /**
     * Retrieves paginated chat messages for a given room.
     *
     * @param roomId   the ID of the chat room
     * @param pageable pagination information
     * @return a page of chat message responses
     */
    @Override
    @Transactional(readOnly = true)
    public Page<ChatMessageResponse> getMessages(String roomId, Pageable pageable) {
        log.info("Fetching messages for room {} with pagination", roomId);
        
        // Ensure room exists
        if (!onlineSessionRepository.existsByRoomId(roomId)) {
            throw new RoomNotFoundException("Room not found: " + roomId);
        }

        return chatMessageRepository.findByRoomIdOrderByTimestampDesc(roomId, pageable)
                .map(this::mapToResponse);
    }

    /**
     * Creates a typing response indicating whether a user is typing.
     *
     * @param userId   the ID of the user
     * @param isTyping whether the user is currently typing
     * @return a response containing the user's typing status
     */
    @Transactional(readOnly = true)
    @Override
    public TypingResponse createTypingResponse(Long userId, boolean isTyping) {
        String fullName = getUserFullName(userId);

        return TypingResponse.builder()
                .userId(userId)
                .userName(fullName)
                .typing(isTyping)
                .build();
    }

    /**
     * Retrieves the full name of a user by their ID, with caching to improve performance.
     *
     * @param userId the ID of the user
     * @return the full name of the user
     */
    @Cacheable(value = "userNames", key = "#userId")
    public String getUserFullName(Long userId) {
        return userRepository.findById(userId)
                .map(User::getFullName)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userId));
    }

    /**
     * Maps a ChatMessage entity to a ChatMessageResponse DTO.
     *
     * @param message the ChatMessage entity to map
     * @return the corresponding ChatMessageResponse DTO
     */
    private ChatMessageResponse mapToResponse(ChatMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId())
                .roomId(message.getRoomId())
                .senderId(message.getSenderId())
                .senderName(message.getSenderName())
                .senderRole(message.getSenderRole())
                .content(message.getContent())
                .timestamp(message.getTimestamp())
                .build();
    }
}
