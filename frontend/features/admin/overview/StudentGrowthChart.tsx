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
        <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-6 flex flex-col gap-6 h-full">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-[var(--admin-text)]">Tăng Trưởng Học Sinh</h3>
                    <p className="text-xs text-[var(--admin-text3)] uppercase tracking-widest font-medium">Lượng học sinh mới theo tháng</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users className="h-5 w-5 text-blue-400" />
                </div>
            </div>

            <div className="h-[200px] flex items-end justify-between gap-2 pt-4 relative">
                {loading && (
                    <div className="absolute inset-0 bg-[var(--admin-surface)]/80 rounded-lg z-10 flex items-center justify-center backdrop-blur-sm">
                        <div className="w-8 h-8 border-2 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                {data.map((item, idx) => {
                    const height = (item.count / maxValue) * 100;

                    return (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                            <div className="relative w-full flex justify-center h-full items-end">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.05, ease: 'easeOut' }}
                                    className="w-full max-w-[24px] rounded-t-lg bg-blue-500/60 group-hover:bg-blue-500 group-hover:brightness-125 transition-all duration-300 relative"
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--admin-surface3)] text-[var(--admin-text)] text-[10px] font-bold px-2 py-1 rounded border border-[var(--admin-border2)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                        {item.count} học sinh
                                    </div>
                                </motion.div>
                            </div>
                            <span className="text-[9px] font-bold text-[var(--admin-text3)] uppercase tracking-tighter">
                                {item.month.split('-')[1]}/{item.month.split('-')[0].slice(2)}
                            </span>
                        </div>
                    )
                })}

                {data.length === 0 && !loading && (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-[var(--admin-text3)] uppercase tracking-widest opacity-30">
                        Chưa có dữ liệu
                    </div>
                )}
            </div>
        </div>
    );
}
