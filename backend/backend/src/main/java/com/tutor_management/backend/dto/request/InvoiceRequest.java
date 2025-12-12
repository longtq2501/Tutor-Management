package com.tutor_management.backend.dto.request;

import lombok.*;
import java.util.List;

// InvoiceRequest.java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequest {
    private Long studentId; // Có thể null nếu là nhiều học sinh
    private String month; // YYYY-MM
    private List<Long> sessionRecordIds;
    private Boolean allStudents; // True nếu muốn tạo báo giá cho tất cả học sinh trong tháng
    private Boolean multipleStudents; // NEW: True nếu tạo cho nhiều học sinh (không phải tất cả)
    private List<Long> selectedStudentIds; // NEW: Danh sách ID học sinh được chọn
}