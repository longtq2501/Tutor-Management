package com.tutor_management.backend.modules.admin.controller;

import com.tutor_management.backend.modules.admin.dto.response.AdminStudentResponse;
import com.tutor_management.backend.modules.admin.service.AdminStudentService;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/students")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStudentController {

    private final AdminStudentService adminStudentService;

    // get all students with optional filters for search, tutorId, and active status
    @GetMapping
    public ApiResponse<Page<AdminStudentResponse>> getAllStudents(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long tutorId,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(adminStudentService.getAllStudents(search, tutorId, active, pageable));
    }

    // get student by id
    @GetMapping("/{id}")
    public ApiResponse<AdminStudentResponse> getStudentById(@PathVariable Long id) {
        return ApiResponse.success(adminStudentService.getStudentById(id));
    }
}
