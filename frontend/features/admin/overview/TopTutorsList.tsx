'use client';

import { Award, TrendingUp, Loader2, Sparkles, ArrowRight } from 'lucide-react';
import type { TopTutor } from '@/lib/types/admin';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface TopTutorsListProps {
    data: TopTutor[];
    loading?: boolean;
}

export function TopTutorsList({ data, loading = false }: TopTutorsListProps) {
    const maxRevenue = Math.max(...data.map(t => t.totalRevenue), 1);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="glass border-premium rounded-3xl p-8 flex flex-col gap-8 shadow-premium backdrop-blur-xl h-full"
        >
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5 border-l-4 border-amber-500 pl-4">
                    <h3 className="text-xl font-black text-foreground tracking-tight">Gia Sư Top Đầu</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Theo doanh thu hệ thống</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-glow-sm shadow-amber-500/20">
                    <Award className="h-5 w-5" />
                </div>
            </div>

            <div className="flex flex-col gap-6 relative flex-1">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="w-6 h-4 rounded-full" />
                                        <Skeleton className="w-32 h-4 rounded-full" />
                                    </div>
                                    <Skeleton className="w-20 h-4 rounded-full" />
                                </div>
                                <Skeleton className="h-2 w-full rounded-full" />
                            </div>
                        ))
                    ) : data.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex-1 flex flex-col items-center justify-center gap-4 py-20"
                        >
                            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-muted-foreground/30">
                                <TrendingUp className="h-10 w-10" />
                            </div>
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">Chưa có dữ liệu tăng trưởng</p>
                        </motion.div>
                    ) : (
                        data.map((tutor, idx) => {
                            const isTop1 = idx === 0;
                            const isTop2 = idx === 1;
                            const isTop3 = idx === 2;

                            return (
                                <motion.div
                                    key={tutor.tutorId}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * idx }}
                                    className="flex flex-col gap-3 group relative"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`
                                                w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black transition-all duration-500
                                                ${isTop1 ? 'bg-amber-500 text-white shadow-glow-sm shadow-amber-500/40 scale-110' :
                                                    isTop2 ? 'bg-slate-300 dark:bg-slate-600 text-white' :
                                                        isTop3 ? 'bg-amber-700 text-white' :
                                                            'bg-slate-100 dark:bg-white/5 text-muted-foreground'}
                                            `}>
                                                {idx + 1}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-foreground group-hover:text-amber-500 transition-colors duration-300 flex items-center gap-1.5">
                                                    {tutor.tutorName}
                                                    {isTop1 && <Sparkles className="w-3 h-3 text-amber-500" />}
                                                </span>
                                                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{tutor.sessionCount} buổi học</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-black text-foreground tabular-nums">{formatCurrency(tutor.totalRevenue)}</span>
                                            <div className="w-0 group-hover:w-full h-0.5 bg-amber-500/30 transition-all duration-500 mt-0.5 rounded-full" />
                                        </div>
                                    </div>

                                    <div className="relative h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-border/10">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(tutor.totalRevenue / maxRevenue) * 100}%` }}
                                            transition={{ duration: 1.5, ease: "circOut", delay: 0.4 + (0.1 * idx) }}
                                            className={`h-full rounded-full relative ${isTop1 ? 'bg-amber-500' : 'bg-primary/50 group-hover:bg-primary transition-colors duration-500'
                                                }`}
                                        >
                                            {isTop1 && <div className="absolute inset-0 bg-white/30 animate-pulse" />}
                                        </motion.div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>

            <div className="mt-auto">
                <button className="w-full py-4 bg-slate-100 dark:bg-white/5 hover:bg-amber-500/10 border border-border/50 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-amber-500 transition-all duration-300 flex items-center justify-center gap-2">
                    Bảng xếp hạng chi tiết
                    <ArrowRight className="w-3 h-3" />
                </button>
            </div>
        </motion.div>
    );
}
