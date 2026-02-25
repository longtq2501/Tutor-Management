'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    UserPlus,
    Crown,
    FileUp,
    Lock,
    CreditCard,
    AlertCircle,
    ArrowRight,
    Clock
} from 'lucide-react';
import { adminStatsApi } from '@/lib/services/admin-stats';
import type { ActivityLog } from '@/lib/types/admin';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

const activityConfig: Record<string, { icon: React.ElementType; color: string }> = {
    'TUTOR_REGISTER': { icon: UserPlus, color: 'var(--admin-green)' },
    'TUTOR_TIER_UPGRADE': { icon: Crown, color: 'var(--admin-accent)' },
    'TUTOR_STATUS_TOGGLE': { icon: Lock, color: 'var(--admin-red)' },
    'DOCUMENT_UPLOAD': { icon: FileUp, color: 'var(--admin-accent)' },
    'PAYMENT_CONFIRMED': { icon: CreditCard, color: 'var(--admin-green)' },
    'DEFAULT': { icon: AlertCircle, color: 'var(--admin-text3)' }
};

export function ActivityFeed() {
    const router = useRouter();
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    const handleViewAllActivity = () => {
        router.push('/system');
    };

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const data = await adminStatsApi.getActivityLog(0, 5);
                setActivities(data.content);
            } catch (error) {
                console.error('Failed to fetch activities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 glass border-premium rounded-3xl flex flex-col overflow-hidden shadow-premium backdrop-blur-xl"
        >
            <div className="p-8 border-b border-border/50 flex items-center justify-between">
                <div className="flex flex-col gap-1.5 border-l-4 border-primary pl-4">
                    <h3 className="text-xl font-black text-foreground tracking-tight">Hoạt Động Gần Đây</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Nhật ký hệ thống</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-glow-sm shadow-primary/20">
                    <Clock className="w-5 h-5" />
                </div>
            </div>

            <div className="flex flex-col flex-1 divide-y divide-border/30 overflow-y-auto max-h-[500px] scrollbar-thin">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="p-6 flex items-start gap-4">
                                <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-3/4 rounded-full" />
                                    <Skeleton className="h-3 w-1/4 rounded-full" />
                                </div>
                            </div>
                        ))
                    ) : activities.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-12 text-center flex flex-col items-center gap-4"
                        >
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-muted-foreground/30">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground">Chưa có hoạt động nào được ghi nhận</p>
                        </motion.div>
                    ) : (
                        activities.map((activity, idx) => {
                            const config = activityConfig[activity.type] || activityConfig['DEFAULT'];
                            const Icon = config.icon;

                            return (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.05 * idx }}
                                    className="p-5 flex items-start gap-4 hover:bg-primary/[0.03] transition-all duration-300 group cursor-default"
                                >
                                    <div
                                        className="w-11 h-11 rounded-xl flex items-center justify-center bg-white dark:bg-white/5 shadow-glow-sm transition-all duration-500 group-hover:scale-110 shrink-0 border border-border/10"
                                        style={{ color: config.color, boxShadow: `0 8px 16px ${config.color}15` }}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>

                                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                        <p className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors duration-300">
                                            {activity.description}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                                                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: vi })}
                                            </span>
                                            <div className="w-1 h-1 rounded-full bg-border" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">
                                                {activity.type.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            <div className="p-6 border-t border-border/50 bg-white/30 dark:bg-black/20 backdrop-blur-md">
                <button
                    onClick={handleViewAllActivity}
                    className="group w-full h-12 bg-slate-100 dark:bg-white/5 hover:bg-primary hover:text-white text-[11px] font-black text-muted-foreground rounded-2xl transition-all duration-300 uppercase tracking-widest flex items-center justify-center gap-2 border border-border/50"
                >
                    Xem tất cả hoạt động
                    <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                        <ArrowRight className="w-3.5 h-3.5" />
                    </motion.div>
                </button>
            </div>
        </motion.div>
    );
}
