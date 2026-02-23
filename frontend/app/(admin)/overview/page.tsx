'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Download, Filter, Plus } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { RevenueChart } from '@/features/admin/overview/RevenueChart';
import { QuickStats } from '@/features/admin/overview/QuickStats';
import { RecentTutors } from '@/features/admin/overview/RecentTutors';
import { ActivityFeed } from '@/features/admin/overview/ActivityFeed';
import { adminStatsApi } from '@/lib/services/admin-stats';
import { dashboardApi } from '@/lib/services/dashboard';
import type { OverviewStats, MonthlyRevenue } from '@/lib/types/admin';

export default function OverviewPage() {
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [revenue, setRevenue] = useState<MonthlyRevenue[]>([]);
    const [loading, setLoading] = useState(true);
    const [revenueView, setRevenueView] = useState<6 | 12>(6);
    const [revenueLoading, setRevenueLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterType, setFilterType] = useState<'all' | 'month' | 'quarter' | 'year' | 'custom'>('all');
    const [customStartDate, setCustomStartDate] = useState<string>('');
    const [customEndDate, setCustomEndDate] = useState<string>('');

    const handleExportReport = async () => {
        setExportLoading(true);
        try {
            const blob = await dashboardApi.exportPdf();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `overview-report-${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            // Toast success would go here if using a toast library
            console.log('Report exported successfully');
        } catch (error) {
            console.error('Failed to export report:', error);
        } finally {
            setExportLoading(false);
        }
    };

    const getDateRangeFromFilter = () => {
        const today = new Date();
        let startDate = '';
        let endDate = today.toISOString().split('T')[0];

        switch (filterType) {
            case 'month': {
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                startDate = firstDay.toISOString().split('T')[0];
                break;
            }
            case 'quarter': {
                const quarter = Math.floor(today.getMonth() / 3);
                const firstDay = new Date(today.getFullYear(), quarter * 3, 1);
                startDate = firstDay.toISOString().split('T')[0];
                break;
            }
            case 'year': {
                const firstDay = new Date(today.getFullYear(), 0, 1);
                startDate = firstDay.toISOString().split('T')[0];
                break;
            }
            case 'custom': {
                startDate = customStartDate;
                endDate = customEndDate;
                break;
            }
            default:
                break;
        }

        return { startDate, endDate };
    };

    const handleFilterChange = async (newFilterType: typeof filterType) => {
        setFilterType(newFilterType);
        setFilterOpen(false);

        const { startDate, endDate } = getDateRangeFromFilter();
        setLoading(true);
        try {
            const [overviewData, revenueData] = await Promise.all([
                adminStatsApi.getOverview(startDate || undefined, endDate || undefined),
                adminStatsApi.getMonthlyRevenue(revenueView)
            ]);
            setStats(overviewData);
            setRevenue(revenueData);
        } catch (error) {
            console.error('Failed to fetch filtered data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [overviewData, revenueData] = await Promise.all([
                    adminStatsApi.getOverview(),
                    adminStatsApi.getMonthlyRevenue(6)
                ]);
                setStats(overviewData);
                setRevenue(revenueData);
            } catch (error) {
                console.error('Failed to fetch overview data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        const fetchRevenueData = async () => {
            setRevenueLoading(true);
            try {
                const revenueData = await adminStatsApi.getMonthlyRevenue(revenueView);
                setRevenue(revenueData);
            } catch (error) {
                console.error('Failed to fetch revenue data:', error);
            } finally {
                setRevenueLoading(false);
            }
        };

        fetchRevenueData();
    }, [revenueView]);

    const statCards = [
        {
            label: 'Tổng Doanh Thu',
            value: stats?.totalRevenueAllTime || '0 ₫',
            badge: { text: 'All time', variant: 'green' as const },
            glowColor: '#22c55e',
        },
        {
            label: 'Tổng Gia Sư',
            value: (stats?.totalTutors || 0).toString(),
            badge: { text: `${stats?.proAccounts || 0} Pro`, variant: 'accent' as const },
            glowColor: '#6366f1',
        },
        {
            label: 'Học Sinh Active',
            value: (stats?.activeStudents || 0).toString(),
            badge: { text: `${stats?.totalStudents || 0} Total`, variant: 'green' as const },
            glowColor: '#22c55e',
        },
        {
            label: 'Yêu Cầu Hỗ Trợ',
            value: (stats?.pendingIssues || 0).toString().padStart(2, '0'),
            badge: { text: 'Pending', variant: 'amber' as const },
            glowColor: '#f59e0b',
        },
    ];

    return (
        <div className="flex flex-col gap-8 pb-12">
            {/* Page Header */}
            <AdminPageHeader
                title="Overview"
                subtitle="Trung tâm quản trị và theo dõi hiệu năng toàn hệ thống."
                category="Hệ Thống Phân Tích"
                icon={TrendingUp}
                actions={
                    <>
                        <div className="relative">
                            <button
                                onClick={() => setFilterOpen(!filterOpen)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    filterType !== 'all'
                                        ? 'bg-[var(--admin-accent)] text-[var(--admin-bg)]'
                                        : 'bg-[var(--admin-surface2)] border border-[var(--admin-border)] text-[var(--admin-text2)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface3)]'
                                }`}
                            >
                                <Filter className="h-4 w-4" />
                                <span>Bộ lọc</span>
                                {filterType !== 'all' && <span className="text-[10px]">({filterType})</span>}
                            </button>

                            {filterOpen && (
                                <div className="absolute top-full right-0 mt-2 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl shadow-lg z-50 p-2 w-48">
                                    <button
                                        onClick={() => handleFilterChange('all')}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                            filterType === 'all'
                                                ? 'bg-[var(--admin-accent)] text-[var(--admin-bg)]'
                                                : 'text-[var(--admin-text2)] hover:bg-[var(--admin-surface2)]'
                                        }`}
                                    >
                                        Tất cả thời gian
                                    </button>
                                    <button
                                        onClick={() => handleFilterChange('month')}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                            filterType === 'month'
                                                ? 'bg-[var(--admin-accent)] text-[var(--admin-bg)]'
                                                : 'text-[var(--admin-text2)] hover:bg-[var(--admin-surface2)]'
                                        }`}
                                    >
                                        Tháng này
                                    </button>
                                    <button
                                        onClick={() => handleFilterChange('quarter')}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                            filterType === 'quarter'
                                                ? 'bg-[var(--admin-accent)] text-[var(--admin-bg)]'
                                                : 'text-[var(--admin-text2)] hover:bg-[var(--admin-surface2)]'
                                        }`}
                                    >
                                        Quý này
                                    </button>
                                    <button
                                        onClick={() => handleFilterChange('year')}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                                            filterType === 'year'
                                                ? 'bg-[var(--admin-accent)] text-[var(--admin-bg)]'
                                                : 'text-[var(--admin-text2)] hover:bg-[var(--admin-surface2)]'
                                        }`}
                                    >
                                        Năm nay
                                    </button>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleExportReport}
                            disabled={exportLoading}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-xl text-xs font-bold text-[var(--admin-text2)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface3)] transition-all disabled:opacity-50"
                        >
                            {exportLoading ? (
                                <>
                                    <div className="h-4 w-4 border-2 border-[var(--admin-text3)] border-t-[var(--admin-text)] rounded-full animate-spin" />
                                </>
                            ) : (
                                <Download className="h-4 w-4" />
                            )}
                            <span>{exportLoading ? 'Đang xuất...' : 'Xuất file'}</span>
                        </button>
                        <button
                            onClick={() => alert('Tính năng sẽ có trong phiên bản tiếp theo')}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--admin-accent)] text-[var(--admin-bg)] rounded-xl text-xs font-black shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-105 transition-all"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Thêm Metric</span>
                        </button>
                    </>
                }
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <StatCard key={stat.label} {...stat} index={idx} />
                ))}
            </div>

            {/* Charts Row */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                    <RevenueChart
                        data={revenue.map(r => ({ month: r.month, value: r.totalRevenue }))}
                        view={revenueView === 6 ? '6m' : '1y'}
                        onViewChange={(v) => setRevenueView(v === '6m' ? 6 : 12)}
                        loading={revenueLoading}
                    />
                </div>
                <QuickStats stats={stats} />
            </div>

            {/* Tables Row */}
            <div className="flex flex-col lg:flex-row gap-6">
                <RecentTutors />
                <div className="w-full lg:w-[400px] flex shrink-0">
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
}
