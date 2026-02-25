'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown, SearchX } from 'lucide-react';
import { AdminTableSkeleton } from './AdminTableSkeleton';
import { EmptyState } from './EmptyState';
import { motion, AnimatePresence } from 'framer-motion';

export interface Column<T> {
    header: string;
    accessor: keyof T | ((item: T) => React.ReactNode);
    className?: string;
    sortable?: boolean;
}

interface AdminTableProps<T> {
    columns: Column<T>[];
    data: T[];
    onRowClick?: (item: T) => void;
    loading?: boolean;
    pagination?: {
        current: number;
        total: number;
        pageSize: number;
        onPageChange?: (page: number) => void;
    };
    emptyState?: {
        title: string;
        description?: string;
    };
}

export function AdminTable<T extends { id: string | number }>({
    columns,
    data,
    loading,
    onRowClick,
    pagination,
    emptyState,
}: AdminTableProps<T>) {
    // Show skeleton while loading
    if (loading) {
        return <AdminTableSkeleton rows={8} cols={columns.length} />;
    }

    // Show empty state when no data
    if (data.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass border-premium rounded-3xl overflow-hidden shadow-premium backdrop-blur-xl"
            >
                <EmptyState
                    variant="search"
                    title={emptyState?.title ?? 'Không có dữ liệu'}
                    description={emptyState?.description ?? 'Không tìm thấy kết quả phù hợp. Hãy thử thay đổi bộ lọc.'}
                    icon={SearchX}
                />
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass border-premium rounded-3xl overflow-hidden flex flex-col shadow-premium backdrop-blur-xl"
        >
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100/50 dark:bg-white/5 border-b border-border/30">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ${col.className || ''}`}
                                >
                                    <div className={`flex items-center gap-2.5 ${col.sortable ? 'cursor-pointer hover:text-primary transition-colors group/head' : ''}`}>
                                        <span className="shrink-0">{col.header}</span>
                                        {col.sortable && <ArrowUpDown className="h-3 w-3 group-hover/head:scale-110 transition-transform" />}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {data.map((item, rowIdx) => (
                            <motion.tr
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.03 * rowIdx }}
                                onClick={() => onRowClick?.(item)}
                                className={`group hover:bg-primary/[0.03] transition-all duration-300 ${onRowClick ? 'cursor-pointer' : ''}`}
                            >
                                {columns.map((col, idx) => (
                                    <td key={idx} className={`px-8 py-5 ${col.className || ''}`}>
                                        <div className="group-hover:translate-x-1 transition-transform duration-500">
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item)
                                                : (item[col.accessor] as React.ReactNode)}
                                        </div>
                                    </td>
                                ))}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className="px-8 py-6 bg-slate-100/30 dark:bg-white/5 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                    <div className="flex flex-col gap-1 items-center sm:items-start text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <span className="flex items-center gap-2 opacity-60">
                            <span className="w-6 h-px bg-border" />
                            Danh sách dữ liệu
                        </span>
                        <span className="text-foreground">
                            Hiện {(pagination.current - 1) * pagination.pageSize + 1}-{Math.min(pagination.current * pagination.pageSize, pagination.total)}
                            <span className="mx-2 opacity-30 text-muted-foreground">/</span>
                            {pagination.total.toLocaleString()}
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/20 hover:scale-110 active:scale-95 disabled:opacity-30 transition-all duration-300 shadow-glow-sm"
                            aria-label="Trang trước"
                            disabled={pagination.current === 1}
                            onClick={() => pagination.onPageChange?.(pagination.current - 1)}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        <div className="flex items-center gap-2">
                            {(() => {
                                const totalPages = Math.ceil(pagination.total / pagination.pageSize);
                                const pages: (number | string)[] = [];

                                if (totalPages <= 5) {
                                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                                } else {
                                    if (pagination.current <= 3) {
                                        pages.push(1, 2, 3, '...', totalPages);
                                    } else if (pagination.current >= totalPages - 2) {
                                        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
                                    } else {
                                        pages.push(1, '...', pagination.current, '...', totalPages);
                                    }
                                }

                                return pages.map((page, idx) => (
                                    <button
                                        key={idx}
                                        className={`w-10 h-10 rounded-xl text-[11px] font-black uppercase transition-all duration-300 ${page === pagination.current
                                            ? 'bg-primary text-white shadow-glow-md shadow-primary/30 scale-110 z-10'
                                            : typeof page === 'number'
                                                ? 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/10'
                                                : 'text-muted-foreground cursor-default'
                                            }`}
                                        aria-label={typeof page === 'number' ? `Trang ${page}` : undefined}
                                        disabled={typeof page !== 'number'}
                                        onClick={() => typeof page === 'number' && pagination.onPageChange?.(page)}
                                    >
                                        {page}
                                    </button>
                                ));
                            })()}
                        </div>

                        <button
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/20 hover:scale-110 active:scale-95 disabled:opacity-30 transition-all duration-300 shadow-glow-sm"
                            aria-label="Trang tiếp"
                            disabled={pagination.current * pagination.pageSize >= pagination.total}
                            onClick={() => pagination.onPageChange?.(pagination.current + 1)}
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
