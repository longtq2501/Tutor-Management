package com.tutor_management.backend.modules.onlinesession.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for WebRTC signaling messages (Offer, Answer, ICE Candidate).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebRTCSignalMessage {
    /**
     * Type of signaling message: 'offer', 'answer', or 'candidate'.
     */
    private String type;

    /**
     * The actual signaling data (SDP string or ICE candidate JSON string).
     */
    private Object data;

    /**
     * The ID of the user sending the signal.
     */
    private Long senderId;

    /**
     * The ID of the user intended to receive the signal.
     */
    private Long receiverId;
}
