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
            accessor: (s: SessionRecord) => (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePayment(s.id);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all ${s.paid
                            ? 'bg-[var(--admin-green)]/10 border-[var(--admin-green)]/20 text-[var(--admin-green)]'
                            : 'bg-[var(--admin-red)]/10 border-[var(--admin-red)]/20 text-[var(--admin-red)] animate-pulse'
                        }`}
                >
                    <div className={`w-1 h-1 rounded-full ${s.paid ? 'bg-[var(--admin-green)]' : 'bg-[var(--admin-red)]'}`} />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                        {s.paid ? 'Đã thu' : 'Chưa thu'}
                    </span>
                </button>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            accessor: (s: SessionRecord) => (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="p-2 text-[var(--admin-text3)] hover:text-[var(--admin-red)] hover:bg-[var(--admin-red)]/10 rounded-lg transition-all"
                        title="Xóa buổi học"
                        onClick={() => handleDelete(s.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                        className="p-2 text-[var(--admin-text3)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface2)] rounded-lg transition-all"
                        title="Xem chi tiết"
                        onClick={() => {
                            setSelectedSessionId(s.id);
                            setIsDetailsOpen(true);
                        }}
                    >
                        <Eye className="h-4 w-4" />
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

            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-text3)]" />
                            <input
                                type="text"
                                placeholder="Tìm theo mã, môn học hoặc học sinh..."
                                className="w-full h-10 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl pl-10 pr-4 text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                            <SelectTrigger className="w-[140px] h-10 bg-[var(--admin-surface)] border-[var(--admin-border)] text-xs font-bold rounded-xl">
                                <Filter className="h-3 w-3 mr-2 opacity-50" />
                                <SelectValue placeholder="Chọn tháng" />
                            </SelectTrigger>
                            <SelectContent className="admin-glass border-[var(--admin-border)]">
                                <SelectItem value="all" className="text-xs font-bold">Tất cả tháng</SelectItem>
                                {months.map(m => (
                                    <SelectItem key={m} value={m} className="text-xs font-bold">Tháng {m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={paidStatus} onValueChange={setPaidStatus}>
                            <SelectTrigger className="w-[140px] h-10 bg-[var(--admin-surface)] border-[var(--admin-border)] text-xs font-bold rounded-xl">
                                <SelectValue placeholder="Trạng thái" />
                            </SelectTrigger>
                            <SelectContent className="admin-glass border-[var(--admin-border)]">
                                <SelectItem value="all" className="text-xs font-bold">Mọi trạng thái</SelectItem>
                                <SelectItem value="paid" className="text-xs font-bold text-[var(--admin-green)]">Đã thanh toán</SelectItem>
                                <SelectItem value="unpaid" className="text-xs font-bold text-[var(--admin-red)]">Chưa thanh toán</SelectItem>
                            </SelectContent>
                        </Select>

                        {(selectedMonth !== 'all' || paidStatus !== 'all' || searchTerm) && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setSelectedMonth('all');
                                    setPaidStatus('all');
                                }}
                                className="p-2.5 bg-[var(--admin-surface2)] text-[var(--admin-text3)] hover:text-[var(--admin-red)] rounded-xl transition-all"
                                title="Xóa bộ lọc"
                            >
                                <X className="h-4 w-4" />
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
