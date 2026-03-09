"use client";

import { formatCurrency } from '@/lib/utils';
import { AlertCircle, Banknote } from 'lucide-react';

interface FinancialSummaryProps {
    totalUnpaid: number;
    totalPaid: number;
}

export function FinancialSummary({ totalUnpaid, totalPaid }: FinancialSummaryProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-red-50/50 dark:bg-red-950/20 border-2 border-red-100 dark:border-red-900/30 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-wider">Học phí còn nợ</span>
                </div>
                <div className="text-3xl font-black text-red-600 dark:text-red-400">
                    {formatCurrency(totalUnpaid)}
                </div>
            </div>

            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border-2 border-emerald-100 dark:border-emerald-900/30 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-2">
                    <Banknote className="w-5 h-5" />
                    <span className="font-bold text-sm uppercase tracking-wider">Tổng đã đóng</span>
                </div>
                <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(totalPaid)}
                </div>
            </div>
        </div>
    );
}
