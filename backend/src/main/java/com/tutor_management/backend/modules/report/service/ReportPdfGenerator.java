package com.tutor_management.backend.modules.report.service;

import com.tutor_management.backend.modules.report.dto.MonthlyReportDataDTO;
import com.tutor_management.backend.modules.shared.service.PDFGeneratorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportPdfGenerator {

    private final PDFGeneratorService pdfGeneratorService;

    public byte[] generatePdf(MonthlyReportDataDTO data) {
        try {
            return pdfGeneratorService.generateMonthlyProgressReportPDF(data);
        } catch (Exception e) {
            log.error("Failed to generate monthly report PDF", e);
            throw new RuntimeException("Không thể tạo file PDF báo cáo", e);
        }
    }
}
