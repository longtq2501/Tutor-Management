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

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final ReportService reportService;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/finance")
    public ResponseEntity<ApiResponse<FinancialAnalyticsResponse>> getFinancialAnalytics(
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getFinancialAnalytics(month)));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/performance")
    public ResponseEntity<ApiResponse<PerformanceAnalyticsResponse>> getPerformanceAnalytics() {
        return ResponseEntity.ok(ApiResponse.success(analyticsService.getPerformanceAnalytics()));
    }

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
