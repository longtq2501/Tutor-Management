import { dashboardApi } from '@/lib/services';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

export const useDashboardData = () => {
  const currentMonth = new Date().toISOString().slice(0, 7);

  // 1. Fetch Dashboard Stats
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats', currentMonth],
    queryFn: () => dashboardApi.getStats(currentMonth),
    staleTime: 0, // Always fetch fresh in background
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
    initialData: () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`dashboard-stats-${currentMonth}`);
        return saved ? JSON.parse(saved) : undefined;
      }
      return undefined;
    }
  });

  // 2. Fetch Monthly Stats (Charts)
  const { data: monthlyStats, isLoading: loadingMonthly } = useQuery({
    queryKey: ['dashboard-monthly'],
    queryFn: () => dashboardApi.getMonthlyStats(),
    staleTime: 0, // Always fetch fresh in background
    gcTime: 15 * 60 * 1000,
    placeholderData: keepPreviousData,
    initialData: () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('dashboard-monthly');
        return saved ? JSON.parse(saved) : undefined;
      }
      return undefined;
    }
  });

  // Persist data to localStorage
  if (typeof window !== 'undefined') {
    if (stats) localStorage.setItem(`dashboard-stats-${currentMonth}`, JSON.stringify(stats));
    if (monthlyStats) localStorage.setItem('dashboard-monthly', JSON.stringify(monthlyStats));
  }

  // Calculate true revenue trend (DASH-1)
  let revenueTrendValue = stats?.revenueTrendValue || 0;
  let revenueTrendDirection = stats?.revenueTrendDirection || 'neutral';

  if (monthlyStats && monthlyStats.length >= 2) {
    const sorted = [...monthlyStats].sort((a, b) => a.month.localeCompare(b.month));
    const currentM = sorted[sorted.length - 1];
    const prevM = sorted[sorted.length - 2];
    if (prevM.totalPaid > 0) {
      const diff = currentM.totalPaid - prevM.totalPaid;
      revenueTrendValue = parseFloat(((diff / prevM.totalPaid) * 100).toFixed(1));
      revenueTrendDirection = diff > 0 ? 'up' : diff < 0 ? 'down' : 'neutral';
    } else if (currentM.totalPaid > 0) {
      revenueTrendValue = 100;
      revenueTrendDirection = 'up';
    }
  }

  return {
    stats: stats ? { ...stats, revenueTrendValue, revenueTrendDirection } : null,
    monthlyStats: monthlyStats || [],
    loadingStats,
    loadingMonthly,
    loading: loadingStats || loadingMonthly
  };
};