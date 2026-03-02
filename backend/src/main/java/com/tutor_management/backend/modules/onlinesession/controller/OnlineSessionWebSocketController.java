package com.tutor_management.backend.modules.onlinesession.controller;

import com.tutor_management.backend.modules.onlinesession.dto.request.*;
import com.tutor_management.backend.modules.onlinesession.dto.response.ChatMessageResponse;
import com.tutor_management.backend.modules.onlinesession.dto.response.TypingResponse;
import com.tutor_management.backend.modules.onlinesession.service.ChatService;
import com.tutor_management.backend.modules.onlinesession.service.OnlineSessionService;
import com.tutor_management.backend.modules.onlinesession.service.WhiteboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

/**
 * WebSocket controller for handling real-time messages within online sessions.
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class OnlineSessionWebSocketController {

    private final OnlineSessionService onlineSessionService;
    private final ChatService chatService;
    private final WhiteboardService whiteboardService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Handles heartbeat messages from clients to keep the session alive and detect disconnects.
     * Expects messages to be sent to /app/room/{roomId}/heartbeat
     * 
     * @param roomId The unique room identifier.
     * @param principal The authenticated user's principal.
     */
    @MessageMapping("/room/{roomId}/heartbeat")
    public void handleHeartbeat(@DestinationVariable String roomId, Principal principal) {
        if (principal == null) {
            log.warn("Heartbeat received without authentication for room: {}", roomId);
            return;
        }

        try {
            Long userId = Long.parseLong(principal.getName());
            onlineSessionService.updateHeartbeat(roomId, userId);
        } catch (NumberFormatException e) {
            log.error("Invalid userId in principal name: {}", principal.getName());
        } catch (Exception e) {
            log.error("Error processing heartbeat for room {}: {}", roomId, e.getMessage());
        }
    }

    /**
     * Handles explicit join notifications from clients.
     * Expects messages at /app/room/{roomId}/join
     */
    @MessageMapping("/room/{roomId}/join")
    public void handleJoin(@DestinationVariable String roomId, Principal principal) {
        if (principal == null) return;
        try {
            Long userId = Long.parseLong(principal.getName());
            onlineSessionService.notifyUserJoined(roomId, userId);
        } catch (NumberFormatException e) {
            log.error("Invalid userId in principal name: {}", principal.getName());
        }
    }

    /**
     * Handles explicit leave notifications from clients.
     * Expects messages at /app/room/{roomId}/leave
     */
    @MessageMapping("/room/{roomId}/leave")
    public void handleLeave(@DestinationVariable String roomId, Principal principal) {
        if (principal == null) return;
        try {
            Long userId = Long.parseLong(principal.getName());
            onlineSessionService.notifyUserLeft(roomId, userId);
        } catch (NumberFormatException e) {
            log.error("Invalid userId in principal name: {}", principal.getName());
        }
    }

    /**
     * Handles incoming chat messages from participants.
     * Persists the message to the database and broadcasts it to all room participants.
     * Expects messages at /app/room/{roomId}/chat
     * 
     * @param roomId The room ID
     * @param request The chat message request
     * @param principal The sender's principal
     */
    @MessageMapping("/room/{roomId}/chat")
    public void handleChatMessage(
            @DestinationVariable String roomId, 
            com.tutor_management.backend.modules.onlinesession.dto.request.ChatMessageRequest request, 
            Principal principal) {
        
        if (principal == null) {
            log.warn("Chat message received without authentication for room: {}", roomId);
            return;
        }

        try {
            Long userId = Long.parseLong(principal.getName());
            ChatMessageResponse response =
                    chatService.saveMessage(roomId, userId, request);
            
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/chat", response);
            log.debug("Chat message from user {} broadcasted to room {}", userId, roomId);
        } catch (Exception e) {
            log.error("Error processing chat message for room {}: {}", roomId, e.getMessage());
        }
    }

    /**
     * Handles typing status notifications from participants.
     * Broadcasts the "is typing" status to all room participants.
     * 
     * @param roomId The room ID
     * @param request The typing status request
     * @param principal The sender's principal
     */
    @MessageMapping("/room/{roomId}/typing")
    public void handleTypingStatus(
            @DestinationVariable String roomId,
            TypingRequest request,
            Principal principal) {
        
        if (principal == null) return;

        try {
            Long userId = Long.parseLong(principal.getName());
            TypingResponse response =
                    chatService.createTypingResponse(userId, request.isTyping());
            
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/typing", response);
        } catch (Exception e) {
            log.error("Error processing typing status for room {}: {}", roomId, e.getMessage());
        }
    }

    /**
     * Handles whiteboard drawing actions (complete strokes sent on endStroke).
     * Broadcasts the complete stroke data to all participants in the room.
     * 
     * ✅ FIX: Now properly deserializes WhiteboardStrokeMessage to preserve userId
     * for client-side echo cancellation.
     * 
     * @param roomId The room ID
     * @param payload The complete stroke message with full stroke data
     */
    @MessageMapping("/room/{roomId}/whiteboard")
    public void handleWhiteboardDraw(
            @DestinationVariable String roomId,
            WhiteboardStrokeMessage payload) {
        
        // ✅ Validate payload structure
        if (payload == null || payload.getStroke() == null) {
            log.warn("Received invalid whiteboard stroke message for room {}", roomId);
            return;
        }
        
        // ✅ Log for debugging (remove in production if needed)
        log.debug("Whiteboard stroke for room {}: strokeId={}, userId={}, points={}", 
            roomId, 
            payload.getStroke().getId(), 
            payload.getStroke().getUserId(),
            payload.getStroke().getPoints() != null ? payload.getStroke().getPoints().size() : 0);
        
        // ✅ Persist stroke to DB
        whiteboardService.saveStroke(roomId, payload.getStroke());
        
        // ✅ Broadcast with properly preserved structure
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/whiteboard", payload);
    }

    /**
     * Handles whiteboard delta messages (point batches during drawing).
     * Broadcasts the delta to all participants for real-time synchronization.
     * Reduces payload size by 80%+ compared to sending complete strokes.
     * 
     * ✅ FIX: Now properly deserializes WhiteboardDeltaMessage to preserve userId
     * for client-side echo cancellation.
     * 
     * @param roomId The room ID
     * @param payload The delta message with new points
     */
    @MessageMapping("/room/{roomId}/whiteboard/delta")
    public void handleWhiteboardDelta(
            @DestinationVariable String roomId,
            WhiteboardDeltaMessage payload) {
        
        // ✅ Validate payload structure
        if (payload == null || payload.getStrokeId() == null) {
            log.warn("Received invalid whiteboard delta message for room {}", roomId);
            return;
        }
        
        // ✅ Log for debugging (remove in production if needed)
        log.debug("Whiteboard delta for room {}: strokeId={}, userId={}, points={}", 
            roomId, 
            payload.getStrokeId(), 
            payload.getUserId(),
            payload.getPoints() != null ? payload.getPoints().size() : 0);
        
        // ✅ Broadcast with properly preserved structure
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/whiteboard/delta", payload);
    }

    /**
     * Handles whiteboard clear actions.
     * Broadcasts clear command to all participants.
     * Now supports clearing only specific user's strokes.
     * 
     * @param roomId The room ID
     * @param payload The clear message with optional userId
     */
    @MessageMapping("/room/{roomId}/whiteboard/clear")
    public void handleWhiteboardClear(
            @DestinationVariable String roomId,
            com.tutor_management.backend.modules.onlinesession.dto.request.WhiteboardClearMessage payload) {
        
        // ✅ Validate payload structure
        if (payload == null) {
            log.warn("Received invalid whiteboard clear message for room {}", roomId);
            return;
        }
        
        // ✅ Log for debugging
        log.debug("Whiteboard clear for room {}: userId={}", roomId, payload.getUserId());
        
        // ✅ Persist clear command to DB
        whiteboardService.clearStrokes(roomId, payload.getUserId());
        
        // ✅ Broadcast with properly preserved structure
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/whiteboard/clear", payload);
    }

    /**
     * Handles whiteboard undo actions.
     * Broadcasts undo command with stroke ID to all participants.
     * 
     * ✅ FIX: Now properly deserializes WhiteboardUndoMessage
     * 
     * @param roomId The room ID
     * @param payload The undo message with stroke ID to remove
     */
    @MessageMapping("/room/{roomId}/whiteboard/undo")
    public void handleWhiteboardUndo(
            @DestinationVariable String roomId,
            WhiteboardUndoMessage payload) {

        // ✅ Validate payload structure
        if (payload == null || payload.getId() == null) {
            log.warn("Received invalid whiteboard undo message for room {}", roomId);
            return;
        }

        // ✅ Log for debugging
        log.debug("Whiteboard undo for room {}: strokeId={}", roomId, payload.getId());

        // ✅ Persist undo command to DB
        whiteboardService.deleteStroke(roomId, payload.getId());

        // ✅ Broadcast with properly preserved structure
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/whiteboard/undo", payload);
    }
    /**
     * Handles WebRTC signaling messages (Offer, Answer, ICE Candidate).
     * Forwards the signal to the receiver specified in the payload.
     * 
     * @param roomId The room ID
     * @param signal The signaling message
     */
    @MessageMapping("/room/{roomId}/signal")
    public void handleWebRTCSignal(
            @DestinationVariable String roomId,
            WebRTCSignalMessage signal) {
        
        if (signal == null || signal.getReceiverId() == null) {
            log.warn("Received invalid WebRTC signal for room {}", roomId);
            return;
        }

        log.debug("WebRTC signal in room {}: type={}, from={}, to={}", 
            roomId, signal.getType(), signal.getSenderId(), signal.getReceiverId());

        // Forward the signal to the specific receiver
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/signal/" + signal.getReceiverId(), signal);
    }
}
