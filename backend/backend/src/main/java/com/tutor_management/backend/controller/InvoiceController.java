package com.tutor_management.backend.controller;

import com.tutor_management.backend.dto.request.InvoiceRequest;
import com.tutor_management.backend.dto.response.InvoiceResponse;
import com.tutor_management.backend.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvoiceController {

    private final InvoiceService invoiceService;
    private final PDFGeneratorService pdfGeneratorService;

    @PostMapping("/generate")
    public ResponseEntity<InvoiceResponse> generateInvoice(@RequestBody InvoiceRequest request) {
        InvoiceResponse invoice = invoiceService.generateInvoice(request);
        return ResponseEntity.ok(invoice);
    }

    @PostMapping("/download-pdf")
    public ResponseEntity<byte[]> downloadInvoicePDF(@RequestBody InvoiceRequest request) {
        try {
            InvoiceResponse invoice = invoiceService.generateInvoice(request);
            byte[] pdfBytes = pdfGeneratorService.generateInvoicePDF(invoice);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);

            // Tên file khác nhau cho báo giá tổng vs báo giá từng em
            String filename = Boolean.TRUE.equals(request.getAllStudents())
                    ? "Bao-Gia-Tong-" + request.getMonth() + ".pdf"
                    : "Bao-Gia-" + invoice.getInvoiceNumber() + ".pdf";

            headers.setContentDisposition(
                    ContentDisposition.builder("attachment")
                            .filename(filename)
                            .build()
            );

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace(); // Log lỗi để debug
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }

    // OPTIONAL: Endpoint riêng cho báo giá tổng tháng (cho rõ ràng)
    @PostMapping("/download-monthly-pdf")
    public ResponseEntity<byte[]> downloadMonthlyInvoicePDF(
            @RequestParam String month
    ) {
        try {
            InvoiceRequest request = InvoiceRequest.builder()
                    .month(month)
                    .allStudents(true)
                    .build();

            InvoiceResponse invoice = invoiceService.generateInvoice(request);
            byte[] pdfBytes = pdfGeneratorService.generateInvoicePDF(invoice);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDisposition(
                    ContentDisposition.builder("attachment")
                            .filename("Bao-Gia-Tong-" + month + ".pdf")
                            .build()
            );

            return new ResponseEntity<>(pdfBytes, headers, HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(null);
        }
    }
}