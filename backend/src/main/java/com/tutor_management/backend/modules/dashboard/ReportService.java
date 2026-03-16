package com.tutor_management.backend.modules.dashboard;

import com.tutor_management.backend.modules.dashboard.dto.response.FinancialAnalyticsResponse;
import com.tutor_management.backend.modules.dashboard.dto.response.PerformanceAnalyticsResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Service for generating downloadable reports based on analytics data.
 * Provides methods to create CSV and Excel files for financial and performance analytics.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final AnalyticsService analyticsService;

    // Generates a CSV report for financial analytics of a given month
    public byte[] generateFinancialCSV(String month) {
        FinancialAnalyticsResponse stats = analyticsService.getFinancialAnalytics(month);
        StringBuilder csv = new StringBuilder();
        csv.append("Tutor,Revenue,Commission,Sessions\n");
        for (var tutor : stats.getRevenueByTutor()) {
            csv.append(String.format("%s,%d,%d,%d\n",
                    tutor.getTutorName(), tutor.getTotalRevenue(), tutor.getCommissionAmount(), tutor.getSessionCount()));
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    // Generates an Excel report for financial analytics of a given month
    public byte[] generateFinancialExcel(String month) throws IOException {
        FinancialAnalyticsResponse stats = analyticsService.getFinancialAnalytics(month);
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Financial Analytics");

            // Header
            Row headerRow = sheet.createRow(0);
            String[] headers = {"Tutor", "Revenue", "Commission", "Sessions"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                CellStyle style = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setBold(true);
                style.setFont(font);
                cell.setCellStyle(style);
            }

            // Data
            int rowIdx = 1;
            for (var tutor : stats.getRevenueByTutor()) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(tutor.getTutorName());
                row.createCell(1).setCellValue(tutor.getTotalRevenue());
                row.createCell(2).setCellValue(tutor.getCommissionAmount());
                row.createCell(3).setCellValue(tutor.getSessionCount());
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    // Generates a CSV report for performance analytics of tutors
    public byte[] generatePerformanceCSV() {
        PerformanceAnalyticsResponse stats = analyticsService.getPerformanceAnalytics();
        StringBuilder csv = new StringBuilder();
        csv.append("Tutor,Average Rating,Completion Rate,Sessions,Students\n");
        for (var tutor : stats.getTutorRankings()) {
            csv.append(String.format("%s,%.2f,%.2f,%d,%d\n",
                    tutor.getTutorName(), tutor.getAverageRating(), tutor.getCompletionRate(), tutor.getTotalSessions(), tutor.getStudentCount()));
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }
}
