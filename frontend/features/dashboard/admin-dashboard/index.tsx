'use client';

import { useMemo } from 'react';

// 1. Các thành phần nhẹ (Số liệu, Header) thì import cứng
import { BarChart3, CheckCircle, TrendingUp, Users, XCircle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { StatCard } from './components/StatCard';
import { DashboardExportButton } from './components/DashboardExportButton';
import { useDashboardData } from './hooks/useDashboardData';
import { useMonthlyChartData } from './hooks/useMonthlyChartData';
import { DashboardHeader } from '@/contexts/UIContext';
import { DashboardStats } from './types/dashboard.types';

import { useAuth } from '@/contexts/AuthContext';

// 2. Thành phần nặng (Biểu đồ) thì import động
const AnalyticsView = dynamic(
  () => import('./components/AnalyticsView').then(mod => mod.AnalyticsView),
  {
    ssr: false,
  }
);

const EnhancedRevenueChart = dynamic(
  () => import('./components/EnhancedRevenueChart').then(mod => mod.EnhancedRevenueChart),
  {
    ssr: false, // Biểu đồ chỉ vẽ được trên trình duyệt
  }
);

export default function AdminDashboard() {
  const { stats, monthlyStats, loadingStats, loadingMonthly } = useDashboardData();
  const chartData = useMonthlyChartData(monthlyStats);
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Đồng bộ Loading: Chỉ hiện dữ liệu khi CẢ HAI nguồn đã sẵn sàng
  const isGlobalLoading = loadingStats || loadingMonthly;

  // 1. Safe stats - Giữ nguyên logic của bạn nhưng thay mặc định thành String
  const safeStats = useMemo<DashboardStats>(() => (stats || {
    totalStudents: 0,
    activeStudents: 0,
    totalTutors: 0,
    activeTutors: 0,
    inactiveTutors: 0,
    totalPaidAllTime: "0 đ",
    totalUnpaidAllTime: "0 đ",
    totalRevenueThisMonth: "0 đ",
    totalRevenueAllTime: "0 đ",
    totalDebtThisMonth: "0 đ",
    totalDebtAllTime: "0 đ",
    currentMonthTotal: "0 đ",
    totalPaidRaw: 0,
    totalUnpaidRaw: 0,
    totalRevenue: 0,
    totalDebt: 0,
    revenueTrendValue: 0,
    revenueTrendDirection: 'neutral',
    newStudentsCurrentMonth: 0,
    totalSessions: 0,
    proAccounts: 0,
    freeAccounts: 0,
    pendingIssues: 0
  }) as DashboardStats, [stats]);

  // 2. TẬN DỤNG TREND TỪ BACKEND - Giữ nguyên logic gán giá trị
  const revenueTrend = useMemo(() => {
    if (safeStats.revenueTrendValue === undefined || safeStats.revenueTrendValue === 0) return undefined;
    return {
      direction: safeStats.revenueTrendDirection as 'up' | 'down',
      value: safeStats.revenueTrendValue
    };
  }, [safeStats]);

  // 3. Tính toán phần trăm chính xác dựa trên số liệu thô (Raw) từ stats
  const { paidPercentage, unpaidPercentage } = useMemo(() => {
    const paid = stats?.totalPaidRaw || 0;
    const unpaid = stats?.totalUnpaidRaw || 0;
    const total = paid + unpaid;

    return {
      paidPercentage: total > 0 ? Math.round((paid / total) * 100) : 0,
      unpaidPercentage: total > 0 ? Math.round((unpaid / total) * 100) : 0
    };
  }, [stats]);

  return (
    <div className="space-y-6 lg:space-y-8 pb-10">
      <DashboardHeader
        title="Tổng Quan Hệ Thống"
        subtitle="Theo dõi chỉ số kinh doanh và học tập"
        actions={<DashboardExportButton filename="bao-cao-doanh-thu.pdf" />}
      />

      {/* Stats Cards Grid */}
      <div data-tour="dashboard-stats" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">

        {/* Total Students */}
        <StatCard
          title="Tổng Học Sinh"
          value={safeStats.totalStudents}
          icon={<Users />}
          variant="blue"
          isLoading={isGlobalLoading}
          subtitle={safeStats.newStudentsCurrentMonth !== undefined ? `${safeStats.newStudentsCurrentMonth} học sinh mới tháng này` : undefined}
          badge={
            <div className="flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20 w-fit px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/30">
              <TrendingUp size={12} className="mr-1 flex-shrink-0" />
              <span className="whitespace-nowrap">{safeStats.activeStudents || 0} đang học</span>
            </div>
          }
        />

        {/* Revenue This Month */}
        <StatCard
          title="Doanh Thu Tháng"
          value={safeStats.totalRevenueThisMonth || safeStats.currentMonthTotal}
          subtitle="Cập nhật thời gian thực"
          icon={<BarChart3 />}
          variant="blue"
          trend={revenueTrend}
          isLoading={isGlobalLoading}
        />

        {/* Total Paid */}
        <StatCard
          title="Tổng Thu Nhập"
          value={safeStats.totalRevenueAllTime || safeStats.totalPaidAllTime}
          icon={<CheckCircle />}
          variant="green"
          isLoading={isGlobalLoading}
        />

        {/* Total Debt (Unpaid) */}
        <StatCard
          title={
            <div className="flex items-center gap-1.5">
              <span>Còn Nợ</span>
              <span className="text-[10px] font-medium opacity-60">(chưa thanh toán)</span>
            </div>
          }
          value={safeStats.totalDebtAllTime || safeStats.totalUnpaidAllTime}
          icon={<XCircle />}
          variant="red"
          isLoading={isGlobalLoading}
        />
      </div>

      {/* Analytics Insights Section */}
      {isAdmin && (
        <AnalyticsView
          stats={stats}
          isLoading={isGlobalLoading}
        />
      )}

      {/* Enhanced Revenue Chart */}
      <div data-tour="dashboard-revenue-chart">
        <EnhancedRevenueChart
          data={chartData}
          isLoading={isGlobalLoading}
        />
      </div>
    </div>
  );
}