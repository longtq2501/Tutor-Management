package com.tutor_management.backend.modules.finance.service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import com.tutor_management.backend.modules.finance.entity.SessionRecord;
import com.tutor_management.backend.modules.finance.repository.SessionRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tutor_management.backend.modules.finance.dto.request.InvoiceRequest;
import com.tutor_management.backend.modules.finance.dto.response.BankInfo;
import com.tutor_management.backend.modules.finance.dto.response.InvoiceItem;
import com.tutor_management.backend.modules.finance.dto.response.InvoiceResponse;
import com.tutor_management.backend.modules.student.entity.Student;
import com.tutor_management.backend.modules.student.repository.StudentRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import com.tutor_management.backend.modules.auth.User;
import com.tutor_management.backend.modules.auth.UserRepository;

/**
 * Service for dynamically generating financial invoices from session data.
 * Supports bulk processing for multiple students and cross-month records.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class InvoiceService {

    private final SessionRecordRepository sessionRecordRepository;
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;

    private final DateTimeFormatter dayFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Entry point for invoice generation logic.
     * Branches into specific generation strategies based on request parameters.
     */
    public InvoiceResponse generateInvoice(InvoiceRequest request) {
        if (hasSessionIds(request)) return generateFromSessionIds(request);
        if (isMultipleStudents(request)) return generateForMultipleStudents(request);
        if (isAllStudents(request)) return generateMonthlyInvoiceForAll(request.getMonth());

        return generateForSingleStudent(request);
    }

    // --- Generation Strategies ---

    private InvoiceResponse generateFromSessionIds(InvoiceRequest r) {
        List<SessionRecord> records = sessionRecordRepository.findAllByIdWithStudent(r.getSessionRecordIds());
        if (records.isEmpty()) throw new RuntimeException("Không tìm thấy dữ liệu buổi học để tạo báo giá");

        Set<String> months = records.stream().map(SessionRecord::getMonth).collect(Collectors.toSet());
        Map<Student, List<SessionRecord>> studentMap = records.stream().collect(Collectors.groupingBy(SessionRecord::getStudent));

        boolean multiStudents = studentMap.size() > 1;
        boolean multiMonths = months.size() > 1;

        long totalAmount = records.stream().mapToLong(SessionRecord::getTotalAmount).sum();
        String studentName = deriveStudentName(studentMap);
        String monthText = multiMonths ? formatMultipleMonths(months) : formatMonth(months.iterator().next());

        List<InvoiceItem> items = multiStudents 
            ? mapToSummaryItems(studentMap) 
            : mapToDetailedItems(records);

        String invNum = generateInvoiceNumber(months.iterator().next(), multiMonths, multiStudents);
        
        return buildResponse(invNum, studentName, monthText, records, items, totalAmount);
    }

    private InvoiceResponse generateForSingleStudent(InvoiceRequest r) {
        Student student = studentRepository.findById(r.getStudentId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy học sinh"));

        List<SessionRecord> records = sessionRecordRepository.findByStudentIdAndMonth(r.getStudentId(), r.getMonth())
                .stream().filter(rec -> !rec.getPaid()).toList();

        if (records.isEmpty()) throw new RuntimeException("Không tìm thấy buổi học nào chưa thanh toán trong tháng " + r.getMonth());

        long total = records.stream().mapToLong(SessionRecord::getTotalAmount).sum();
        List<InvoiceItem> items = mapToDetailedItems(records);
        String invNum = generateInvoiceNumber(r.getMonth(), false, false);

        return buildResponse(invNum, student.getName(), formatMonth(r.getMonth()), records, items, total);
    }

    private InvoiceResponse generateForMultipleStudents(InvoiceRequest r) {
        List<SessionRecord> records = sessionRecordRepository.findByMonthAndStudentIdIn(r.getMonth(), r.getSelectedStudentIds());
        if (records.isEmpty()) throw new RuntimeException("Không tìm thấy dữ liệu cho danh sách học sinh đã chọn");

        Map<Student, List<SessionRecord>> studentMap = records.stream().collect(Collectors.groupingBy(SessionRecord::getStudent));
        long total = records.stream().mapToLong(SessionRecord::getTotalAmount).sum();
        
        List<InvoiceItem> items = mapToSummaryItems(studentMap);
        String invNum = generateInvoiceNumber(r.getMonth(), false, true) + "-MULTI";

        return buildResponse(invNum, deriveStudentName(studentMap), formatMonth(r.getMonth()), records, items, total);
    }

    private InvoiceResponse generateMonthlyInvoiceForAll(String month) {
        List<SessionRecord> records = sessionRecordRepository.findByMonth(month);
        if (records.isEmpty()) throw new RuntimeException("Không có dữ liệu buổi học nào trong tháng " + month);

        Map<Student, List<SessionRecord>> studentMap = records.stream().collect(Collectors.groupingBy(SessionRecord::getStudent));
        long total = records.stream().mapToLong(SessionRecord::getTotalAmount).sum();
        
        List<InvoiceItem> items = mapToSummaryItems(studentMap);
        String invNum = generateInvoiceNumber(month, false, true) + "-ALL";

        return buildResponse(invNum, "TẤT CẢ HỌC SINH", formatMonth(month), records, items, total);
    }

    // --- Helpers ---

    private boolean hasSessionIds(InvoiceRequest r) { return r.getSessionRecordIds() != null && !r.getSessionRecordIds().isEmpty(); }
    private boolean isMultipleStudents(InvoiceRequest r) { return Boolean.TRUE.equals(r.getMultipleStudents()) && r.getSelectedStudentIds() != null; }
    private boolean isAllStudents(InvoiceRequest r) { return Boolean.TRUE.equals(r.getAllStudents()); }

    private String deriveStudentName(Map<Student, List<SessionRecord>> map) {
        List<String> names = map.keySet().stream().map(Student::getName).sorted().toList();
        if (names.size() == 1) return names.get(0);
        if (names.size() == 2) return String.join(" và ", names);
        return names.get(0) + " và " + (names.size() - 1) + " học sinh khác";
    }

    private List<InvoiceItem> mapToDetailedItems(List<SessionRecord> records) {
        return records.stream()
                .sorted((a, b) -> a.getSessionDate().compareTo(b.getSessionDate()))
                .map(r -> InvoiceItem.builder()
                        .date(r.getSessionDate().format(dayFormatter))
                        .description("Buổi học tiếng Anh")
                        .sessions(r.getSessions()).hours(r.getHours())
                        .pricePerHour(r.getPricePerHour()).amount(r.getTotalAmount())
                        .build())
                .collect(Collectors.toList());
    }

    private List<InvoiceItem> mapToSummaryItems(Map<Student, List<SessionRecord>> map) {
        return map.entrySet().stream()
                .map(entry -> {
                    Student s = entry.getKey();
                    List<SessionRecord> recs = entry.getValue();
                    return InvoiceItem.builder()
                            .date(formatMultipleMonths(recs.stream().map(SessionRecord::getMonth).collect(Collectors.toSet())))
                            .description(s.getName() + " - Học phí")
                            .sessions(recs.stream().mapToInt(SessionRecord::getSessions).sum())
                            .hours(recs.stream().mapToDouble(SessionRecord::getHours).sum())
                            .pricePerHour(recs.get(0).getPricePerHour())
                            .amount(recs.stream().mapToLong(SessionRecord::getTotalAmount).sum())
                            .build();
                })
                .sorted((a, b) -> a.getDescription().compareTo(b.getDescription()))
                .toList();
    }

    private InvoiceResponse buildResponse(String num, String name, String month, List<SessionRecord> records, List<InvoiceItem> items, long total) {
        BankInfo bankInfo = getCurrentTutorBankInfo();
        
        return InvoiceResponse.builder()
                .invoiceNumber(num).studentName(name).month(month)
                .totalSessions(records.stream().mapToInt(SessionRecord::getSessions).sum())
                .totalHours(records.stream().mapToDouble(SessionRecord::getHours).sum())
                .totalAmount(total).items(items)
                .bankInfo(bankInfo)
                .qrCodeUrl(generateQRContent(total, num, bankInfo.getAccountNumber(), bankInfo.getBankCode()))
                .createdDate(LocalDate.now().format(dayFormatter))
                .build();
    }

    private BankInfo getCurrentTutorBankInfo() {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof User user) {
                // Refresh user from DB to get latest bank info
                User latestUser = userRepository.findById(user.getId()).orElse(user);
                
                if (latestUser.getBankName() != null && latestUser.getAccountNumber() != null) {
                    return BankInfo.builder()
                            .bankName(latestUser.getBankName())
                            .accountNumber(latestUser.getAccountNumber())
                            .accountName(latestUser.getAccountName())
                            .bankCode(latestUser.getBankCode())
                            .build();
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch current tutor bank info, using default: {}", e.getMessage());
        }
        return BankInfo.getDefault();
    }

    private String formatMultipleMonths(Set<String> months) {
        if (months.size() == 1) return formatMonth(months.iterator().next());
        String year = months.iterator().next().split("-")[0];
        String nums = months.stream().sorted().map(m -> m.split("-")[1]).collect(Collectors.joining(", "));
        return "Tháng " + nums + "/" + year;
    }

    private String formatMonth(String month) {
        if (month == null || !month.contains("-")) return "N/A";
        String[] p = month.split("-");
        return "Tháng " + p[1] + "/" + p[0];
    }

    private String generateInvoiceNumber(String month, boolean multiMonths, boolean multiStudents) {
        String base = month != null ? month.replace("-", "") : "000000";
        long count = sessionRecordRepository.count();
        String suffix = (multiMonths ? "M" : "") + (multiStudents ? "S" : "");
        return String.format("INV-%s-%03d%s", base, count + 1, suffix.isEmpty() ? "" : "-" + suffix);
    }

    private String generateQRContent(long amount, String num, String accountNumber, String bankCode) {
        String code = (bankCode != null && !bankCode.isEmpty()) ? bankCode : "970436"; // Vietcombank default
        String acc = accountNumber != null ? accountNumber : "1041819355"; // Fallback to demo if null
        return String.format("https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s", 
                code, acc, amount, num.replace("-", ""));
    }
}
