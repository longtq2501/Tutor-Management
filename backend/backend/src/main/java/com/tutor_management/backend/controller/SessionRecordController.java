package com.tutor_management.backend.controller;

import com.tutor_management.backend.dto.request.SessionRecordRequest;
import com.tutor_management.backend.dto.response.SessionRecordResponse;
import com.tutor_management.backend.service.SessionRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// ============= Session Record Controller =============
@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SessionRecordController {

    private final SessionRecordService sessionRecordService;

    @GetMapping
    public ResponseEntity<List<SessionRecordResponse>> getAllRecords() {
        return ResponseEntity.ok(sessionRecordService.getAllRecords());
    }

    @GetMapping("/month/{month}")
    public ResponseEntity<List<SessionRecordResponse>> getRecordsByMonth(@PathVariable String month) {
        return ResponseEntity.ok(sessionRecordService.getRecordsByMonth(month));
    }

    @GetMapping("/months")
    public ResponseEntity<List<String>> getDistinctMonths() {
        return ResponseEntity.ok(sessionRecordService.getDistinctMonths());
    }

    @PostMapping
    public ResponseEntity<SessionRecordResponse> createRecord(@Valid @RequestBody SessionRecordRequest request) {
        return ResponseEntity.ok(sessionRecordService.createRecord(request));
    }

    @PutMapping("/{id}/toggle-payment")
    public ResponseEntity<SessionRecordResponse> togglePayment(@PathVariable Long id) {
        return ResponseEntity.ok(sessionRecordService.togglePayment(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable Long id) {
        sessionRecordService.deleteRecord(id);
        return ResponseEntity.ok().build();
    }
}
