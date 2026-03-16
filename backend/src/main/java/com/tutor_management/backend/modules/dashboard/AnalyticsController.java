package com.tutor_management.backend.modules.dashboard;

import com.tutor_management.backend.modules.dashboard.dto.response.FinancialAnalyticsResponse;
import com.tutor_management.backend.modules.dashboard.dto.response.PerformanceAnalyticsResponse;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for handling analytics-related endpoints for the tutor management system.
 * Provides endpoints for retrieving financial and performance analytics, as well as exporting reports.
 */
@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final ReportService reportService;

    /**
     * Endpoint to retrieve financial analytics data.
     * Accessible only by users with the ADMIN role.
     *
     * @param month Optional query parameter to filter analytics by a specific month (format: YYYY-MM).
     * @return A ResponseEntity containing the financial analytics data wrapped in an ApiResponse.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/finance")
    public ResponseEntity<ApiResponse<FinancialAnalyticsResponse>> getFinancialAnalytics(
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getFinancialAnalytics(month)));
    }

    /**
     * Endpoint to retrieve performance analytics data.
     * Accessible only by users with the ADMIN role.
     *
     * @return A ResponseEntity containing the performance analytics data wrapped in an ApiResponse.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/performance")
    public ResponseEntity<ApiResponse<PerformanceAnalyticsResponse>> getPerformanceAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getPerformanceAnalytics()));
    }

    /**
     * Endpoint to export analytics reports in CSV or Excel format.
     * Accessible only by users with the ADMIN role.
     *
     * @param type   The type of report to export (e.g., "finance" or "performance").
     * @param format The format of the report (e.g., "csv" or "excel").
     * @param month  Optional query parameter to filter financial reports by a specific month (format: YYYY-MM).
     * @return A ResponseEntity containing the exported report as a byte array, along with appropriate headers for file download.
     * @throws Exception If an error occurs during report generation.
     */
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/reports/export")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam String type,
            @RequestParam String format,
            @RequestParam(required = false) String month) throws Exception {
        
        byte[] content;
        String filename;
        String contentType;

        if ("finance".equalsIgnoreCase(type)) {
            if ("csv".equalsIgnoreCase(format)) {
                content = reportService.generateFinancialCSV(month);
                filename = "finance-report.csv";
                contentType = "text/csv";
            } else {
                content = reportService.generateFinancialExcel(month);
                filename = "finance-report.xlsx";
                contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            }
        } else {
            content = reportService.generatePerformanceCSV();
            filename = "performance-report.csv";
            contentType = "text/csv";
        }

        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=" + filename)
                .header("Content-Type", contentType)
                .body(content);
    }
}
