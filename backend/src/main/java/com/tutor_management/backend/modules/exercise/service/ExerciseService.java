package com.tutor_management.backend.modules.exercise.service;

import com.tutor_management.backend.modules.exercise.domain.ExerciseStatus;
import com.tutor_management.backend.modules.exercise.dto.request.CreateExerciseRequest;
import com.tutor_management.backend.modules.exercise.dto.request.ImportExerciseRequest;
import com.tutor_management.backend.modules.exercise.dto.response.ExerciseListItemResponse;
import com.tutor_management.backend.modules.exercise.dto.response.ExerciseResponse;
import com.tutor_management.backend.modules.exercise.dto.response.ImportPreviewResponse;
import com.tutor_management.backend.modules.exercise.dto.response.TutorStudentSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Primary business orchestration layer for the Exercise module.
 * Manages resource lifecycles, student assignments, and integration with the parsing engine.
 */
public interface ExerciseService {
    
    /**
     * Provides a non-persistent preview of how a raw text block will be structured.
     * 
     * @param request Contains the raw content and optional target class mapping.
     * @return Structured preview data for tutor verification.
     */
    ImportPreviewResponse previewImport(ImportExerciseRequest request);

    /**
     * Uploads an image and returns the public URL for question attachment.
     */
    String uploadQuestionImage(MultipartFile file);
    
    /**
     * Persists a new exercise resource in the system.
     * 
     * @param request Full exercise definition (metadata + questions).
     * @param teacherId UUID of the authoring staff member.
     * @return The saved and ID-assigned exercise resource.
     */
    ExerciseResponse createExercise(CreateExerciseRequest request, String teacherId);
    
    /**
     * Updates an existing exercise. Replaces the sub-resource graph (questions/options).
     * 
     * @param id Target exercise UUID.
     * @param request Updated definition.
     * @param teacherId UUID of the performing staff member (for ownership check).
     * @return The updated exercise resource.
     */
    ExerciseResponse updateExercise(String id, CreateExerciseRequest request, String teacherId);
    
    /**
     * Fetches details for a specific exercise, including full question content.
     */
    ExerciseResponse getExercise(String id);
    
    /**
     * Retrieves a filtered list of exercises for the management library.
     * 
     * @param classId Optional class filter.
     * @param status Optional draft/published status filter.
     * @param pageable Pagination and sorting metadata.
     * @return Summary projections of matching resources.
     */
    Page<ExerciseListItemResponse> listExercises(String classId, ExerciseStatus status, String search, Pageable pageable);
    
    /**
     * Permanently removes an exercise and all its associated data (submissions, assignments).
     * 
     * @param id Target exercise UUID.
     * @param teacherId UUID of the performing staff member (for ownership check).
     */
    void deleteExercise(String id, String teacherId);

    /**
     * Links a published exercise to a specific student for completion.
     * 
     * @param exerciseId Source resource UUID.
     * @param studentId Target student recipient.
     * @param tutorId Authorizing staff member.
     * @param deadline Optional specific cutoff time.
     */
    void assignToStudent(String exerciseId, String studentId, String tutorId, LocalDateTime deadline);

    /**
     * Revokes an assignment from a student using one or more candidate identity keys
     * (for compatibility between user.id and student.id).
     *
     * @param exerciseId source exercise UUID.
     * @param studentIds candidate student identity keys.
     * @param tutorId authorizing staff member.
     */
    void revokeAssignment(String exerciseId, List<String> studentIds, String tutorId);

    /**
     * Retrieves assigned materials for a student with pagination support.
     * 
     * @param studentId target student.
     * @param tutorId optional filter by tutor ownership (multi-tenancy).
     * @param pageable pagination metadata.
     */
    Page<ExerciseListItemResponse> listAssignedExercises(String studentId, Long tutorId, Pageable pageable);

    /**
     * Retrieves assigned materials for one logical student represented by multiple identity keys
     * (for compatibility between user.id and student.id based records).
     *
     * @param studentIds candidate identity keys for the same student.
     * @param tutorId optional filter by tutor ownership (multi-tenancy).
     * @param pageable pagination metadata.
     */
    Page<ExerciseListItemResponse> listAssignedExercisesByStudentIds(List<String> studentIds, Long tutorId, Pageable pageable);

    /**
     * Aggregates completion statistics for students with pagination support.
     * 
     * @param tutorId Optional filter for tutor-specific isolation. Null for ADMIN.
     * @param pageable Pagination metadata.
     */
    Page<TutorStudentSummaryResponse> getStudentSummaries(Long tutorId, Pageable pageable);
}
