'use client';

import { useState, useEffect } from 'react';
import { Eye, Search, UserPlus, Trash2, Edit } from 'lucide-react';
import { StatsBar } from '@/components/admin/StatsBar';
import { AdminTable } from '@/components/admin/AdminTable';
import { adminStudentsApi } from '@/lib/services/admin-students';
import { adminStatsApi } from '@/lib/services/admin-stats';
import type { AdminStudent, OverviewStats } from '@/lib/types/admin';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { useConfirm } from '@/hooks/useConfirm';
import { StudentFormModal } from './components/StudentFormModal';
import { StudentDetailsDrawer } from './components/StudentDetailsDrawer';
import { OptimizedAvatar } from '@/features/students/unified-view/components/OptimizedAvatar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export function StudentsList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [students, setStudents] = useState<AdminStudent[]>([]);
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // CRUD States
    const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);

    const { confirm, ConfirmationDialog } = useConfirm();

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const data = await adminStudentsApi.getAll(page, 10, debouncedSearchTerm);
            setStudents(data.content);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error('Failed to fetch students:', error);
            toast.error('Không thể tải danh sách học sinh');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const data = await adminStatsApi.getOverview();
            setStats(data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [page, debouncedSearchTerm]);

    useEffect(() => {
        fetchStats();
    }, []);

    const handleDelete = async (id: number) => {
        const isConfirmed = await confirm({
            title: 'XÓA HỌC SINH',
            description: 'Bạn có chắc chắn muốn xóa học sinh này? Hành động này không thể hoàn tác.',
            variant: 'destructive'
        });

        if (isConfirmed) {
            try {
                await adminStudentsApi.delete(id);
                toast.success('Đã xóa học sinh thành công');
                fetchStudents();
                fetchStats();
            } catch (error) {
                toast.error('Không thể xóa học sinh');
            }
        }
    };

    const openEdit = (id: number) => {
        setSelectedStudentId(id);
        setIsFormModalOpen(true);
    };

    const openDetails = (id: number) => {
        setSelectedStudentId(id);
        setIsDetailsDrawerOpen(true);
    };

    const columns = [
        {
            header: 'Học Sinh',
            accessor: (s: AdminStudent) => (
                <div className="flex items-center gap-3.5 group/student">
                    <OptimizedAvatar
                        name={s.name}
                        avatarUrl={s.avatarUrl}
                        isActive={s.active}
                        className="w-11 h-11 rounded-xl shadow-glow-sm"
                    />
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-black text-foreground group-hover:text-[var(--admin-accent)] transition-colors duration-300 leading-none">{s.name}</span>
                        <span className="text-[11px] font-black text-[var(--admin-text2)] uppercase tracking-widest opacity-60 leading-none mt-1">{s.parentName}</span>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            header: 'Gia Sư Phụ Trách',
            accessor: (s: AdminStudent) => (
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shadow-glow-sm ${s.tutorName ? 'bg-[var(--admin-accent)] shadow-[var(--admin-accent)]/50' : 'bg-[var(--admin-text3)] opacity-30'}`} />
                    <span className={`text-[11px] font-black uppercase tracking-widest ${s.tutorName ? 'text-[var(--admin-accent)]' : 'text-[var(--admin-text3)] opacity-50'}`}>
                        {s.tutorName || 'CHƯA GÁN'}
                    </span>
                </div>
            )
        },
        {
            header: 'Ngày Nhập Học',
            accessor: (s: AdminStudent) => {
                const date = s.createdAt ? new Date(s.createdAt) : null;
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-black text-foreground opacity-80">
                            {date && !isNaN(date.getTime()) ? format(date, 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--admin-text3)] uppercase tracking-tighter opacity-40">Học sinh mới</span>
                    </div>
                );
            }
        },
        {
            header: 'Dư Nợ',
            accessor: (s: AdminStudent) => {
                const debt = s.totalDebt || 0;
                return (
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-500 shadow-glow-sm ${debt > 0
                        ? 'bg-[var(--admin-red)]/10 border-[var(--admin-red)]/20 text-[var(--admin-red)] shadow-[var(--admin-red)]/10'
                        : 'bg-[var(--admin-green)]/10 border-[var(--admin-green)]/20 text-[var(--admin-green)] shadow-[var(--admin-green)]/10'
                        }`}>
                        {debt > 0 ? 'DƯ NỢ: ' : ''}{debt.toLocaleString()}₫
                    </div>
                );
            }
        },
        {
            header: 'Trạng Thái',
            accessor: (s: AdminStudent) => {
                const isActive = s.active;
                return (
                    <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full shadow-glow-sm ${isActive ? 'bg-[var(--admin-green)] shadow-[var(--admin-green)]/50' : 'bg-[var(--admin-text3)] shadow-glow-sm shadow-[var(--admin-text3)]/30'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-[var(--admin-green)]' : 'text-[var(--admin-text3)]'}`}>
                            {isActive ? 'Đang học' : 'Nghỉ học'}
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'Actions',
            className: 'text-right',
            accessor: (s: AdminStudent) => (
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="w-10 h-10 flex items-center justify-center text-[var(--admin-text2)] hover:text-[var(--admin-accent)] bg-[var(--admin-surface2)] hover:bg-[var(--admin-accent-dim)] border border-transparent hover:border-[var(--admin-accent)]/20 rounded-xl transition-all duration-300 group/btn"
                        title="Xem chi tiết"
                        aria-label={`Xem chi tiết học sinh ${s.name}`}
                        onClick={() => openDetails(s.id)}
                    >
                        <Eye className="h-4.5 w-4.5 group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button
                        className="w-10 h-10 flex items-center justify-center text-[var(--admin-text2)] hover:text-[var(--admin-accent)] bg-[var(--admin-surface2)] hover:bg-[var(--admin-accent-dim)] border border-transparent hover:border-[var(--admin-accent)]/20 rounded-xl transition-all duration-300 group/btn"
                        title="Chỉnh sửa"
                        aria-label={`Chỉnh sửa học sinh ${s.name}`}
                        onClick={() => openEdit(s.id)}
                    >
                        <Edit className="h-4.5 w-4.5 group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button
                        className="w-10 h-10 flex items-center justify-center text-[var(--admin-text2)] hover:text-[var(--admin-red)] bg-[var(--admin-surface2)] hover:bg-[var(--admin-red)]/10 border border-transparent hover:border-[var(--admin-red)]/20 rounded-xl transition-all duration-300 group/btn"
                        title="Xóa"
                        aria-label={`Xóa học sinh ${s.name}`}
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
                { label: 'Tổng Học Sinh', value: (stats?.totalStudents || totalElements).toString() },
                { label: 'Đang Học', value: (stats?.activeStudents || 0).toString(), variant: 'green' },
                { label: 'Nghỉ Học', value: (stats ? (stats.totalStudents - stats.activeStudents) : 0).toString() },
            ]} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-xl p-6 bg-white/40 dark:bg-black/40 border-premium rounded-[2.5rem] shadow-premium">
                <div className="flex items-center gap-4 flex-1 max-w-2xl">
                    <div className="relative flex-1 group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                            <Search className="h-4.5 w-4.5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm theo tên học sinh..."
                            className="w-full h-12 bg-white/50 dark:bg-white/5 border border-border/50 rounded-2xl pl-12 pr-6 text-sm font-bold text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="h-px w-full bg-border/30 md:hidden" />

                <button
                    onClick={() => {
                        setSelectedStudentId(null);
                        setIsFormModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-3 px-8 py-3 bg-[var(--admin-accent)] text-[var(--admin-bg)] rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-glow-md shadow-[var(--admin-accent)]/30 hover:scale-[1.03] active:scale-95 transition-all duration-300 shrink-0"
                >
                    <UserPlus className="h-4.5 w-4.5" />
                    <span>THÊM HỌC SINH</span>
                </button>
            </div>

            <AdminTable
                columns={columns}
                data={students}
                loading={loading}
                onRowClick={(s) => openDetails(s.id)}
                pagination={{
                    current: page + 1,
                    total: totalElements,
                    pageSize: 10,
                    onPageChange: (p) => setPage(p - 1)
                }}
            />

            <StudentFormModal
                isOpen={isFormModalOpen}
                onClose={() => {
                    setIsFormModalOpen(false);
                    setSelectedStudentId(null);
                }}
                onSuccess={() => {
                    fetchStudents();
                    fetchStats();
                }}
                studentId={selectedStudentId}
            />

            <StudentDetailsDrawer
                isOpen={isDetailsDrawerOpen}
                onClose={() => {
                    setIsDetailsDrawerOpen(false);
                    setSelectedStudentId(null);
                }}
                studentId={selectedStudentId}
            />

            <ConfirmationDialog />
        </div>
    );
}
