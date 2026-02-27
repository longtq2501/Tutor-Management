'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Download, Filter, Plus } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { RevenueChart } from '@/features/admin/overview/RevenueChart';
import { QuickStats } from '@/features/admin/overview/QuickStats';
import { RecentTutors } from '@/features/admin/overview/RecentTutors';
import { ActivityFeed } from '@/features/admin/overview/ActivityFeed';
import { StudentGrowthChart } from '@/features/admin/overview/StudentGrowthChart';
import { TopTutorsList } from '@/features/admin/overview/TopTutorsList';
import { adminStatsApi } from '@/lib/services/admin-stats';
import { dashboardApi } from '@/lib/services/dashboard';
import type { OverviewStats, MonthlyRevenue, StudentGrowth, TopTutor } from '@/lib/types/admin';
import { motion, AnimatePresence } from 'framer-motion';

export default function OverviewPage() {
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [revenue, setRevenue] = useState<MonthlyRevenue[]>([]);
    const [studentGrowth, setStudentGrowth] = useState<StudentGrowth[]>([]);
    const [topTutors, setTopTutors] = useState<TopTutor[]>([]);
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
                const [overviewData, revenueData, growthData, tutorsData] = await Promise.all([
                    adminStatsApi.getOverview(),
                    adminStatsApi.getMonthlyRevenue(6),
                    adminStatsApi.getStudentGrowth(),
                    adminStatsApi.getTopTutors(5)
                ]);
                setStats(overviewData);
                setRevenue(revenueData);
                setStudentGrowth(growthData);
                setTopTutors(tutorsData);
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
        <div className="flex flex-col gap-10 pb-20 relative">
            {/* Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

            {/* Page Header */}
            <AdminPageHeader
                title="Overview"
                subtitle="Trung tâm quản trị và theo dõi hiệu năng toàn hệ thống."
                category="Hệ Thống Phân Tích"
                icon={TrendingUp}
                actions={
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setFilterOpen(!filterOpen)}
                                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${filterType !== 'all'
                                    ? 'bg-primary text-white shadow-glow-sm shadow-primary/40'
                                    : 'bg-white/50 dark:bg-white/5 border border-border/50 text-muted-foreground hover:text-foreground hover:bg-white/80 dark:hover:bg-white/10'
                                    }`}
                            >
                                <Filter className="h-3.5 w-3.5" />
                                <span>Bộ lọc</span>
                                {filterType !== 'all' && <span className="text-[9px] opacity-70">({filterType})</span>}
                            </button>

                            <AnimatePresence>
                                {filterOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full right-0 mt-3 glass border-premium rounded-2xl shadow-premium z-50 p-2 w-52 backdrop-blur-2xl"
                                    >
                                        {[
                                            { id: 'all', label: 'Tất cả thời gian' },
                                            { id: 'month', label: 'Tháng này' },
                                            { id: 'quarter', label: 'Quý này' },
                                            { id: 'year', label: 'Năm nay' }
                                        ].map((filter) => (
                                            <button
                                                key={filter.id}
                                                onClick={() => handleFilterChange(filter.id as any)}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${filterType === filter.id
                                                    ? 'bg-primary text-white'
                                                    : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                                                    }`}
                                            >
                                                {filter.label}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <button
                            onClick={handleExportReport}
                            disabled={exportLoading}
                            className="flex items-center gap-2.5 px-5 py-2.5 bg-white/50 dark:bg-white/5 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-300 disabled:opacity-50"
                        >
                            {exportLoading ? (
                                <div className="h-3.5 w-3.5 border-2 border-muted-foreground/30 border-t-primary rounded-full animate-spin" />
                            ) : (
                                <Download className="h-3.5 w-3.5" />
                            )}
                            <span>{exportLoading ? 'Đang xuất...' : 'Xuất file'}</span>
                        </button>

                        <button
                            onClick={() => alert('Tính năng sẽ có trong phiên bản tiếp theo')}
                            className="flex items-center gap-2.5 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-glow-md shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Thêm Metric</span>
                        </button>
                    </div>
                }
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, idx) => (
                    <StatCard key={stat.label} {...stat} index={idx} />
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart
                    data={revenue.map(r => ({ month: r.month, value: r.totalRevenue }))}
                    view={revenueView === 6 ? '6m' : '1y'}
                    onViewChange={(v) => setRevenueView(v === '6m' ? 6 : 12)}
                    loading={revenueLoading}
                />
                <StudentGrowthChart data={studentGrowth} loading={loading} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <QuickStats stats={stats} />
                </div>
                <div className="lg:col-span-2">
                    <TopTutorsList data={topTutors} loading={loading} />
                </div>
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
