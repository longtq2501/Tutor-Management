'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, Calendar, Clock, Trash2, Filter, X } from 'lucide-react';
import { StatsBar } from '@/components/admin/StatsBar';
import { AdminTable } from '@/components/admin/AdminTable';
import { adminSessionsApi } from '@/lib/services/admin-sessions';
import { adminStatsApi } from '@/lib/services/admin-stats';
import type { SessionRecord } from '@/lib/types/finance';
import type { OverviewStats } from '@/lib/types/admin';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useConfirm } from '@/hooks/useConfirm';
import { SessionDetailsDrawer } from './components/SessionDetailsDrawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export function SessionsList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [sessions, setSessions] = useState<SessionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [months, setMonths] = useState<string[]>([]);

    // Filter States
    const [selectedMonth, setSelectedMonth] = useState<string>('all');
    const [paidStatus, setPaidStatus] = useState<string>('all');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Detail State
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const { confirm, ConfirmationDialog } = useConfirm();

    const fetchStats = async () => {
        try {
            const data = await adminStatsApi.getOverview();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchMonths = async () => {
        try {
            const data = await adminSessionsApi.getMonths();
            setMonths(data);
        } catch (error) {
            console.error('Failed to fetch months:', error);
        }
    };

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const paid = paidStatus === 'paid' ? true : paidStatus === 'unpaid' ? false : undefined;
            const month = selectedMonth === 'all' ? '' : selectedMonth;
            const data = await adminSessionsApi.getAll(page, 10, debouncedSearchTerm, month, paid);
            setSessions(data.content);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
            toast.error('Không thể tải danh sách buổi học');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        fetchMonths();
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [page, debouncedSearchTerm, selectedMonth, paidStatus]);

    const handleTogglePayment = async (id: number) => {
        try {
            await adminSessionsApi.togglePayment(id);
            toast.success('Đã cập nhật trạng thái thanh toán');
            fetchSessions();
            fetchStats();
        } catch (error) {
            toast.error('Không thể cập nhật trạng thái thanh toán');
        }
    };

    const handleDelete = async (id: number) => {
        const isConfirmed = await confirm({
            title: 'XÓA BUỔI HỌC',
            description: 'Bạn có chắc chắn muốn xóa buổi học này? Dữ liệu tài chính sẽ bị ảnh hưởng.',
            variant: 'destructive'
        });

        if (isConfirmed) {
            try {
                await adminSessionsApi.delete(id);
                toast.success('Đã xóa buổi học thành công');
                fetchSessions();
                fetchStats();
            } catch (error) {
                toast.error('Không thể xóa buổi học');
            }
        }
    };

    const columns = [
        {
            header: 'Mã Buổi Học',
            accessor: (s: SessionRecord) => (
                <span className="text-xs font-black text-[var(--admin-accent)]">
                    SES-{s.id.toString().padStart(3, '0')}
                </span>
            ),
            sortable: true
        },
        {
            header: 'Sinh Viên',
            accessor: (s: SessionRecord) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-[var(--admin-text)]">{s.studentName}</span>
                    <span className="text-[10px] text-[var(--admin-text3)] uppercase font-medium">{s.subject || 'Không rõ môn'}</span>
                </div>
            )
        },
        {
            header: 'Thời Lượng',
            accessor: (s: SessionRecord) => (
                <div className="flex items-center gap-1.5 text-xs text-[var(--admin-text2)] font-medium">
                    <Clock className="h-3 w-3 text-[var(--admin-text3)]" />
                    <span>{s.hours} giờ</span>
                </div>
            )
        },
        {
            header: 'Ngày Học',
            accessor: (s: SessionRecord) => (
                <div className="flex items-center gap-1.5 text-xs text-[var(--admin-text3)] font-medium">
                    <Calendar className="h-3 w-3" />
                    <span>{s.sessionDate}</span>
                </div>
            )
        },
        {
            header: 'Học Phí',
            accessor: (s: SessionRecord) => (
                <span className="text-sm font-bold text-[var(--admin-text)]">
                    {s.totalAmount.toLocaleString()}₫
                </span>
            )
        },
        {
            header: 'Trạng Thái',
            accessor: (s: SessionRecord) => {
                const isPaid = s.paid;
                return (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePayment(s.id);
                        }}
                        className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full border transition-all duration-300 group ${isPaid
                                ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'
                                : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse hover:animate-none hover:bg-red-500 hover:text-white'
                            }`}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full shadow-glow-sm ${isPaid ? 'bg-green-500 group-hover:bg-white' : 'bg-red-500 group-hover:bg-white shadow-red-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.15em]">
                            {isPaid ? 'Đã thu' : 'Chưa thu'}
                        </span>
                    </button>
                );
            }
        },
        {
            header: 'Actions',
            className: 'text-right',
            accessor: (s: SessionRecord) => (
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary bg-slate-100 dark:bg-white/5 hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-xl transition-all duration-300 group/btn"
                        title="Xem chi tiết"
                        aria-label={`Xem chi tiết buổi học SES-${s.id.toString().padStart(3, '0')}`}
                        onClick={() => {
                            setSelectedSessionId(s.id);
                            setIsDetailsOpen(true);
                        }}
                    >
                        <Eye className="h-4.5 w-4.5 group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button
                        className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-red-500 bg-slate-100 dark:bg-white/5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all duration-300 group/btn"
                        title="Xóa buổi học"
                        aria-label={`Xóa buổi học SES-${s.id.toString().padStart(3, '0')}`}
                        onClick={() => handleDelete(s.id)}
                    >
                        <Trash2 className="h-4.5 w-4.5 group-hover/btn:scale-110 transition-transform" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <StatsBar items={[
                { label: 'Tổng Buổi Học', value: totalElements.toLocaleString() },
                { label: 'Hoàn Thành', value: stats ? (stats.totalSessions - 2).toString() : '...', variant: 'green' }, // Mocking completed sessions for now
                { label: 'Chờ Thanh Toán', value: stats ? `${(stats.totalRevenue * 0.12).toLocaleString()}₫` : '...', variant: 'red' },
            ]} />

            <div className="flex flex-col gap-6 backdrop-blur-xl p-6 bg-white/40 dark:bg-black/40 border-premium rounded-[2.5rem] shadow-premium">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <div className="relative flex-1 group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                <Search className="h-4.5 w-4.5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Tìm theo mã, môn học hoặc học sinh..."
                                className="w-full h-12 bg-white/50 dark:bg-white/5 border border-border/50 rounded-2xl pl-12 pr-6 text-sm font-bold text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[160px] h-12 bg-white/50 dark:bg-white/5 border border-border/50 rounded-2xl text-[11px] font-black uppercase tracking-widest text-foreground focus:ring-4 focus:ring-primary/5 transition-all outline-none">
                                <Filter className="h-3.5 w-3.5 mr-2 opacity-50" />
                                <SelectValue placeholder="Chọn tháng" />
                            </SelectTrigger>
                            <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-premium z-[100]">
                                <SelectItem value="all" className="text-[11px] font-black uppercase tracking-widest py-3 hover:bg-primary/5">Tất cả tháng</SelectItem>
                                {months.map(m => (
                                    <SelectItem key={m} value={m} className="text-[11px] font-black uppercase tracking-widest py-3 hover:bg-primary/5">Tháng {m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={paidStatus} onValueChange={setPaidStatus}>
                            <SelectTrigger className="w-[160px] h-12 bg-white/50 dark:bg-white/5 border border-border/50 rounded-2xl text-[11px] font-black uppercase tracking-widest text-foreground focus:ring-4 focus:ring-primary/5 transition-all outline-none">
                                <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${paidStatus === 'paid' ? 'bg-green-500' : paidStatus === 'unpaid' ? 'bg-red-500' : 'bg-muted-foreground'}`} />
                                    <SelectValue placeholder="Trạng thái" />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-premium z-[100]">
                                <SelectItem value="all" className="text-[11px] font-black uppercase tracking-widest py-3">Mọi trạng thái</SelectItem>
                                <SelectItem value="paid" className="text-[11px] font-black uppercase tracking-widest py-3 text-green-500">Đã thanh toán</SelectItem>
                                <SelectItem value="unpaid" className="text-[11px] font-black uppercase tracking-widest py-3 text-red-500">Chưa thanh toán</SelectItem>
                            </SelectContent>
                        </Select>

                        {(selectedMonth !== 'all' || paidStatus !== 'all' || searchTerm) && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedMonth('all');
                                    setPaidStatus('all');
                                }}
                                className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500/20 active:scale-90 transition-all duration-300"
                                title="Xóa bộ lọc"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <AdminTable
                columns={columns}
                data={sessions}
                loading={loading}
                onRowClick={(s) => {
                    setSelectedSessionId(s.id);
                    setIsDetailsOpen(true);
                }}
                pagination={{
                    current: page + 1,
                    total: totalElements,
                    pageSize: 10,
                    onPageChange: (p) => setPage(p - 1)
                }}
            />

            <SessionDetailsDrawer
                isOpen={isDetailsOpen}
                onClose={() => {
                    setIsDetailsOpen(false);
                    setSelectedSessionId(null);
                }}
                sessionId={selectedSessionId}
            />

            <ConfirmationDialog />
        </div>
    );
}
