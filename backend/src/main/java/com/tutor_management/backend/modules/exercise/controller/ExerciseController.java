package com.tutor_management.backend.modules.exercise.controller;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.exercise.domain.ExerciseStatus;
import com.tutor_management.backend.modules.exercise.dto.request.AssignExerciseRequest;
import com.tutor_management.backend.modules.exercise.dto.request.CreateExerciseRequest;
import com.tutor_management.backend.modules.exercise.dto.request.ImportExerciseRequest;
import com.tutor_management.backend.modules.exercise.dto.response.ExerciseListItemResponse;
import com.tutor_management.backend.modules.exercise.dto.response.ExerciseResponse;
import com.tutor_management.backend.modules.exercise.dto.response.ImportPreviewResponse;
import com.tutor_management.backend.modules.exercise.service.ExerciseService;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;


/**
 * RESTful interface for the Exercise Management System.
 * Provides endpoints for ingestion, resource management (CRUD), and student assignments.
 * Access is generally restricted to staff (ADMIN/TUTOR) unless otherwise specified.
 */
@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
public class ExerciseController {
    
    private final ExerciseService exerciseService;
    private final com.tutor_management.backend.modules.tutor.repository.TutorRepository tutorRepository;
    private final com.tutor_management.backend.modules.auth.UserRepository userRepository;
    
    /**
     * Dry-run parsing of raw text into structured exercise data.
     * Use this to verify accuracy before persistence.
     */
    @PostMapping("/import/text")
    public ResponseEntity<ApiResponse<ImportPreviewResponse>> importPreview(
            @Valid @RequestBody ImportExerciseRequest request) {
        log.info("Accessing NLP parser for raw text (ingestion length: {})", request.getContent().length());
        ImportPreviewResponse preview = exerciseService.previewImport(request);
        return ResponseEntity.ok(ApiResponse.success("Xử lý nội dung văn bản thành công", preview));
    }
    
    /**
     * Declares a new exercise resource.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ExerciseResponse>> createExercise(
            @Valid @RequestBody CreateExerciseRequest request,
            @AuthenticationPrincipal User user) {
        log.info("User {} is creating a new exercise: '{}'", user.getEmail(), request.getTitle());
        ExerciseResponse exercise = exerciseService.createExercise(request, user.getId().toString());
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success("Bài tập đã được khởi tạo thành công", exercise));
    }
    
    /**
     * Updates an existing exercise Resource. Note: Replaces the sub-resource graph of questions.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ExerciseResponse>> updateExercise(
            @PathVariable String id,
            @Valid @RequestBody CreateExerciseRequest request,
            @AuthenticationPrincipal User user) {
        log.info("User {} is updating exercise UUID: {}", user.getEmail(), id);
        ExerciseResponse exercise = exerciseService.updateExercise(id, request, user.getId().toString());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật bài tập thành công", exercise));
    }
    
    /**
     * Fetches the full detailed structure of a specific exercise.
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<ExerciseResponse>> getExercise(@PathVariable String id) {
        log.debug("Reading full graph for exercise {}", id);
        ExerciseResponse exercise = exerciseService.getExercise(id);
        return ResponseEntity.ok(ApiResponse.success(exercise));
    }
    
    /**
     * Queries the exercise library with optional filters.
     * 
     * @param classId Filter by specific class categorization.
     * @param status Filter by draft/published/archived state.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR', 'STUDENT')")
    public ResponseEntity<ApiResponse<Page<ExerciseListItemResponse>>> listExercises(
            @RequestParam(required = false) String classId,
            @RequestParam(required = false) ExerciseStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 10, sort = "createdAt") Pageable pageable) {
        log.debug("Quering exercise library (Filter - Class: {}, Status: {}, Search: {}, Page: {})", classId, status, search, pageable.getPageNumber());
        Page<ExerciseListItemResponse> exercises = exerciseService.listExercises(classId, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.success(exercises));
    }
    
    /**
     * Destructive removal of an exercise resource and all related student activity history.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExercise(
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        log.warn("User {} requested deletion of exercise resource: {}", user.getEmail(), id);
        exerciseService.deleteExercise(id, user.getId().toString());
        return ResponseEntity.ok(ApiResponse.success("Xóa bài tập thành công", null));
    }
    
    /**
     * Links a published exercise to a specific student's curriculum.
     */
    @PostMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<Void>> assignToStudent(
            @PathVariable String id,
            @Valid @RequestBody AssignExerciseRequest request,
            @AuthenticationPrincipal User user) {
        log.info("Staff {} assigning exercise {} to student {}", user.getEmail(), id, request.getStudentId());
        exerciseService.assignToStudent(id, request.getStudentId(), user.getId().toString(), request.getDeadline());
        return ResponseEntity.ok(ApiResponse.success("Đã giao bài tập cho học sinh thành công", null));
    }

    /**
     * Showing list of assigned exercises to students
     */
    @GetMapping("/assigned")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<Page<ExerciseListItemResponse>>> listAssignedExercises(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 10, sort = "assignedAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        log.debug("Reading assigned materials for authenticated student {} (page: {})", user.getEmail(), pageable.getPageNumber());

        List<String> studentIdentityCandidates = new ArrayList<>(new LinkedHashSet<>(List.of(user.getId().toString())));
        if (user.getStudentId() != null) {
            studentIdentityCandidates.add(user.getStudentId().toString());
        }

        // For students, we don't filter by teacherId.
        Page<ExerciseListItemResponse> exercises = exerciseService.listAssignedExercisesByStudentIds(studentIdentityCandidates, null, pageable);
        return ResponseEntity.ok(ApiResponse.success(exercises));
    }

    /**
     * Staff/Admin view for a specific student's assigned assessments.
     */
    @GetMapping("/assigned/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    public ResponseEntity<ApiResponse<Page<ExerciseListItemResponse>>> listStudentAssignedExercises(
            @PathVariable String studentId,
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 10, sort = "assignedAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        log.debug("Staff {} reading assigned materials for student {} (page: {})", user.getEmail(), studentId, pageable.getPageNumber());
        
        // Match multi-tenancy rule: Tutors only see what they assigned (linked via Exercise.tutorId)
        Long tutorId = null;
        if ("TUTOR".equals(user.getRole().getName())) {
            tutorId = tutorRepository.findByUserId(user.getId())
                    .map(com.tutor_management.backend.modules.tutor.entity.Tutor::getId)
                    .orElse(null);
        }

        LinkedHashSet<String> studentIdentityCandidates = new LinkedHashSet<>();
        studentIdentityCandidates.add(studentId);
        try {
            Long profileStudentId = Long.parseLong(studentId);
            userRepository.findByStudentId(profileStudentId)
                    .map(User::getId)
                    .ifPresent(userId -> studentIdentityCandidates.add(userId.toString()));
        } catch (NumberFormatException ignored) {
            // Keep the raw path ID only when it is not numeric.
        }

        Page<ExerciseListItemResponse> exercises = exerciseService.listAssignedExercisesByStudentIds(new ArrayList<>(studentIdentityCandidates), tutorId, pageable);
        return ResponseEntity.ok(ApiResponse.success(exercises));
    }
}
