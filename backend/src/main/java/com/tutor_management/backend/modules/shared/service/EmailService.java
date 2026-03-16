package com.tutor_management.backend.modules.shared.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Service for managing automated email communications.
 * Handles HTML email construction and attachment of financial documents.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromEmail;

    @Value("${app.mail.from-name}")
    private String fromName;

    /**
     * Sends an invoice email to a parent with an attached PDF.
     *
     * @param toEmail       Recipient email address.
     * @param parentName    Recipient's name for personalization.
     * @param studentName   Student's name for context.
     * @param month         The billing month.
     * @param pdfData       The binary PDF content.
     * @param invoiceNumber The unique invoice identifier.
     */
    public void sendInvoiceEmail(String toEmail, String parentName,
            String studentName, String month,
            byte[] pdfData, String invoiceNumber) {
        log.info("Preparing invoice email for {}, Student: {}, Month: {}", toEmail, studentName, month);
        
        try {
            validateInputs(toEmail, pdfData);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, fromName);
            helper.setTo(toEmail);
            helper.setSubject(buildInvoiceSubject(month, studentName));

            String htmlContent = buildInvoiceHtmlContent(parentName, studentName, month, invoiceNumber);
            helper.setText(htmlContent, true);

            String fileName = buildInvoiceAttachmentName(invoiceNumber);
            helper.addAttachment(fileName, new ByteArrayResource(pdfData));

            mailSender.send(message);
            log.info("Invoice email sent successfully to: {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send invoice email to: {}", toEmail, e);
            throw new RuntimeException("Không thể gửi email đến " + toEmail + ": " + e.getMessage(), e);
        }
    }

    private void validateInputs(String toEmail, byte[] pdfData) {
        if (toEmail == null || toEmail.isBlank()) {
            throw new IllegalArgumentException("Địa chỉ email người nhận không được để trống");
        }
        if (pdfData == null || pdfData.length == 0) {
            throw new IllegalArgumentException("Dữ liệu PDF không hợp lệ hoặc bị trống");
        }
    }

    public String buildInvoiceSubject(String month, String studentName) {
        return String.format("Hóa đơn học phí tháng %s - %s", month, studentName);
    }

    public String buildInvoiceAttachmentName(String invoiceNumber) {
        return String.format("Hoa-don-%s.pdf", invoiceNumber);
    }

    public String buildInvoiceHtmlContent(String parentName, String studentName,
            String month, String invoiceNumber) {
        return buildEmailContent(parentName, studentName, month, invoiceNumber);
    }

    /**
     * Constructs the HTML content for the invoice email using defensive string building.
     */
    private String buildEmailContent(String parentName, String studentName,
            String month, String invoiceNumber) {
        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <style>\n" +
                "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }\n" +
                "        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }\n" +
                "        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }\n" +
                "        .invoice-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }\n" +
                "        .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }\n" +
                "        .info-row:last-child { border-bottom: none; }\n" +
                "        .label { font-weight: bold; color: #6b7280; }\n" +
                "        .value { color: #111827; }\n" +
                "        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #6b7280; font-size: 14px; }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"header\">\n" +
                "        <h1>📄 HÓA ĐƠN HỌC PHÍ</h1>\n" +
                "        <p>ENGLISH TUTORING</p>\n" +
                "    </div>\n" +
                "    \n" +
                "    <div class=\"content\">\n" +
                "        <p>Kính gửi Quý phụ huynh <strong>" + parentName + "</strong>,</p>\n" +
                "        <p>Chúng tôi xin gửi đến Quý phụ huynh hóa đơn học phí cho học sinh <strong>" + studentName + "</strong>.</p>\n" +
                "        <div class=\"invoice-info\">\n" +
                "            <div class=\"info-row\"><span class=\"label\">Số hóa đơn:</span><span class=\"value\">" + invoiceNumber + "</span></div>\n" +
                "            <div class=\"info-row\"><span class=\"label\">Tháng:</span><span class=\"value\">" + month + "</span></div>\n" +
                "            <div class=\"info-row\"><span class=\"label\">Học sinh:</span><span class=\"value\">" + studentName + "</span></div>\n" +
                "        </div>\n" +
                "        <p>📎 <strong>Hóa đơn chi tiết đính kèm trong file PDF.</strong></p>\n" +
                "        <p style=\"margin-top: 30px;\">Quý phụ huynh vui lòng kiểm tra và thanh toán theo thông tin trong hóa đơn.</p>\n" +
                "        <p>Nếu có bất kỳ thắc mắc nào, xin vui lòng liên hệ với chúng tôi.</p>\n" +
                "        <div class=\"footer\"><p><strong>English Tutoring</strong></p><p>Cảm ơn Quý phụ huynh đã tin tưởng! 🙏</p></div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }
}
