package com.tutor_management.backend.modules.report.controller;

import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.report.dto.MonthlyReportDataDTO;
import com.tutor_management.backend.modules.report.dto.SaveCommentRequest;
import com.tutor_management.backend.modules.report.service.ReportPdfGenerator;
import com.tutor_management.backend.modules.report.service.ReportService;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.text.Normalizer;

@RestController
@RequestMapping("/api/reports/monthly")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TUTOR')")
public class ReportController {

    private final ReportService reportService;
    private final ReportPdfGenerator reportPdfGenerator;

    @GetMapping
    public ResponseEntity<ApiResponse<MonthlyReportDataDTO>> getReportData(
            @RequestParam Long studentId,
            @RequestParam Integer month,
            @RequestParam Integer year,
            @AuthenticationPrincipal User user
    ) {
        MonthlyReportDataDTO data = reportService.getReportData(user.getId(), studentId, month, year);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/comment")
    public ResponseEntity<ApiResponse<Void>> saveComment(
            @Valid @RequestBody SaveCommentRequest request,
            @AuthenticationPrincipal User user
    ) {
        reportService.saveTutorComment(
                user.getId(),
                request.getStudentId(),
                request.getMonth(),
                request.getYear(),
                request.getComment()
        );
        return ResponseEntity.ok(ApiResponse.success("Đã lưu nhận xét", null));
    }

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam Long studentId,
            @RequestParam Integer month,
            @RequestParam Integer year,
            @AuthenticationPrincipal User user
    ) {
        MonthlyReportDataDTO data = reportService.getReportData(user.getId(), studentId, month, year);
        byte[] pdf = reportPdfGenerator.generatePdf(data);

        String normalizedName = normalizeFileName(data.getStudentName());
        String filename = String.format("BaoCao_%s_T%d_%d.pdf", normalizedName, month, year);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/export/png")
    public ResponseEntity<ApiResponse<MonthlyReportDataDTO>> getDataForPng(
            @RequestParam Long studentId,
            @RequestParam Integer month,
            @RequestParam Integer year,
            @AuthenticationPrincipal User user
    ) {
        MonthlyReportDataDTO data = reportService.getReportData(user.getId(), studentId, month, year);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    private String normalizeFileName(String raw) {
        if (raw == null || raw.isBlank()) {
            return "HocSinh";
        }

        String withoutDiacritics = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");

        String safe = withoutDiacritics
                .replaceAll("[^a-zA-Z0-9\\s_-]", "")
                .trim()
                .replaceAll("\\s+", "_");

        return safe.isBlank() ? "HocSinh" : safe;
    }
}
