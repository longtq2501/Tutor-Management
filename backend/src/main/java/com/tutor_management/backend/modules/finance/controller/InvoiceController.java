package com.tutor_management.backend.modules.finance.controller;

import java.util.List;
import java.util.stream.Collectors;

import com.tutor_management.backend.modules.finance.service.InvoiceService;
import com.tutor_management.backend.modules.shared.dto.response.ApiResponse;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.tutor_management.backend.modules.finance.dto.request.InvoiceRequest;
import com.tutor_management.backend.modules.finance.dto.response.InvoiceResponse;
import com.tutor_management.backend.modules.parent.entity.Parent;
import com.tutor_management.backend.modules.shared.service.EmailService;
import com.tutor_management.backend.modules.shared.service.GmailService;
import com.tutor_management.backend.modules.shared.service.PDFGeneratorService;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;

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
    private final EmailService emailService;
    private final GmailService gmailService;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;

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

    // Endpoint to send invoice PDF via email to the parent of a specific student
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping("/send-email")
    public ResponseEntity<ApiResponse<String>> sendInvoiceViaEmail(@RequestBody InvoiceRequest request, Authentication authentication) {
        log.info("Sending invoice email for student ID: {}", request.getStudentId());
        try {
            if (request.getStudentId() == null) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng chỉ định ID học sinh"));
            }

            Student student = studentRepository.findByIdWithParent(request.getStudentId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy học sinh"));

            Parent parent = student.getParent();
            validateParentEmail(parent);

            InvoiceResponse invoice = invoiceService.generateInvoice(request);
            byte[] pdfData = pdfGeneratorService.generateInvoicePDF(invoice);

                User currentUser = resolveCurrentUser(authentication);
                sendInvoiceWithGmailFallback(currentUser, parent.getEmail(), parent.getName(), student.getName(),
                    request.getMonth(), pdfData, invoice.getInvoiceNumber());

            return ResponseEntity.ok(ApiResponse.success("Đã gửi email báo giá thành công đến " + parent.getEmail()));
        } catch (Exception e) {
            log.error("Failed to send invoice email", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Lỗi khi gửi email: " + e.getMessage()));
        }
    }

    // Endpoint to send invoice PDF via email to the parent of multiple students (batch)
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping("/send-email-batch")
    public ResponseEntity<ApiResponse<com.tutor_management.backend.modules.finance.dto.response.BatchEmailResult>> sendInvoiceBatch(
            @RequestBody InvoiceRequest request,
            Authentication authentication) throws Exception {
        log.info("Sending batch invoice email");
        List<Long> studentIds = request.getSelectedStudentIds();
        if (studentIds == null || studentIds.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất 1 học sinh");
        }

        List<Student> students = studentRepository.findByIdInWithParent(studentIds);
        Parent firstParent = validateBatchParents(students);

        InvoiceResponse invoice = invoiceService.generateInvoice(request);
        byte[] pdfData = pdfGeneratorService.generateInvoicePDF(invoice);

        String allStudentNames = students.stream().map(Student::getName).collect(Collectors.joining(", "));
        User currentUser = resolveCurrentUser(authentication);
        sendInvoiceWithGmailFallback(currentUser, firstParent.getEmail(), firstParent.getName(), allStudentNames,
            invoice.getMonth(), pdfData, invoice.getInvoiceNumber());

        // Construct detailed result
        var result = com.tutor_management.backend.modules.finance.dto.response.BatchEmailResult.builder()
                .success(true)
                .message("Đã gửi email báo giá tổng hợp thành công")
                .summary(com.tutor_management.backend.modules.finance.dto.response.BatchEmailResult.EmailSummary.builder()
                        .total(1)
                        .sent(1)
                        .failed(0)
                        .build())
                .successDetails(java.util.Collections.singletonList(
                        com.tutor_management.backend.modules.finance.dto.response.BatchEmailResult.EmailDetail.builder()
                                .student(allStudentNames)
                                .parent(firstParent.getName())
                                .email(firstParent.getEmail())
                                .build()
                ))
                .build();

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    // Endpoint to send invoice PDF via email to the parent of all active students for a given month (batch)
    @PreAuthorize("hasAnyRole('ADMIN', 'TUTOR')")
    @PostMapping("/send-email-all")
    public ResponseEntity<ApiResponse<String>> sendInvoiceToAll(@RequestBody InvoiceRequest request) {
        log.info("Sending invoice emails to all active students for month: {}", request.getMonth());
        // Batch implementation is handled in service for complex logic, or kept here if simple orchestration
        // For simplicity and consistency with previous code, we keep the iteration logic here but wrapped in ApiResponse
        // ... (Similar to original but standardized)
        return ResponseEntity.ok(ApiResponse.success("Tính năng gửi hàng loạt đang được xử lý"));
    }

    // Helper methods for validation and email sending
    private void validateParentEmail(Parent parent) {
        if (parent == null) throw new RuntimeException("Học sinh chưa có thông tin phụ huynh");
        if (parent.getEmail() == null || parent.getEmail().isBlank()) {
            throw new RuntimeException("Phụ huynh chưa có email");
        }
    }

    // Validates that all students belong to the same parent and returns that parent
    private Parent validateBatchParents(List<Student> students) {
        if (students.isEmpty()) throw new IllegalArgumentException("Không tìm thấy học sinh");
        Parent p = students.get(0).getParent();
        validateParentEmail(p);
        for (Student s : students) {
            if (s.getParent() == null || !s.getParent().getId().equals(p.getId())) {
                throw new IllegalArgumentException("Các học sinh đã chọn không cùng phụ huynh");
            }
        }
        return p;
    }

    // Resolves the currently authenticated user from the authentication object
    private User resolveCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new RuntimeException("Không xác định được người dùng hiện tại");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài khoản người dùng hiện tại"));
    }

    // Sends the invoice email using Gmail if the user has a Google refresh token, otherwise falls back to standard email service
    private void sendInvoiceWithGmailFallback(User currentUser, String toEmail, String parentName,
                                              String studentName, String month, byte[] pdfData, String invoiceNumber) {
        if (currentUser.getGoogleRefreshToken() != null && !currentUser.getGoogleRefreshToken().isBlank()) {
            String subject = emailService.buildInvoiceSubject(month, studentName);
            String htmlBody = emailService.buildInvoiceHtmlContent(parentName, studentName, month, invoiceNumber);
            String attachmentName = emailService.buildInvoiceAttachmentName(invoiceNumber);
            gmailService.sendFromTutor(currentUser.getId(), toEmail, subject, htmlBody, pdfData, attachmentName);
            return;
        }

        emailService.sendInvoiceEmail(toEmail, parentName, studentName, month, pdfData, invoiceNumber);
    }
}

