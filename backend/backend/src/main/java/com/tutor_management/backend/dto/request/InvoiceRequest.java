package com.tutor_management.backend.dto.request;

import lombok.*;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceRequest {
    private Long studentId; // Nullable - nếu null thì tạo cho cả tháng
    private String month; // YYYY-MM
    private List<Long> sessionRecordIds; // Chọn các buổi học để tạo invoice
    private Boolean allStudents; // True nếu muốn tạo báo giá cho tất cả học sinh trong tháng
}