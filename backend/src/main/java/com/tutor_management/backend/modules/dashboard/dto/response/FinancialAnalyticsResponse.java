package com.tutor_management.backend.modules.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialAnalyticsResponse {
    private List<TutorRevenueDTO> revenueByTutor;
    private List<TierRevenueDTO> revenueByTier;
    private PaymentStatusStats paymentStatus;
    private CommissionStats commission;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TutorRevenueDTO {
        private Long tutorId;
        private String tutorName;
        private Long totalRevenue;
        private Long commissionAmount;
        private Integer sessionCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TierRevenueDTO {
        private String tier;
        private Long totalRevenue;
        private Integer activeTutors;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentStatusStats {
        private Long paidAmount;
        private Long pendingAmount;
        private Long overdueAmount;
        private Double collectionRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CommissionStats {
        private Long totalCommission;
        private Long expectedCommission;
        private Double averageCommissionRate;
    }
}
