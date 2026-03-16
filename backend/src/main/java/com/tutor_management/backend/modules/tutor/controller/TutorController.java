package com.tutor_management.backend.modules.tutor.controller;

import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import com.tutor_management.backend.modules.tutor.dto.TutorStatsDTO;
import com.tutor_management.backend.modules.tutor.dto.request.TutorRequest;
import com.tutor_management.backend.modules.tutor.dto.response.TutorResponse;
import com.tutor_management.backend.modules.student.dto.response.StudentResponse;
import com.tutor_management.backend.modules.finance.dto.response.SessionRecordResponse;
import com.tutor_management.backend.modules.document.dto.response.DocumentResponse;
import com.tutor_management.backend.modules.tutor.service.TutorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * TutorController handles all administrative operations related to tutors, including CRUD operations,
 * status management, and retrieval of associated students, sessions, and documents.
 * All endpoints are secured to allow access only to users with the ADMIN role.
 */
@RestController
@RequestMapping("/api/admin/tutors")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')") 
public class TutorController {

    private final TutorService tutorService;

    /**
     * Retrieves a paginated list of tutors with optional search and status filters.
     *
     * @param search   Optional search term to filter tutors by name or email.
     * @param status   Optional status filter (e.g., "active", "inactive").
     * @param pageable Pagination information.
     * @return A paginated list of tutors matching the criteria.
     */
    @GetMapping
    public ApiResponse<Page<TutorResponse>> getAllTutors(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.success(tutorService.getAllTutors(search, status, pageable));
    }

    /**
     * Retrieves detailed information about a specific tutor by their ID.
     *
     * @param id The ID of the tutor to retrieve.
     * @return The details of the specified tutor.
     */
    @GetMapping("/{id}")
    public ApiResponse<TutorResponse> getTutorById(@PathVariable Long id) {
        return ApiResponse.success(tutorService.getTutorById(id));
    }

    /**
     * Creates a new tutor with the provided information.
     *
     * @param request The request body containing the tutor's information.
     * @return The details of the newly created tutor.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TutorResponse> createTutor(@Valid @RequestBody TutorRequest request) {
        return ApiResponse.success(tutorService.createTutor(request));
    }

    /**
     * Updates the information of an existing tutor identified by their ID.
     *
     * @param id      The ID of the tutor to update.
     * @param request The request body containing the updated tutor information.
     * @return The details of the updated tutor.
     */
    @PutMapping("/{id}")
    public ApiResponse<TutorResponse> updateTutor(@PathVariable Long id, @Valid @RequestBody TutorRequest request) {
        return ApiResponse.success(tutorService.updateTutor(id, request));
    }

    /**
     * Deletes a tutor identified by their ID.
     *
     * @param id The ID of the tutor to delete.
     * @return A response indicating successful deletion.
     */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteTutor(@PathVariable Long id) {
        tutorService.deleteTutor(id);
        return ApiResponse.success(null);
    }

    /**
     * Retrieves statistical information about a specific tutor, such as the number of students,
     * sessions conducted, and average ratings.
     *
     * @param id The ID of the tutor for whom to retrieve statistics.
     * @return The statistical information of the specified tutor.
     */
    @GetMapping("/{id}/stats")
    public ApiResponse<TutorStatsDTO> getTutorStats(@PathVariable Long id) {
        return ApiResponse.success(tutorService.getTutorStats(id));
    }

    /**
     * Toggles the active/inactive status of a tutor identified by their ID.
     *
     * @param id The ID of the tutor whose status is to be toggled.
     * @return The updated details of the tutor after toggling the status.
     */
    @PutMapping("/{id}/toggle-status")
    public ApiResponse<TutorResponse> toggleTutorStatus(@PathVariable Long id) {
        return ApiResponse.success(tutorService.toggleTutorStatus(id));
    }

    /**
     * Retrieves a paginated list of students associated with a specific tutor.
     *
     * @param id       The ID of the tutor whose students are to be retrieved.
     * @param pageable Pagination information.
     * @return A paginated list of students associated with the specified tutor.
     */
    @GetMapping("/{id}/students")
    public ApiResponse<Page<StudentResponse>> getTutorStudents(
            @PathVariable Long id,
            @PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.success(tutorService.getTutorStudents(id, pageable));
    }

    /**
     * Retrieves a paginated list of session records associated with a specific tutor, with an optional filter by month.
     *
     * @param id       The ID of the tutor whose sessions are to be retrieved.
     * @param month    Optional month filter in the format "YYYY-MM" to retrieve sessions for a specific month.
     * @param pageable Pagination information.
     * @return A paginated list of session records associated with the specified tutor.
     */
    @GetMapping("/{id}/sessions")
    public ApiResponse<Page<SessionRecordResponse>> getTutorSessions(
            @PathVariable Long id,
            @RequestParam(required = false) String month,
            @PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.success(tutorService.getTutorSessions(id, month, pageable));
    }

    /**
     * Retrieves a paginated list of documents associated with a specific tutor.
     *
     * @param id       The ID of the tutor whose documents are to be retrieved.
     * @param pageable Pagination information.
     * @return A paginated list of documents associated with the specified tutor.
     */
    @GetMapping("/{id}/documents")
    public ApiResponse<Page<DocumentResponse>> getTutorDocuments(
            @PathVariable Long id,
            @PageableDefault(size = 10) Pageable pageable) {
        return ApiResponse.success(tutorService.getTutorDocuments(id, pageable));
    }
}
