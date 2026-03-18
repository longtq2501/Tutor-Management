package com.tutor_management.backend.modules.finance.controller;

import com.tutor_management.backend.modules.finance.service.InvoiceService;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tutor_management.backend.modules.finance.dto.request.InvoiceRequest;
import com.tutor_management.backend.modules.finance.dto.response.InvoiceResponse;
import com.tutor_management.backend.modules.shared.service.PDFGeneratorService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for generating and distributing financial invoices.
 * Supports PDF exports and email notifications to parents.
 */
@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Slf4j
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final PDFGeneratorService pdfGeneratorService;

    // Endpoint to generate invoice data based on request parameters
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<InvoiceResponse>> generateInvoice(@RequestBody InvoiceRequest request) {
        log.info("Generating invoice for request: {}", request);
        return ResponseEntity.ok(ApiResponse.success(invoiceService.generateInvoice(request)));
    }

    // Endpoint to generate and download invoice PDF based on request parameters
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping("/download-pdf")
    public ResponseEntity<byte[]> downloadInvoicePDF(@RequestBody InvoiceRequest request) {
        log.info("Generating PDF for invoice request");
        try {
            InvoiceResponse invoice = invoiceService.generateInvoice(request);
            byte[] pdfBytes = pdfGeneratorService.generateInvoicePDF(invoice);

            String filename = Boolean.TRUE.equals(request.getAllStudents())
                    ? "Bao-Gia-Tong-" + request.getMonth() + ".pdf"
                    : "Bao-Gia-" + invoice.getInvoiceNumber() + ".pdf";

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                    .body(pdfBytes);
        } catch (RuntimeException e) {
            log.error("Invalid invoice request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(e.getMessage().getBytes(java.nio.charset.StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("Failed to generate invoice PDF", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Convenience endpoint to download monthly invoice PDF for all students
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping("/download-monthly-pdf")
    public ResponseEntity<byte[]> downloadMonthlyInvoicePDF(@RequestParam String month) {
        InvoiceRequest request = InvoiceRequest.builder()
                .month(month)
                .allStudents(true)
                .build();
        return downloadInvoicePDF(request);
    }

    // Email quote feature is disabled.
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping("/send-email")
    public ResponseEntity<ApiResponse<String>> sendInvoiceViaEmail(@RequestBody InvoiceRequest request) {
        log.warn("Invoice email feature is disabled. studentId={}", request.getStudentId());
        return ResponseEntity.status(HttpStatus.GONE)
                .body(ApiResponse.error("Tính năng gửi báo giá qua email đã được tạm thời vô hiệu hóa"));
    }

    // Email quote feature is disabled.
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping("/send-email-batch")
    public ResponseEntity<ApiResponse<com.tutor_management.backend.modules.finance.dto.response.BatchEmailResult>> sendInvoiceBatch(
            @RequestBody InvoiceRequest request) {
        log.warn("Batch invoice email feature is disabled. selectedStudents={}",
                request.getSelectedStudentIds() != null ? request.getSelectedStudentIds().size() : 0);
        return ResponseEntity.status(HttpStatus.GONE)
                .body(ApiResponse.error("Tính năng gửi báo giá qua email đã được tạm thời vô hiệu hóa"));
    }

    // Email quote feature is disabled.
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping("/send-email-all")
    public ResponseEntity<ApiResponse<String>> sendInvoiceToAll(@RequestBody InvoiceRequest request) {
        log.warn("Invoice email-all feature is disabled for month={}", request.getMonth());
        return ResponseEntity.status(HttpStatus.GONE)
                .body(ApiResponse.error("Tính năng gửi báo giá qua email đã được tạm thời vô hiệu hóa"));
    }
}

