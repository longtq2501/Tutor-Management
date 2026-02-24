'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { AdminTableSkeleton } from './AdminTableSkeleton';
import { EmptyState } from './EmptyState';

interface Column<T> {
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
            <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl overflow-hidden">
                <EmptyState
                    variant="search"
                    title={emptyState?.title ?? 'Không có dữ liệu'}
                    description={emptyState?.description ?? 'Không tìm thấy kết quả phù hợp. Hãy thử thay đổi bộ lọc.'}
                />
            </div>
        );
    }

    return (
        <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--admin-surface2)]/50 border-b border-[var(--admin-border)]">
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={`px-6 py-4 text-[10px] font-bold text-[var(--admin-text3)] uppercase tracking-widest ${col.className || ''}`}
                                >
                                    <div className={`flex items-center gap-2 ${col.sortable ? 'cursor-pointer hover:text-[var(--admin-text2)] transition-colors' : ''}`}>
                                        <span>{col.header}</span>
                                        {col.sortable && <ArrowUpDown className="h-3 w-3" />}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--admin-border)]">
                        {data.map((item) => (
                            <tr
                                key={item.id}
                                onClick={() => onRowClick?.(item)}
                                className={`group hover:bg-[var(--admin-surface2)]/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                            >
                                {columns.map((col, idx) => (
                                    <td key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(item)
                                            : (item[col.accessor] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className="px-6 py-4 bg-[var(--admin-surface2)]/30 border-t border-[var(--admin-border)] flex items-center justify-between mt-auto">
                    <span className="text-xs text-[var(--admin-text3)] font-medium">
                        Hiện {(pagination.current - 1) * pagination.pageSize + 1}-{Math.min(pagination.current * pagination.pageSize, pagination.total)} trong tổng số {pagination.total.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            className="p-1.5 rounded-lg border border-[var(--admin-border)] text-[var(--admin-text3)] hover:text-[var(--admin-text)] disabled:opacity-50 transition-colors"
                            aria-label="Trang trước"
                            disabled={pagination.current === 1}
                            onClick={() => pagination.onPageChange?.(pagination.current - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-1">
                            {(() => {
                                const totalPages = Math.ceil(pagination.total / pagination.pageSize);
                                const pages: (number | string)[] = [];

                                if (totalPages <= 5) {
                                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                                } else {
                                    pages.push(1, 2);
                                    if (pagination.current > 3) pages.push('...');
                                    if (pagination.current > 2 && pagination.current < totalPages - 1) {
                                        pages.push(pagination.current);
                                    }
                                    if (pagination.current < totalPages - 2) pages.push('...');
                                    pages.push(totalPages - 1, totalPages);
                                }

                                return pages.map((page, idx) => (
                                    <button
                                        key={idx}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === pagination.current
                                            ? 'bg-[var(--admin-accent)] text-[var(--admin-bg)] shadow-md'
                                            : 'text-[var(--admin-text3)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface2)]'
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
                            className="p-1.5 rounded-lg border border-[var(--admin-border)] text-[var(--admin-text3)] hover:text-[var(--admin-text)] disabled:opacity-50 transition-colors"
                            aria-label="Trang tiếp"
                            disabled={pagination.current * pagination.pageSize >= pagination.total}
                            onClick={() => pagination.onPageChange?.(pagination.current + 1)}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
