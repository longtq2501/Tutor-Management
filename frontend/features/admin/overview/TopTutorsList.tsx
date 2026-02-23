'use client';

import { Award, TrendingUp } from 'lucide-react';
import type { TopTutor } from '@/lib/types/admin';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface TopTutorsListProps {
    data: TopTutor[];
    loading?: boolean;
}

export function TopTutorsList({ data, loading = false }: TopTutorsListProps) {
    const maxRevenue = Math.max(...data.map(t => t.totalRevenue), 1);

    return (
        <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-6 flex flex-col gap-6 h-full shadow-xl shadow-black/10">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-[var(--admin-text)]">Gia Sư Top Đầu</h3>
                    <p className="text-xs text-[var(--admin-text3)] uppercase tracking-widest font-medium">Theo doanh thu hệ thống</p>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Award className="h-5 w-5 text-amber-500" />
                </div>
            </div>

            <div className="flex flex-col gap-5 relative min-h-[200px]">
                {loading && (
                    <div className="absolute inset-0 bg-[var(--admin-surface)]/80 rounded-lg z-10 flex items-center justify-center backdrop-blur-sm">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--admin-accent)]" />
                    </div>
                )}

                {data.map((tutor, idx) => (
                    <div key={tutor.tutorId} className="flex flex-col gap-2 group">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-black ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-[var(--admin-text3)]'}`}>
                                    #{idx + 1}
                                </span>
                                <span className="text-xs font-bold text-[var(--admin-text)] group-hover:text-[var(--admin-accent)] transition-colors">
                                    {tutor.tutorName}
                                </span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-[var(--admin-text)]">{formatCurrency(tutor.totalRevenue)}</span>
                                <span className="text-[9px] font-bold text-[var(--admin-text3)] uppercase tracking-widest">{tutor.sessionCount} buổi học</span>
                            </div>
                        </div>
                        <div className="h-1.5 bg-[var(--admin-surface2)] rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ease-out ${idx === 0 ? 'bg-amber-500' : 'bg-[var(--admin-accent)]/60'}`}
                                style={{ width: `${(tutor.totalRevenue / maxRevenue) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}

                {data.length === 0 && !loading && (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 opacity-30 mt-10">
                        <TrendingUp className="h-10 w-10" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Chưa có dữ liệu tăng trưởng</span>
                    </div>
                )}
            </div>
        </div>
    );
}
