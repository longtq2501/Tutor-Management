import { ApiResponse } from "../types";
import axiosInstance from "./axios-instance";


export interface TutorRevenue {
  tutorId: number;
  tutorName: string;
  totalRevenue: number;
  commissionAmount: number;
  sessionCount: number;
}

export interface TierRevenue {
  tier: string;
  totalRevenue: number;
  activeTutors: number;
}

export interface PaymentStatus {
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number;
}

export interface CommissionStats {
  totalCommission: number;
  expectedCommission: number;
  averageCommissionRate: number;
}

export interface FinancialAnalytics {
  revenueByTutor: TutorRevenue[];
  revenueByTier: TierRevenue[];
  paymentStatus: PaymentStatus;
  commission: CommissionStats;
}

export interface TutorPerformance {
  tutorId: number;
  tutorName: string;
  averageRating: number;
  completionRate: number;
  totalSessions: number;
  studentCount: number;
}

export interface PerformanceAnalytics {
  tutorRankings: TutorPerformance[];
  growth: {
    newStudents: number;
    lostStudents: number;
    netGrowthRate: number;
  };
  attendance: {
    globalCompletionRate: number;
    totalCancelled: number;
    totalCompleted: number;
  };
}

export const analyticsApi = {
  getFinancialAnalytics: async (month?: string) => {
    const res = await axiosInstance.get<ApiResponse<FinancialAnalytics>>('/api/analytics/finance', {
      params: { month }
    });
    return res.data.data;
  },

  getPerformanceAnalytics: async () => {
    const res = await axiosInstance.get<ApiResponse<PerformanceAnalytics>>('/api/analytics/performance');
    return res.data.data;
  },

  exportReport: (type: 'finance' | 'performance', format: 'csv' | 'xlsx', month?: string) => {
    const params = new URLSearchParams();
    params.append('type', type);
    params.append('format', format);
    if (month) params.append('month', month);

    window.open(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/analytics/reports/export?${params.toString()}`, '_blank');
  }
};
