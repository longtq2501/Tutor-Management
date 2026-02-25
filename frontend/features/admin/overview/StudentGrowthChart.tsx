'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import type { StudentGrowth } from '@/lib/types/admin';

interface StudentGrowthChartProps {
    data: StudentGrowth[];
    loading?: boolean;
}

export function StudentGrowthChart({ data, loading = false }: StudentGrowthChartProps) {
    const maxValue = useMemo(() => {
        return Math.max(...data.map(d => d.count), 1);
    }, [data]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="glass border-premium rounded-3xl p-8 flex flex-col gap-8 shadow-premium backdrop-blur-xl h-full"
        >
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5 border-l-4 border-blue-500 pl-4">
                    <h3 className="text-xl font-black text-foreground tracking-tight">Tăng Trưởng Học Sinh</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Lượng học sinh mới theo tháng</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shadow-glow-sm shadow-blue-500/20">
                    <Users className="h-5 w-5" />
                </div>
            </div>

            <div className="h-[240px] flex items-end justify-between gap-3 pt-8 relative px-2">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 rounded-2xl z-20 flex items-center justify-center backdrop-blur-md">
                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Horizontal Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between py-10 pointer-events-none opacity-20">
                    {[1, 2, 3].map(line => (
                        <div key={line} className="w-full h-px bg-border border-dashed" />
                    ))}
                </div>

                {data.map((item, idx) => {
                    const height = (item.count / maxValue) * 100;

                    return (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end relative z-10">
                            <div className="relative w-full flex justify-center h-full items-end">
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: `${height}%`, opacity: 1 }}
                                    transition={{ duration: 1.2, delay: idx * 0.08, ease: [0.33, 1, 0.68, 1] }}
                                    className="w-full max-w-[28px] rounded-t-xl bg-blue-500/40 group-hover:bg-blue-500 group-hover:shadow-glow-md group-hover:shadow-blue-500/40 transition-all duration-500 relative group-hover:scale-x-110 overflow-hidden"
                                >
                                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />

                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 glass px-3 py-1.5 rounded-lg border-premium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-30 shadow-premium border-blue-500/30">
                                        <p className="text-[11px] font-black text-foreground">
                                            {item.count} học sinh
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 group-hover:text-blue-500 transition-colors duration-300">
                                {item.month.split('-')[1]}/{item.month.split('-')[0].slice(2)}
                            </span>
                        </div>
                    )
                })}

                {data.length === 0 && !loading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground"
                    >
                        CHƯA CÓ DỮ LIỆU
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}
