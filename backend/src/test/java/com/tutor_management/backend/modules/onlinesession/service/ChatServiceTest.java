package com.tutor_management.backend.modules.onlinesession.service;

import com.tutor_management.backend.modules.auth.RoleEntity;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import com.tutor_management.backend.modules.onlinesession.dto.request.ChatMessageRequest;
import com.tutor_management.backend.modules.onlinesession.dto.response.ChatMessageResponse;
import com.tutor_management.backend.modules.onlinesession.entity.ChatMessage;
import com.tutor_management.backend.modules.onlinesession.entity.OnlineSession;
import com.tutor_management.backend.modules.onlinesession.exception.RoomNotFoundException;
import com.tutor_management.backend.modules.onlinesession.repository.ChatMessageRepository;
import com.tutor_management.backend.modules.onlinesession.repository.OnlineSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChatServiceTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private OnlineSessionRepository onlineSessionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ChatServiceImpl chatService;

    private String roomId = "test-room";
    private Long userId = 1L;
    private User testUser;
    private ChatMessageRequest chatRequest;

    @BeforeEach
    void setUp() {
        RoleEntity role = RoleEntity.builder().name("TUTOR").build();
        testUser = User.builder()
                .id(userId)
                .fullName("Test User")
                .role(role)
                .build();

        chatRequest = new ChatMessageRequest("Hello world");
    }

    @Test
    void saveMessage_Success() {
        // Arrange
        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.of(new OnlineSession()));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        
        ChatMessage savedEntity = ChatMessage.builder()
                .id(1L)
                .roomId(roomId)
                .senderId(userId)
                .senderName("Test User")
                .senderRole("TUTOR")
                .content("Hello world")
                .timestamp(LocalDateTime.now())
                .build();
        
        when(chatMessageRepository.save(any(ChatMessage.class))).thenReturn(savedEntity);

        // Act
        ChatMessageResponse response = chatService.saveMessage(roomId, userId, chatRequest);

        // Assert
        assertNotNull(response);
        assertEquals("Hello world", response.getContent());
        assertEquals("Test User", response.getSenderName());
        verify(chatMessageRepository, times(1)).save(any(ChatMessage.class));
    }

    @Test
    void saveMessage_RoomNotFound_ThrowsException() {
        // Arrange
        when(onlineSessionRepository.findByRoomId(roomId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(RoomNotFoundException.class, () -> chatService.saveMessage(roomId, userId, chatRequest));
    }

    @Test
    void getMessages_Success() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        ChatMessage message = ChatMessage.builder()
                .id(1L)
                .roomId(roomId)
                .content("Test Content")
                .senderName("Sender")
                .senderRole("STUDENT")
                .timestamp(LocalDateTime.now())
                .build();
        
        Page<ChatMessage> messagePage = new PageImpl<>(List.of(message), pageable, 1);
        
        when(onlineSessionRepository.existsByRoomId(roomId)).thenReturn(true);
        when(chatMessageRepository.findByRoomIdOrderByTimestampDesc(eq(roomId), any(Pageable.class)))
                .thenReturn(messagePage);

        // Act
        Page<ChatMessageResponse> result = chatService.getMessages(roomId, pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Test Content", result.getContent().get(0).getContent());
        verify(chatMessageRepository).findByRoomIdOrderByTimestampDesc(roomId, pageable);
    }

    @Test
    void getMessages_RoomNotFound_ThrowsException() {
        // Arrange
        when(onlineSessionRepository.existsByRoomId(roomId)).thenReturn(false);

        // Act & Assert
        assertThrows(RoomNotFoundException.class, () -> chatService.getMessages(roomId, PageRequest.of(0, 10)));
    }
}
