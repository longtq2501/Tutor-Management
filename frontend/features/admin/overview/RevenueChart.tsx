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
        <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-[var(--admin-text)]">Doanh Thu Hệ Thống</h3>
                    <p className="text-xs text-[var(--admin-text3)] uppercase tracking-widest font-medium">Báo cáo doanh số tháng</p>
                </div>

                <div className="flex bg-[var(--admin-surface2)] p-1 rounded-lg border border-[var(--admin-border)]">
                    <button
                        onClick={() => handleViewChange('6m')}
                        disabled={loading}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all disabled:opacity-50 ${view === '6m'
                            ? 'bg-[var(--admin-surface3)] text-[var(--admin-accent)] shadow-sm'
                            : 'text-[var(--admin-text3)] hover:text-[var(--admin-text2)]'
                            }`}
                    >
                        6 THÁNG
                    </button>
                    <button
                        onClick={() => handleViewChange('1y')}
                        disabled={loading}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all disabled:opacity-50 ${view === '1y'
                            ? 'bg-[var(--admin-surface3)] text-[var(--admin-accent)] shadow-sm'
                            : 'text-[var(--admin-text3)] hover:text-[var(--admin-text2)]'
                            }`}
                    >
                        1 NĂM
                    </button>
                </div>
            </div>

            <div className="h-[200px] flex items-end justify-between gap-2 pt-4 relative">
                {loading && (
                    <div className="absolute inset-0 bg-[var(--admin-surface)]/80 rounded-lg z-10 flex items-center justify-center backdrop-blur-sm">
                        <div className="w-8 h-8 border-2 border-[var(--admin-accent)] border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                {filteredData.map((item, idx) => {
                    const height = (item.value / maxValue) * 100;
                    const isCurrentMonth = item.month === currentMonth;

                    return (
                        <div key={item.month} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                            <div className="relative w-full flex justify-center h-full items-end">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${height}%` }}
                                    transition={{ duration: 0.8, delay: idx * 0.05, ease: 'easeOut' }}
                                    className={`w-full max-w-[32px] rounded-t-lg transition-all duration-300 relative group-hover:brightness-125 ${isCurrentMonth ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-accent)]/60'
                                        }`}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--admin-surface3)] text-[var(--admin-text)] text-[10px] font-bold px-2 py-1 rounded border border-[var(--admin-border2)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                        {item.value.toLocaleString()}₫
                                    </div>
                                </motion.div>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-tighter ${isCurrentMonth ? 'text-[var(--admin-accent)]' : 'text-[var(--admin-text3)]'
                                }`}>
                                {item.month}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
