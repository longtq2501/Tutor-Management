'use client';

import {
    UserCheck,
    Crown,
    AlertCircle,
    Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { OverviewStats } from '@/lib/types/admin';

interface QuickStatsProps {
    stats: OverviewStats | null;
}

export function QuickStats({ stats }: QuickStatsProps) {
    const router = useRouter();

    const handleViewDetailedReport = () => {
        router.push('/system');
    };

    const displayStats = [
        {
            label: 'Gia sư Active',
            value: (stats?.activeTutors || 0).toString(),
            progress: stats ? (stats.activeTutors / (stats.totalTutors || 1)) * 100 : 0,
            icon: UserCheck,
            color: 'var(--admin-green)',
        },
        {
            label: 'Tài khoản PRO',
            value: (stats?.proAccounts || 0).toString(),
            progress: stats ? (stats.proAccounts / (stats.totalTutors || 1)) * 100 : 0,
            icon: Crown,
            color: 'var(--admin-accent)',
        },
        {
            label: 'Tài khoản FREE',
            value: (stats?.freeAccounts || 0).toString(),
            progress: stats ? (stats.freeAccounts / (stats.totalTutors || 1)) * 100 : 0,
            icon: AlertCircle,
            color: 'var(--admin-amber)',
        },
        {
            label: 'Chờ xử lý',
            value: (stats?.pendingIssues || 0).toString().padStart(2, '0'),
            progress: stats?.pendingIssues ? 40 : 0,
            icon: Clock,
            color: 'var(--admin-amber)',
        },
    ];

    return (
        <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-6 flex flex-col gap-6 w-[360px] shrink-0">
            <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-[var(--admin-text)]">Chỉ Số Vận Hành</h3>
                <p className="text-xs text-[var(--admin-text3)] uppercase tracking-widest font-medium">Theo dõi thời gian thực</p>
            </div>

            <div className="flex flex-col gap-5">
                {displayStats.map((stat) => (
                    <div key={stat.label} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="p-1.5 rounded-md text-[var(--admin-bg)]"
                                    style={{ backgroundColor: stat.color }}
                                >
                                    <stat.icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="text-xs font-medium text-[var(--admin-text2)]">{stat.label}</span>
                            </div>
                            <span className="text-sm font-bold text-[var(--admin-text)]">{stat.value}</span>
                        </div>

                        <div className="h-1.5 w-full bg-[var(--admin-surface2)] rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                style={{
                                    width: `${stat.progress}%`,
                                    backgroundColor: stat.color,
                                    boxShadow: `0 0 8px ${stat.color}40`
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto pt-4 border-t border-[var(--admin-border)]">
                <button
                    onClick={handleViewDetailedReport}
                    className="w-full py-2 bg-[var(--admin-surface2)] hover:bg-[var(--admin-surface3)] text-[var(--admin-text3)] hover:text-[var(--admin-text)] text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest"
                >
                    Xem chi tiết báo cáo
                </button>
            </div>
        </div>
    );
}
