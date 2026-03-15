// ============================================================================
// FILE: admin-dashboard/types/dashboard.types.ts
// ============================================================================
export interface MonthlyChartData {
  month: string;
  total: number;
  paidPercentage: number;
  totalPaid: number;
  totalUnpaid: number;
}

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalTutors: number;
  activeTutors: number;
  inactiveTutors: number;
  
  totalPaidAllTime: string;
  totalUnpaidAllTime: string;
  totalRevenueThisMonth: string;
  totalRevenueAllTime: string;
  totalDebtThisMonth: string;
  totalDebtAllTime: string;
  
  currentMonthTotal: string;

  totalPaidRaw: number;
  totalUnpaidRaw: number;
  totalRevenue: number;
  totalDebt: number;

  revenueTrendValue: number;
  revenueTrendDirection: 'up' | 'down' | 'neutral';
  newStudentsCurrentMonth?: number;
  
  totalSessions: number;
  proAccounts: number;
  freeAccounts: number;
  pendingIssues: number;
}