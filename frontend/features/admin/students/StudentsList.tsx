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
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--admin-surface2)] border border-[var(--admin-border)] flex items-center justify-center font-bold text-[var(--admin-text2)] text-xs">
                        {s.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-[var(--admin-text)] group-hover:text-[var(--admin-accent)] transition-colors">{s.name}</span>
                        <span className="text-[11px] text-[var(--admin-text3)]">{s.parentName}</span>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            header: 'Gia Sư Phụ Trách',
            accessor: (s: AdminStudent) => <span className="text-xs font-bold text-[var(--admin-accent)]">{s.tutorName || 'Chưa gán'}</span>
        },
        {
            header: 'Dư Nợ',
            accessor: (s: AdminStudent) => (
                <span className={`text-sm font-bold ${s.totalDebt > 0 ? 'text-[var(--admin-red)]' : 'text-[var(--admin-green)]'}`}>
                    {s.totalDebt.toLocaleString()}₫
                </span>
            )
        },
        {
            header: 'Ngày Nhập Học',
            accessor: (s: AdminStudent) => new Date(s.createdAt).toLocaleDateString('vi-VN'),
            className: 'text-xs text-[var(--admin-text3)] font-medium'
        },
        {
            header: 'Trạng Thái',
            accessor: (s: AdminStudent) => (
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-[var(--admin-green)]' : 'bg-[var(--admin-text3)]'}`} />
                    <span className={`text-[11px] font-medium ${s.active ? 'text-[var(--admin-green)]' : 'text-[var(--admin-text3)]'}`}>
                        {s.active ? 'Đang học' : 'Nghỉ học'}
                    </span>
                </div>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            accessor: (s: AdminStudent) => (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="p-2 text-[var(--admin-text3)] hover:text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/10 rounded-lg transition-all"
                        title="Chỉnh sửa"
                        onClick={() => openEdit(s.id)}
                    >
                        <Edit className="h-4 w-4" />
                    </button>
                    <button
                        className="p-2 text-[var(--admin-text3)] hover:text-[var(--admin-red)] hover:bg-[var(--admin-red)]/10 rounded-lg transition-all"
                        title="Xóa"
                        onClick={() => handleDelete(s.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                        className="p-2 text-[var(--admin-text3)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface2)] rounded-lg transition-all"
                        title="Xem chi tiết"
                        onClick={() => openDetails(s.id)}
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
                { label: 'Tổng Học Sinh', value: (stats?.totalStudents || totalElements).toString() },
                { label: 'Đang Học', value: (stats?.activeStudents || 0).toString(), variant: 'green' },
                { label: 'Nghỉ Học', value: (stats ? (stats.totalStudents - stats.activeStudents) : 0).toString() },
            ]} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-text3)]" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên học sinh..."
                            className="w-full h-10 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl pl-10 pr-4 text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    onClick={() => {
                        setSelectedStudentId(null);
                        setIsFormModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-[var(--admin-accent)] text-[var(--admin-bg)] rounded-xl text-xs font-black shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-105 transition-all"
                >
                    <UserPlus className="h-4 w-4" />
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
