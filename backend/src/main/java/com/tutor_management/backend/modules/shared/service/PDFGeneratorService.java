package com.tutor_management.backend.modules.shared.service;

import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.canvas.draw.SolidLine;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.*;
import com.itextpdf.kernel.colors.*;
import com.itextpdf.io.font.PdfEncodings;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.io.image.ImageDataFactory;
import com.tutor_management.backend.modules.finance.dto.response.InvoiceItem;
import com.tutor_management.backend.modules.finance.dto.response.InvoiceResponse;
import com.tutor_management.backend.modules.finance.dto.response.MonthlyStats;
import com.tutor_management.backend.modules.dashboard.dto.response.DashboardStats;
import com.tutor_management.backend.modules.report.dto.MonthlyReportDataDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.net.URL;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Service for generating professional PDF documents.
 * Supports system dashboard reports and student invoices with full Unicode (Vietnamese) support.
 */
@Service
@Slf4j
public class PDFGeneratorService {



    /**
     * Generates a PDF report for the system dashboard.
     *
     * @param stats Aggregate system statistics.
     * @param monthlyStats Historical monthly revenue data.
     * @return A byte array representing the dashboard report PDF.
     * @throws Exception If PDF generation fails.
     */
    public byte[] generateDashboardReportPDF(DashboardStats stats, List<MonthlyStats> monthlyStats) throws Exception {
        log.info("Generating dashboard report PDF");
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        loadVietnameseFonts();
        document.setMargins(30, 40, 30, 40);
        document.setFont(getRegularFont());

        addDashboardHeader(document);
        addDashboardSummary(document, stats);
        document.add(new Paragraph(" ").setFontSize(5));
        addMonthlyStatsTable(document, monthlyStats);
        addDashboardFooter(document);

        document.close();
        return baos.toByteArray();
    }

    /**
     * Generates a professional invoice PDF for a student.
     *
     * @param invoice The invoice data response.
     * @return A byte array representing the invoice PDF.
     * @throws Exception If PDF generation fails.
     */
    public byte[] generateInvoicePDF(InvoiceResponse invoice) throws Exception {
        log.info("Generating invoice PDF for student: {}", invoice.getStudentName());
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        loadVietnameseFonts();
        document.setMargins(30, 40, 30, 40);
        document.setFont(getRegularFont());

        addInvoiceHeader(document, invoice);
        addInvoiceRecipientInfo(document, invoice);
        addVerticalSpacing(document, 15);
        addInvoiceItemsTable(document, invoice);
        addPaymentInformation(document, invoice);
        addInvoiceFooter(document);

        document.close();
        return baos.toByteArray();
    }

        /**
         * Generates a monthly learning progress report PDF for one student.
         */
        public byte[] generateMonthlyProgressReportPDF(MonthlyReportDataDTO report) throws Exception {
        log.info("Generating monthly report PDF for student: {}, month: {}/{}",
            report.getStudentName(), report.getMonth(), report.getYear());

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(baos);
        PdfDocument pdf = new PdfDocument(writer);
        Document document = new Document(pdf);

        loadVietnameseFonts();
        document.setMargins(30, 40, 30, 40);
        document.setFont(getRegularFont());

        document.add(new Paragraph("BÁO CÁO TIẾN ĐỘ HỌC TẬP")
            .setFont(getBoldFont())
            .setFontSize(22)
            .setTextAlignment(TextAlignment.CENTER)
            .setMarginBottom(4));

        document.add(new Paragraph(String.format("Tháng %d/%d • Học sinh: %s", report.getMonth(), report.getYear(), report.getStudentName()))
            .setFont(getRegularFont())
            .setFontSize(11)
            .setTextAlignment(TextAlignment.CENTER)
            .setFontColor(new DeviceRgb(90, 90, 90))
            .setMarginBottom(12));

        document.add(new Paragraph("Gia sư: " + nvl(report.getTutorName()))
            .setFont(getRegularFont())
            .setFontSize(10)
            .setMarginBottom(12));

        addHorizontalLine(document);

        Table summary = new Table(new float[]{2, 2, 2, 2}).useAllAvailableWidth().setMarginTop(8).setMarginBottom(12);
        summary.addCell(createSummaryCell("Tổng buổi", String.valueOf(nvlInt(report.getTotalSessions())), new DeviceRgb(59, 130, 246)));
        summary.addCell(createSummaryCell("Có mặt", String.valueOf(nvlInt(report.getAttendedSessions())), new DeviceRgb(34, 197, 94)));
        summary.addCell(createSummaryCell("Vắng", String.valueOf(nvlInt(report.getAbsentSessions())), new DeviceRgb(239, 68, 68)));
        summary.addCell(createSummaryCell("Chuyên cần", String.format("%.1f%%", nvlDouble(report.getAttendanceRate())), new DeviceRgb(147, 51, 234)));
        document.add(summary);

        document.add(new Paragraph("KẾT QUẢ KIỂM TRA")
            .setFont(getBoldFont())
            .setFontSize(13)
            .setMarginBottom(8));

        document.add(new Paragraph(String.format("Điểm trung bình: %.1f", nvlDouble(report.getAverageScore())))
            .setFont(getRegularFont())
            .setFontSize(10));
        document.add(new Paragraph(String.format("So với tháng trước: %s", formatImprovement(report.getScoreImprovement())))
            .setFont(getRegularFont())
            .setFontSize(10)
            .setMarginBottom(8));

        Table assessmentTable = new Table(new float[]{4.2f, 1.2f, 1.4f, 2.0f}).useAllAvailableWidth().setMarginBottom(14);
        assessmentTable.addHeaderCell(createHeaderCell("Bài kiểm tra"));
        assessmentTable.addHeaderCell(createHeaderCell("Điểm"));
        assessmentTable.addHeaderCell(createHeaderCell("Tối đa"));
        assessmentTable.addHeaderCell(createHeaderCell("Ngày"));

        if (report.getAssessments() == null || report.getAssessments().isEmpty()) {
            assessmentTable.addCell(new Cell(1, 4)
                .add(new Paragraph("Không có dữ liệu kiểm tra trong tháng").setFont(getRegularFont()).setFontSize(10))
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(8));
        } else {
            for (MonthlyReportDataDTO.AssessmentSummary assessment : report.getAssessments()) {
            assessmentTable.addCell(createTableCell(nvl(assessment.getTitle())));
            assessmentTable.addCell(createTableCellRight(String.format("%.1f", nvlDouble(assessment.getScore()))));
            assessmentTable.addCell(createTableCellRight(String.format("%.1f", nvlDouble(assessment.getMaxScore()))));
            assessmentTable.addCell(createTableCellCenter(assessment.getDate() == null
                ? ""
                : assessment.getDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))));
            }
        }
        document.add(assessmentTable);

        document.add(new Paragraph("AI FEEDBACK THAM KHẢO")
            .setFont(getBoldFont())
            .setFontSize(13)
            .setMarginBottom(8));

        if (report.getSessionFeedbacks() == null || report.getSessionFeedbacks().isEmpty()) {
            document.add(new Paragraph("Không có feedback trong tháng")
                .setFont(getRegularFont())
                .setFontSize(10)
                .setMarginBottom(10));
        } else {
            int limit = Math.min(report.getSessionFeedbacks().size(), 8);
            for (int i = 0; i < limit; i++) {
            MonthlyReportDataDTO.SessionFeedback feedback = report.getSessionFeedbacks().get(i);
            String date = feedback.getSessionDate() == null
                ? ""
                : feedback.getSessionDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            document.add(new Paragraph("• " + date + " - " + nvl(feedback.getFeedback()))
                .setFont(getRegularFont())
                .setFontSize(9)
                .setMarginBottom(4));
            }
        }

        addVerticalSpacing(document, 8);

        document.add(new Paragraph("NHẬN XÉT CỦA GIA SƯ")
            .setFont(getBoldFont())
            .setFontSize(13)
            .setMarginBottom(6));
        document.add(new Paragraph(nvl(report.getTutorComment()).isBlank()
            ? "(Chưa có nhận xét)"
            : report.getTutorComment())
            .setFont(getRegularFont())
            .setFontSize(10)
            .setMarginBottom(12));

        document.add(new Paragraph("TÀI CHÍNH")
            .setFont(getBoldFont())
            .setFontSize(13)
            .setMarginBottom(6));
        document.add(new Paragraph("Tổng học phí: " + formatCurrency(report.getTotalFee())).setFont(getRegularFont()).setFontSize(10));
        document.add(new Paragraph("Đã thanh toán: " + formatCurrency(report.getPaidAmount())).setFont(getRegularFont()).setFontSize(10));
        document.add(new Paragraph("Còn lại: " + formatCurrency(report.getRemainingAmount())).setFont(getRegularFont()).setFontSize(10));
        document.add(new Paragraph("Trạng thái: " + nvl(report.getPaymentStatus())).setFont(getBoldFont()).setFontSize(10));

        document.add(new Paragraph("\nTutor Pro Management System - Báo cáo tiến độ tháng")
            .setFont(getRegularFont())
            .setFontSize(8)
            .setFontColor(new DeviceRgb(156, 163, 175))
            .setTextAlignment(TextAlignment.CENTER));

        document.close();
        return baos.toByteArray();
        }

    // --- Dashboard Private Components ---

    private void addDashboardHeader(Document document) {
        Paragraph title = new Paragraph("BÁO CÁO TỔNG QUAN HỆ THỐNG")
                .setFont(getBoldFont())
                .setFontSize(24)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(5);
        document.add(title);

        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"));
        Paragraph date = new Paragraph("Ngày xuất báo cáo: " + timestamp)
                .setFont(getRegularFont())
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(15)
                .setFontColor(new DeviceRgb(100, 100, 100));
        document.add(date);

        addHorizontalLine(document);
    }

    private void addDashboardSummary(Document document, DashboardStats stats) {
        Table table = new Table(4).useAllAvailableWidth();
        table.setMarginTop(10);

        table.addCell(createSummaryCell("HỌC SINH", String.valueOf(stats.getTotalStudents()), new DeviceRgb(59, 130, 246)));
        table.addCell(createSummaryCell("DOANH THU", stats.getCurrentMonthTotal(), new DeviceRgb(16, 185, 129)));
        table.addCell(createSummaryCell("ĐÃ THU", stats.getTotalPaidAllTime(), new DeviceRgb(34, 197, 94)));
        table.addCell(createSummaryCell("CHƯA THU", stats.getTotalUnpaidAllTime(), new DeviceRgb(239, 68, 68)));

        document.add(table);
    }

    private Cell createSummaryCell(String label, String value, Color color) {
        Cell cell = new Cell()
                .setBorder(new com.itextpdf.layout.borders.SolidBorder(new DeviceRgb(229, 231, 235), 1))
                .setPadding(8)
                .setMargin(2);

        cell.add(new Paragraph(label)
                .setFont(getBoldFont())
                .setFontSize(10)
                .setFontColor(new DeviceRgb(107, 114, 128))
                .setMarginBottom(5));
        
        cell.add(new Paragraph(value)
                .setFont(getBoldFont())
                .setFontSize(14)
                .setFontColor(color));

        return cell;
    }

    private void addMonthlyStatsTable(Document document, List<MonthlyStats> monthlyStats) {
        document.add(new Paragraph("CHI TIẾT DOANH THU THEO THÁNG")
                .setFont(getBoldFont())
                .setFontSize(14)
                .setMarginBottom(10));

        Table table = new Table(new float[]{3, 3, 3, 2}).useAllAvailableWidth();

        String[] headers = {"Tháng", "Đã Thu", "Chưa Thu", "Số Buổi"};
        for (String header : headers) {
            table.addHeaderCell(new Cell()
                    .add(new Paragraph(header).setFont(getBoldFont()).setFontSize(10).setFontColor(ColorConstants.WHITE))
                    .setBackgroundColor(new DeviceRgb(75, 85, 99))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setPadding(8));
        }

        for (MonthlyStats ms : monthlyStats) {
            table.addCell(createTableCell(formatMonth(ms.getMonth())));
            table.addCell(createTableCellRight(formatCurrency(ms.getTotalPaid())));
            table.addCell(createTableCellRight(formatCurrency(ms.getTotalUnpaid())));
            table.addCell(createTableCellCenter(String.valueOf(ms.getTotalSessions())));
        }

        document.add(table);
    }

    private void addDashboardFooter(Document document) {
        document.add(new Paragraph("\nTutor Pro Management System - Báo cáo tự động")
                .setFont(getRegularFont())
                .setFontSize(8)
                .setFontColor(new DeviceRgb(156, 163, 175))
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginTop(15));
    }

    // --- Invoice Private Components ---

    private void addInvoiceHeader(Document document, InvoiceResponse invoice) {
        document.add(new Paragraph("BÁO GIÁ HỌC PHÍ")
                .setFont(getBoldFont())
                .setFontSize(28)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(5));

        document.add(new Paragraph("ENGLISH TUTORING")
                .setFont(getRegularFont())
                .setFontSize(16)
                .setTextAlignment(TextAlignment.CENTER)
                .setMarginBottom(30)
                .setFontColor(new DeviceRgb(100, 100, 100)));

        Table headerTable = new Table(2).useAllAvailableWidth();
        headerTable.setMarginBottom(20);
        headerTable.addCell(new Cell().setBorder(null)); // Left padding

        Paragraph invoiceInfo = new Paragraph()
                .setFont(getRegularFont())
                .setTextAlignment(TextAlignment.RIGHT);
        invoiceInfo.add(new Text("Số: ").setFont(getBoldFont())).add(invoice.getInvoiceNumber() + "\n");
        invoiceInfo.add(new Text("Ngày: ").setFont(getBoldFont())).add(invoice.getCreatedDate());

        headerTable.addCell(new Cell().add(invoiceInfo).setBorder(null).setTextAlignment(TextAlignment.RIGHT));
        document.add(headerTable);
        addHorizontalLine(document);
    }

    private void addInvoiceRecipientInfo(Document document, InvoiceResponse invoice) {
        Table infoTable = new Table(1).useAllAvailableWidth().setMarginBottom(10);
        Paragraph studentInfo = new Paragraph()
                .setFont(getRegularFont())
                .add(new Text("Học sinh: ").setFont(getBoldFont()))
                .add(invoice.getStudentName() + "\n")
                .add(new Text("Thời gian: ").setFont(getBoldFont()))
                .add(invoice.getMonth());

        infoTable.addCell(new Cell().add(studentInfo).setBorder(null));
        document.add(infoTable);
    }

    private void addInvoiceItemsTable(Document document, InvoiceResponse invoice) {
        Table table = new Table(new float[] { 2, 4, 1.5f, 1.5f, 2, 2.5f }).useAllAvailableWidth().setMarginBottom(10);

        String[] headers = { "Ngày", "Nội dung", "Buổi", "Giờ", "Đơn giá", "Thành tiền" };
        for (String header : headers) {
            table.addHeaderCell(new Cell()
                    .add(new Paragraph(header).setFont(getBoldFont()).setFontSize(10))
                    .setBackgroundColor(new DeviceRgb(59, 130, 246))
                    .setFontColor(ColorConstants.WHITE)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setPadding(8));
        }

        for (InvoiceItem item : invoice.getItems()) {
            table.addCell(createTableCell(item.getDate()));
            table.addCell(createTableCell(item.getDescription()));
            table.addCell(createTableCellCenter(String.valueOf(item.getSessions())));
            table.addCell(createTableCellCenter(String.valueOf(item.getHours())));
            table.addCell(createTableCellRight(formatCurrency(item.getPricePerHour())));
            table.addCell(createTableCellRight(formatCurrency(item.getAmount())));
        }

        table.addCell(new Cell(1, 5).add(new Paragraph("TỔNG CỘNG").setFont(getBoldFont()).setFontSize(11))
                .setTextAlignment(TextAlignment.RIGHT).setBackgroundColor(new DeviceRgb(243, 244, 246)).setPadding(10));
        table.addCell(new Cell().add(new Paragraph(formatCurrency(invoice.getTotalAmount())).setFont(getBoldFont()).setFontSize(11))
                .setBackgroundColor(new DeviceRgb(243, 244, 246)).setTextAlignment(TextAlignment.RIGHT).setPadding(10));

        document.add(table);
    }

    private void addPaymentInformation(Document document, InvoiceResponse invoice) {
        boolean isCompact = invoice.getItems().size() > 3;
        
        // Create table with appropriate column configuration
        Table bankTable;
        if (isCompact) {
            bankTable = new Table(1).useAllAvailableWidth();
        } else {
            bankTable = new Table(new float[]{1f, 1.1f}).useAllAvailableWidth();
        }

        Paragraph bankDetails = new Paragraph().setFont(getRegularFont()).setFontSize(10)
                .add(new Text("THÔNG TIN CHUYỂN KHOẢN\n").setFont(getBoldFont()).setFontSize(12))
                .add("Ngân hàng: " + invoice.getBankInfo().getBankName() + "\n")
                .add("Số tài khoản: " + invoice.getBankInfo().getAccountNumber() + "\n")
                .add("Tên tài khoản: " + invoice.getBankInfo().getAccountName() + "\n")
                .add("Nội dung: " + invoice.getInvoiceNumber());

        Cell bankCell = new Cell().add(bankDetails).setBorder(null).setPadding(5);
        Cell qrCell = new Cell().setBorder(null).setTextAlignment(TextAlignment.RIGHT);

        try {
            Image qrImage = new Image(ImageDataFactory.create(new URL(invoice.getQrCodeUrl())));
            qrImage.setWidth(isCompact ? 160 : 211).setHeight(isCompact ? 160 : 243).setHorizontalAlignment(HorizontalAlignment.RIGHT);
            qrCell.add(qrImage);
        } catch (Exception e) {
            qrCell.add(new Paragraph("QR Code không khả dụng").setFont(getRegularFont()).setFontSize(9));
        }

        if (isCompact) {
            Table innerTable = new Table(new float[] { 1f, 1.1f }).useAllAvailableWidth();
            innerTable.addCell(bankCell);
            innerTable.addCell(qrCell);
            bankTable.addCell(new Cell().add(innerTable).setBorder(null));
        } else {
            bankTable.addCell(bankCell);
            bankTable.addCell(qrCell);
        }
        document.add(bankTable);
    }

    private void addInvoiceFooter(Document document) {
        document.add(new Paragraph("Lưu ý: Vui lòng chuyển khoản đúng nội dung để xác nhận thanh toán nhanh chóng.")
                .setFont(getRegularFont()).setFontSize(9).setFontColor(new DeviceRgb(107, 114, 128))
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(20));

        document.add(new Paragraph("Cảm ơn quý phụ huynh đã tin tưởng!")
                .setFont(getBoldFont()).setFontSize(11)
                .setTextAlignment(TextAlignment.CENTER).setMarginTop(5));
    }

    // --- Internal Helpers ---

    private byte[] regularFontBytes;
    private byte[] boldFontBytes;

    private void loadVietnameseFonts() throws Exception {
        if (regularFontBytes != null) return;
        try {
            ClassPathResource regularFont = new ClassPathResource("fonts/DejaVuSans.ttf");
            ClassPathResource boldFont = new ClassPathResource("fonts/DejaVuSans-Bold.ttf");
            
            if (regularFont.exists() && boldFont.exists()) {
                regularFontBytes = regularFont.getInputStream().readAllBytes();
                boldFontBytes = boldFont.getInputStream().readAllBytes();
            } else {
                log.warn("Unicode fonts not found");
                // Fallback handled in getters
            }
        } catch (Exception e) {
            log.error("Failed to load fonts", e);
        }
    }

    private PdfFont getRegularFont() {
        try {
            if (regularFontBytes != null) {
                return PdfFontFactory.createFont(regularFontBytes, PdfEncodings.IDENTITY_H);
            }
            return PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.TIMES_ROMAN);
        } catch (Exception e) {
            log.error("Error creating regular font", e);
            try {
                return PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.TIMES_ROMAN);
            } catch (Exception ex) { return null; }
        }
    }

    private PdfFont getBoldFont() {
        try {
            if (boldFontBytes != null) {
                return PdfFontFactory.createFont(boldFontBytes, PdfEncodings.IDENTITY_H);
            }
            return PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.TIMES_BOLD);
        } catch (Exception e) {
            log.error("Error creating bold font", e);
            try {
                return PdfFontFactory.createFont(com.itextpdf.io.font.constants.StandardFonts.TIMES_BOLD);
            } catch (Exception ex) { return null; }
        }
    }

    private Cell createTableCell(String text) {
        return new Cell().add(new Paragraph(text != null ? text : "").setFont(getRegularFont()).setFontSize(10)).setPadding(4);
    }

    private Cell createHeaderCell(String text) {
        return new Cell()
                .add(new Paragraph(text).setFont(getBoldFont()).setFontSize(10).setFontColor(ColorConstants.WHITE))
                .setBackgroundColor(new DeviceRgb(75, 85, 99))
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(7);
    }

    private Cell createTableCellCenter(String text) {
        return createTableCell(text).setTextAlignment(TextAlignment.CENTER);
    }

    private Cell createTableCellRight(String text) {
        return createTableCell(text).setTextAlignment(TextAlignment.RIGHT);
    }

    private void addHorizontalLine(Document document) {
        document.add(new LineSeparator(new SolidLine()).setStrokeColor(new DeviceRgb(200, 200, 200)).setMarginTop(10).setMarginBottom(10));
    }

    private void addVerticalSpacing(Document document, float space) {
        document.add(new Paragraph(" ").setMarginBottom(space));
    }

    private String formatCurrency(Long amount) {
        return NumberFormat.getInstance(new Locale("vi", "VN")).format(amount != null ? amount : 0) + " đ";
    }

    private String formatMonth(String month) {
        if (month == null || !month.contains("-")) return "N/A";
        String[] parts = month.split("-");
        return parts.length < 2 ? month : String.format("Tháng %s/%s", parts[1], parts[0]);
    }

    private String formatImprovement(Double improvement) {
        if (improvement == null) {
            return "Không có dữ liệu tháng trước";
        }
        return String.format("%+.1f%%", improvement);
    }

    private String nvl(String value) {
        return value == null ? "" : value;
    }

    private int nvlInt(Integer value) {
        return value == null ? 0 : value;
    }

    private double nvlDouble(Double value) {
        return value == null ? 0.0 : value;
    }
}
