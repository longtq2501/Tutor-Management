package com.tutor_management.backend.modules.support.dto.request;

import lombok.Data;

/**
 * Payload for sending a support message via WebSocket or REST.
 * {@code type} is optional — defaults to TEXT.
 */
@Data
public class SupportMessageRequest {

    private String content;

    /** TEXT, BUG_REPORT, or FEATURE_REQUEST. Nullable — defaults to TEXT when absent. */
    private String type;
}
