'use client';

import {
    UserCheck,
    Crown,
    AlertCircle,
    Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { OverviewStats } from '@/lib/types/admin';
import { motion } from 'framer-motion';

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
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass border-premium rounded-3xl p-8 flex flex-col gap-8 w-[380px] shrink-0 shadow-premium backdrop-blur-xl"
        >
            <div className="flex flex-col gap-1.5 border-l-4 border-primary pl-4">
                <h3 className="text-xl font-black text-foreground tracking-tight">Chỉ Số Vận Hành</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Theo dõi thời gian thực</p>
            </div>

            <div className="flex flex-col gap-6">
                {displayStats.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="flex flex-col gap-3 group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-glow-sm transition-transform group-hover:scale-110 duration-300"
                                    style={{
                                        backgroundColor: stat.color,
                                        boxShadow: `0 4px 12px ${stat.color}40`
                                    }}
                                >
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">{stat.label}</span>
                            </div>
                            <span className="text-lg font-black text-foreground tabular-nums">{stat.value}</span>
                        </div>

                        <div className="relative h-2.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stat.progress}%` }}
                                transition={{ duration: 1.5, ease: "circOut", delay: 0.2 + (0.1 * idx) }}
                                className="h-full rounded-full relative"
                                style={{ backgroundColor: stat.color }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                            </motion.div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="mt-auto pt-6 border-t border-border/50">
                <button
                    onClick={handleViewDetailedReport}
                    className="group w-full h-12 bg-primary/5 hover:bg-primary text-primary hover:text-white text-[11px] font-black rounded-2xl transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2 border border-primary/20"
                >
                    Xem chi tiết báo cáo
                    <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        <AlertCircle className="w-3.5 h-3.5" />
                    </motion.div>
                </button>
            </div>
        </motion.div>
    );
}
