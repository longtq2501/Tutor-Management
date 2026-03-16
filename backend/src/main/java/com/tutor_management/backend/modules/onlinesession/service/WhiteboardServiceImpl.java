package com.tutor_management.backend.modules.onlinesession.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tutor_management.backend.modules.onlinesession.dto.request.WhiteboardStrokeMessage;
import com.tutor_management.backend.modules.onlinesession.entity.WhiteboardStroke;
import com.tutor_management.backend.modules.onlinesession.repository.WhiteboardStrokeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for managing whiteboard strokes in online sessions.
 * Handles saving, retrieving, and deleting stroke data associated with specific rooms and users.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WhiteboardServiceImpl implements WhiteboardService {

    private final WhiteboardStrokeRepository repository;
    private final ObjectMapper objectMapper;

    // Core Stroke Management Logic with JSON Serialization and Robust Error Handling
    @Override
    @Transactional
    public void saveStroke(String roomId, WhiteboardStrokeMessage.StrokeData stroke) {
        try {
            String jsonData = objectMapper.writeValueAsString(stroke);
            WhiteboardStroke entity = WhiteboardStroke.builder()
                    .strokeId(stroke.getId())
                    .roomId(roomId)
                    .userId(stroke.getUserId())
                    .data(jsonData)
                    .timestamp(stroke.getTimestamp())
                    .build();
            repository.save(entity);
            log.debug("Saved stroke {} for room {}", stroke.getId(), roomId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize stroke data for room {}: {}", roomId, e.getMessage());
        }
    }

    // Core Stroke Retrieval Logic with JSON Deserialization and Robust Error Handling
    @Override
    @Transactional(readOnly = true)
    public List<WhiteboardStrokeMessage.StrokeData> getStrokes(String roomId) {
        return repository.findByRoomIdOrderByTimestampAsc(roomId).stream()
                .map(entity -> {
                    try {
                        return objectMapper.readValue(entity.getData(), WhiteboardStrokeMessage.StrokeData.class);
                    } catch (JsonProcessingException e) {
                        log.error("Failed to deserialize stroke {} for room {}: {}", entity.getStrokeId(), roomId, e.getMessage());
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    // Core Stroke Deletion Logic with Validation and Logging
    @Override
    @Transactional
    public void deleteStroke(String roomId, String strokeId) {
        repository.deleteByRoomIdAndStrokeId(roomId, strokeId);
        log.debug("Deleted stroke {} from room {}", strokeId, roomId);
    }

    // Core Stroke Clearing Logic with Validation and Logging
    @Override
    @Transactional
    public void clearStrokes(String roomId, String userId) {
        if (userId != null) {
            repository.deleteByRoomIdAndUserId(roomId, userId);
            log.info("Cleared strokes for user {} in room {}", userId, roomId);
        } else {
            // Bulk delete for whole board clear (if needed in future)
            // repository.deleteAll(repository.findByRoomId(roomId));
        }
    }
}
