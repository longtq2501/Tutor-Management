package com.tutor_management.backend.service;

import com.tutor_management.backend.dto.request.InvoiceRequest;
import com.tutor_management.backend.dto.response.BankInfo;
import com.tutor_management.backend.dto.response.InvoiceItem;
import com.tutor_management.backend.dto.response.InvoiceResponse;
import com.tutor_management.backend.entity.*;
import com.tutor_management.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final SessionRecordRepository sessionRecordRepository;
    private final StudentRepository studentRepository;

    public InvoiceResponse generateInvoice(InvoiceRequest request) {
        // Kiểm tra nếu là nhiều học sinh (nhưng không phải tất cả)
        if (Boolean.TRUE.equals(request.getMultipleStudents()) &&
                request.getSelectedStudentIds() != null &&
                !request.getSelectedStudentIds().isEmpty()) {
            return generateInvoiceForMultipleStudents(request);
        }

        // KIỂM TRA: Nếu allStudents = true → Báo giá tổng tháng
        if (Boolean.TRUE.equals(request.getAllStudents())) {
            return generateMonthlyInvoiceForAll(request.getMonth());
        }

        // Logic cũ: Báo giá cho 1 học sinh (GIỮ NGUYÊN)
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<SessionRecord> records;
        if (request.getSessionRecordIds() != null && !request.getSessionRecordIds().isEmpty()) {
            records = sessionRecordRepository.findAllById(request.getSessionRecordIds());
        } else {
            // Get all unpaid sessions for the month
            records = sessionRecordRepository.findByStudentIdOrderByCreatedAtDesc(request.getStudentId())
                    .stream()
                    .filter(r -> r.getMonth().equals(request.getMonth()) && !r.getPaid())
                    .collect(Collectors.toList());
        }

        if (records.isEmpty()) {
            throw new RuntimeException("No sessions found for invoice");
        }

        // Calculate totals
        int totalSessions = records.stream().mapToInt(SessionRecord::getSessions).sum();
        int totalHours = records.stream().mapToInt(SessionRecord::getHours).sum();
        long totalAmount = records.stream().mapToLong(SessionRecord::getTotalAmount).sum();

        // Build invoice items - CHI TIẾT TỪNG NGÀY
        List<InvoiceItem> items = records.stream()
                .sorted((a, b) -> a.getSessionDate().compareTo(b.getSessionDate()))
                .map(record -> InvoiceItem.builder()
                        .date(formatDate(record.getSessionDate()))
                        .description("Buổi học tiếng Anh")
                        .sessions(record.getSessions())
                        .hours(record.getHours())
                        .pricePerHour(record.getPricePerHour())
                        .amount(record.getTotalAmount())
                        .build())
                .collect(Collectors.toList());

        // Generate invoice number
        String invoiceNumber = generateInvoiceNumber(request.getMonth());

        // Generate QR code content
        String qrContent = generateQRContent(totalAmount, invoiceNumber);

        return InvoiceResponse.builder()
                .invoiceNumber(invoiceNumber)
                .studentName(student.getName())
                .month(formatMonth(request.getMonth()))
                .totalSessions(totalSessions)
                .totalHours(totalHours)
                .totalAmount(totalAmount)
                .items(items)
                .bankInfo(BankInfo.getDefault())
                .qrCodeUrl(qrContent)
                .createdDate(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .build();
    }

    private InvoiceResponse generateInvoiceForMultipleStudents(InvoiceRequest request) {
        // Lấy tất cả session records của các học sinh được chọn trong tháng
        List<SessionRecord> allRecords = sessionRecordRepository.findAll()
                .stream()
                .filter(r -> r.getMonth().equals(request.getMonth()))
                .filter(r -> request.getSelectedStudentIds().contains(r.getStudent().getId()))
                .collect(Collectors.toList());

        if (allRecords.isEmpty()) {
            throw new RuntimeException("No sessions found for selected students");
        }

        // Tính tổng
        int totalSessions = allRecords.stream().mapToInt(SessionRecord::getSessions).sum();
        int totalHours = allRecords.stream().mapToInt(SessionRecord::getHours).sum();
        long totalAmount = allRecords.stream().mapToLong(SessionRecord::getTotalAmount).sum();

        // Nhóm theo học sinh
        Map<Student, List<SessionRecord>> groupedByStudent = allRecords.stream()
                .collect(Collectors.groupingBy(SessionRecord::getStudent));

        // Tạo items - mỗi học sinh một dòng
        List<InvoiceItem> items = groupedByStudent.entrySet().stream()
                .map(entry -> {
                    Student student = entry.getKey();
                    List<SessionRecord> studentRecords = entry.getValue();

                    int studentSessions = studentRecords.stream()
                            .mapToInt(SessionRecord::getSessions).sum();
                    int studentHours = studentRecords.stream()
                            .mapToInt(SessionRecord::getHours).sum();
                    long studentAmount = studentRecords.stream()
                            .mapToLong(SessionRecord::getTotalAmount).sum();

                    return InvoiceItem.builder()
                            .date(formatMonth(request.getMonth()))
                            .description(student.getName() + " - Học phí tháng")
                            .sessions(studentSessions)
                            .hours(studentHours)
                            .pricePerHour(studentRecords.get(0).getPricePerHour())
                            .amount(studentAmount)
                            .build();
                })
                .sorted((a, b) -> a.getDescription().compareTo(b.getDescription()))
                .collect(Collectors.toList());

        // Tạo tên học sinh cho invoice (liệt kê các học sinh)
        List<String> studentNames = groupedByStudent.keySet().stream()
                .map(Student::getName)
                .sorted()
                .collect(Collectors.toList());

        String studentNameForInvoice;
        if (studentNames.size() <= 2) {
            studentNameForInvoice = String.join(" và ", studentNames);
        } else {
            studentNameForInvoice = studentNames.get(0) + " và " + (studentNames.size() - 1) + " học sinh khác";
        }

        // Generate invoice number
        String invoiceNumber = generateInvoiceNumber(request.getMonth()) + "-MULTI";

        // Generate QR code
        String qrContent = generateQRContent(totalAmount, invoiceNumber);

        return InvoiceResponse.builder()
                .invoiceNumber(invoiceNumber)
                .studentName(studentNameForInvoice)
                .month(formatMonth(request.getMonth()))
                .totalSessions(totalSessions)
                .totalHours(totalHours)
                .totalAmount(totalAmount)
                .items(items)
                .bankInfo(BankInfo.getDefault())
                .qrCodeUrl(qrContent)
                .createdDate(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .build();
    }

    // METHOD MỚI: Tạo báo giá tổng cho tất cả học sinh trong tháng
    private InvoiceResponse generateMonthlyInvoiceForAll(String month) {
        // Lấy TẤT CẢ records của tháng đó
        List<SessionRecord> allRecords = sessionRecordRepository.findAll()
                .stream()
                .filter(r -> r.getMonth().equals(month))
                .collect(Collectors.toList());

        if (allRecords.isEmpty()) {
            throw new RuntimeException("No sessions found for this month");
        }

        // Tính tổng
        int totalSessions = allRecords.stream().mapToInt(SessionRecord::getSessions).sum();
        int totalHours = allRecords.stream().mapToInt(SessionRecord::getHours).sum();
        long totalAmount = allRecords.stream().mapToLong(SessionRecord::getTotalAmount).sum();

        // Nhóm theo StudentId để tạo items - ĐÚNG: dùng record.getStudent().getId()
        Map<Long, List<SessionRecord>> groupedByStudent = allRecords.stream()
                .collect(Collectors.groupingBy(record -> record.getStudent().getId()));

        // Tạo items - MỖI HỌC SINH 1 DÒNG
        List<InvoiceItem> items = groupedByStudent.entrySet().stream()
                .map(entry -> {
                    List<SessionRecord> studentRecords = entry.getValue();
                    SessionRecord firstRecord = studentRecords.get(0);

                    int studentSessions = studentRecords.stream()
                            .mapToInt(SessionRecord::getSessions).sum();
                    int studentHours = studentRecords.stream()
                            .mapToInt(SessionRecord::getHours).sum();
                    long studentAmount = studentRecords.stream()
                            .mapToLong(SessionRecord::getTotalAmount).sum();

                    return InvoiceItem.builder()
                            .date(formatMonth(month))
                            .description(firstRecord.getStudent().getName() + " - Học phí tháng")
                            .sessions(studentSessions)
                            .hours(studentHours)
                            .pricePerHour(firstRecord.getPricePerHour())
                            .amount(studentAmount)
                            .build();
                })
                .sorted((a, b) -> a.getDescription().compareTo(b.getDescription())) // Sắp xếp theo tên
                .collect(Collectors.toList());

        // Generate invoice number
        String invoiceNumber = generateInvoiceNumber(month) + "-ALL";

        // Generate QR code
        String qrContent = generateQRContent(totalAmount, invoiceNumber);

        return InvoiceResponse.builder()
                .invoiceNumber(invoiceNumber)
                .studentName("TẤT CẢ HỌC SINH")
                .month(formatMonth(month))
                .totalSessions(totalSessions)
                .totalHours(totalHours)
                .totalAmount(totalAmount)
                .items(items)
                .bankInfo(BankInfo.getDefault())
                .qrCodeUrl(qrContent)
                .createdDate(LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .build();
    }

    private String generateInvoiceNumber(String month) {
        String[] parts = month.split("-");
        long count = sessionRecordRepository.count(); // Simple counter
        return String.format("INV-%s-%s-%03d", parts[0], parts[1], count + 1);
    }

    private String formatDate(LocalDate date) {
        return date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
    }

    private String formatMonth(String month) {
        String[] parts = month.split("-");
        return String.format("Tháng %s/%s", parts[1], parts[0]);
    }

    private String generateQRContent(long amount, String invoiceNumber) {
        // VietQR format for Vietcombank
        String bankCode = "970436"; // Vietcombank
        String accountNumber = "1041819355";
        String template = "compact2";
        String description = invoiceNumber.replace("-", "");

        return String.format(
                "https://img.vietqr.io/image/%s-%s-%s.png?amount=%d&addInfo=%s",
                bankCode, accountNumber, template, amount, description
        );
    }
}