"use client";

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, CheckCircle2, Banknote } from 'lucide-react';
import type { CalendarStats } from '../types';

const StatsChip = memo(({ icon, label, value, variant }: {
    icon?: React.ReactNode,
    label: string,
    value: string | number,
    variant: 'blue' | 'emerald' | 'orange' | 'purple'
}) => {
    const styles = {
        blue: "bg-blue-50/50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-500/20",
        emerald: "bg-emerald-50/50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/20",
        orange: "bg-orange-50/50 dark:bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-100 dark:border-orange-500/20",
        purple: "bg-purple-50/50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-100 dark:border-purple-500/20"
    };

    return (
        <div className={cn("flex px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-2xl border transition-all hover:shadow-md justify-center text-center min-w-0 sm:min-w-[90px] lg:min-w-[100px] 2xl:min-w-[120px]", styles[variant])}>
            <div className="min-w-0 overflow-hidden">
                <div className="text-[9px] sm:text-[10px] font-black uppercase tracking-tight 2xl:tracking-widest opacity-70 leading-none mb-1 truncate">
                    {label}
                </div>
                <div className="text-[11px] sm:text-[13px] lg:text-[15px] font-black tracking-tight truncate">{value}</div>
            </div>
        </div>
    );
});

StatsChip.displayName = 'StatsChip';

export function StatsOverview({ stats }: { stats: CalendarStats }) {
    return (
        <div className="flex items-center gap-2 sm:gap-3 flex-nowrap lg:flex-wrap shrink-0">
            <StatsChip
                label="Tổng buổi"
                value={stats.total}
                variant="blue"
            />
            <StatsChip
                label="Đã hoàn thành"
                value={stats.completed}
                variant="emerald"
            />
            <StatsChip
                label="Doanh thu"
                value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue)}
                variant="orange"
            />
        </div>
    );
}
