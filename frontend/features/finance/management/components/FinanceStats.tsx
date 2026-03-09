'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpRight, Ban, CheckCircle2, Banknote } from 'lucide-react';
import { useFinanceData } from '../hooks/useFinanceData';
import { StatCard } from './StatCard';
import { FinanceGroupedRecord } from '../types';

/**
 * Calculates financial statistics from grouped records.
 */
function calculateStats(groupedRecords: FinanceGroupedRecord[]) {
    return groupedRecords.reduce(
        (acc, group) => {
            acc.totalStudents += 1;
            acc.totalSessions += group.totalSessions;
            acc.totalHours += group.totalHours;
            acc.totalAmount += group.totalAmount;
            if (!group.allPaid) acc.pendingCount += 1;
            return acc;
        },
        { totalStudents: 0, totalSessions: 0, totalHours: 0, totalAmount: 0, pendingCount: 0 }
    );
}

/**
 * FinanceStats Component
 * Renders an overview of financial metrics including revenue, sessions, and student status.
 */
export function FinanceStats() {
    const { groupedRecords, loading } = useFinanceData();
    const stats = calculateStats(groupedRecords);

    if (loading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Tổng Doanh Thu / Nợ"
                value={formatCurrency(stats.totalAmount)}
                icon={Banknote}
                trend="+12%"
                trendLabel="so với tháng trước"
                color="text-emerald-600"
                bgColor="bg-emerald-50 dark:bg-emerald-950/20"
            />
            <StatCard
                title="Tổng Số Buổi"
                value={stats.totalSessions.toString()}
                icon={CheckCircle2}
                subValue={`${stats.totalHours.toFixed(1)} giờ dạy`}
                color="text-blue-600"
                bgColor="bg-blue-50 dark:bg-blue-950/20"
            />
            <StatCard
                title="Học Sinh"
                value={stats.totalStudents.toString()}
                icon={ArrowUpRight}
                subValue={`${stats.pendingCount} chưa thanh toán`}
                color="text-purple-600"
                bgColor="bg-purple-50 dark:bg-purple-950/20"
            />
            <StatCard
                title="Trạng Thái"
                value={stats.pendingCount > 0 ? "Cần Xử Lý" : "Ổn Định"}
                icon={Ban}
                color={stats.pendingCount > 0 ? "text-orange-600" : "text-green-600"}
                bgColor={stats.pendingCount > 0 ? "bg-orange-50 dark:bg-orange-950/20" : "bg-green-50"}
            />
        </div>
    );
}
