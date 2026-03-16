package com.tutor_management.backend.modules.admin.controller;

import com.tutor_management.backend.modules.admin.dto.response.ActivityLogResponse;
import com.tutor_management.backend.modules.admin.dto.response.MonthlyRevenueResponse;
import com.tutor_management.backend.modules.admin.dto.response.OverviewStatsResponse;
import com.tutor_management.backend.modules.admin.dto.response.StudentGrowthResponse;
import com.tutor_management.backend.modules.admin.dto.response.TopTutorResponse;
import com.tutor_management.backend.modules.admin.service.AdminStatsService;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatsController {

    private final AdminStatsService adminStatsService;

    // get overview stats (total students, tutors, sessions, revenue)
    @GetMapping("/stats/overview")
    public ApiResponse<OverviewStatsResponse> getOverviewStats() {
        return ApiResponse.success(adminStatsService.getOverviewStats());
    }

    // get monthly revenue for the past N months
    @GetMapping("/stats/monthly-revenue")
    public ApiResponse<List<MonthlyRevenueResponse>> getMonthlyRevenue(
            @RequestParam(defaultValue = "6") int months) {
        return ApiResponse.success(adminStatsService.getMonthlyRevenue(months));
    }

    // get paginated activity logs (admin actions, tutor/student signups, session bookings)
    @GetMapping("/activity-log")
    public ApiResponse<Page<ActivityLogResponse>> getActivityLogs(
            @PageableDefault(size = 20) Pageable pageable) {
        return ApiResponse.success(adminStatsService.getActivityLogs(pageable));
    }

    // get student growth over time (new signups per month)
    @GetMapping("/stats/student-growth")
    public ApiResponse<List<StudentGrowthResponse>> getStudentGrowth() {
        return ApiResponse.success(adminStatsService.getStudentGrowth());
    }

    // get top tutors by revenue or sessions
    @GetMapping("/stats/top-tutors")
    public ApiResponse<List<TopTutorResponse>> getTopTutors(
            @RequestParam(defaultValue = "5") int limit) {
        return ApiResponse.success(adminStatsService.getTopTutors(limit));
    }
}
