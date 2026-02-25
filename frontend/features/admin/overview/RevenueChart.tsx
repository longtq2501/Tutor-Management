'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface RevenueData {
    month: string;
    value: number;
}

interface RevenueChartProps {
    data: RevenueData[];
    view?: '6m' | '1y';
    onViewChange?: (view: '6m' | '1y') => void;
    loading?: boolean;
}

export function RevenueChart({ data, view: controlledView, onViewChange, loading = false }: RevenueChartProps) {
    const [internalView, setInternalView] = useState<'6m' | '1y'>('6m');
    const view = controlledView ?? internalView;

    const handleViewChange = (newView: '6m' | '1y') => {
        if (onViewChange) {
            onViewChange(newView);
        } else {
            setInternalView(newView);
        }
    };

    const filteredData = useMemo(() => {
        return view === '6m' ? data.slice(-6) : data;
    }, [data, view]);

    const maxValue = useMemo(() => {
        return Math.max(...filteredData.map(d => d.value), 1);
    }, [filteredData]);

    const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass border-premium rounded-3xl p-8 flex flex-col gap-8 shadow-premium backdrop-blur-xl"
        >
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5 border-l-4 border-primary pl-4">
                    <h3 className="text-xl font-black text-foreground tracking-tight">Doanh Thu Hệ Thống</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Báo cáo doanh số tháng</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-border/50 backdrop-blur-md">
                    <button
                        onClick={() => handleViewChange('6m')}
                        disabled={loading}
                        className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all duration-300 disabled:opacity-50 uppercase tracking-widest ${view === '6m'
                            ? 'bg-primary text-white shadow-glow-sm shadow-primary/30'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        6 THÁNG
                    </button>
                    <button
                        onClick={() => handleViewChange('1y')}
                        disabled={loading}
                        className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all duration-300 disabled:opacity-50 uppercase tracking-widest ${view === '1y'
                            ? 'bg-primary text-white shadow-glow-sm shadow-primary/30'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        1 NĂM
                    </button>
                </div>
            </div>

            <div className="h-[240px] flex items-end justify-between gap-3 pt-8 relative px-2">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-black/50 rounded-2xl z-20 flex items-center justify-center backdrop-blur-md">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}

                {/* Horizontal Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between py-8 pointer-events-none opacity-20">
                    {[1, 2, 3, 4].map(line => (
                        <div key={line} className="w-full h-px bg-border border-dashed" />
                    ))}
                </div>

                {filteredData.map((item, idx) => {
                    const height = (item.value / maxValue) * 100;
                    const isCurrentMonth = item.month === currentMonth;

                    return (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end relative z-10">
                            <div className="relative w-full flex justify-center h-full items-end">
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: `${height}%`, opacity: 1 }}
                                    transition={{ duration: 1.2, delay: idx * 0.08, ease: [0.33, 1, 0.68, 1] }}
                                    className={`w-full max-w-[42px] rounded-t-xl transition-all duration-500 relative group-hover:scale-x-110 overflow-hidden ${isCurrentMonth
                                            ? 'bg-primary shadow-glow-md shadow-primary/40'
                                            : 'bg-primary/40 group-hover:bg-primary/60'
                                        }`}
                                >
                                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />

                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 glass px-3 py-1.5 rounded-lg border-premium opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none whitespace-nowrap z-30 shadow-premium">
                                        <p className="text-[11px] font-black text-foreground">
                                            {item.value.toLocaleString()}₫
                                        </p>
                                    </div>
                                </motion.div>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${isCurrentMonth ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-foreground'
                                }`}>
                                {item.month}
                            </span>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
