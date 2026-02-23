'use client';

import { useState, useEffect } from 'react';
import { Ban, Edit2, Eye, Search, UserPlus, ShieldAlert } from 'lucide-react';
import { StatsBar } from '@/components/admin/StatsBar';
import { AdminTable } from '@/components/admin/AdminTable';
import { TutorDetailDrawer } from './TutorDetailDrawer';
import { CreateTutorModal } from './CreateTutorModal';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { tutorsApi } from '@/lib/services/tutor';
import { adminStatsApi } from '@/lib/services/admin-stats';
import type { Tutor } from '@/lib/types/tutor';
import type { OverviewStats } from '@/lib/types/admin';
import { toast } from 'sonner';

export function TutorsList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [tutors, setTutors] = useState<Tutor[]>([]);
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [suspendTutorId, setSuspendTutorId] = useState<number | null>(null);
    const [suspendTutorName, setSuspendTutorName] = useState<string>('');

    const fetchTutors = async () => {
        setLoading(true);
        try {
            const data = await tutorsApi.getAll(page, 10, searchTerm, statusFilter);
            setTutors(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data.totalElements);
        } catch (error) {
            console.error('Failed to fetch tutors:', error);
            toast.error('Không thể tải danh sách gia sư');
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
        fetchTutors();
    }, [page, searchTerm, statusFilter]);

    useEffect(() => {
        fetchStats();
    }, []);

    const handleViewTutor = (tutor: Tutor) => {
        setSelectedTutor(tutor);
        setIsDrawerOpen(true);
    };

    const handleToggleStatus = (id: number, tutorName: string) => {
        setSuspendTutorId(id);
        setSuspendTutorName(tutorName);
    };

    const handleConfirmToggleStatus = async () => {
        if (suspendTutorId === null) return;
        try {
            await tutorsApi.toggleStatus(suspendTutorId);
            toast.success('Đã thay đổi trạng thái tài khoản');
            fetchTutors();
            fetchStats();
            setSuspendTutorId(null);
            setSuspendTutorName('');
        } catch (error) {
            toast.error('Thao tác thất bại');
        }
    };

    const columns = [
        {
            header: 'Gia Sư',
            accessor: (t: Tutor) => (
                <div className="flex items-center gap-3">
                    {t.avatarUrl ? (
                        <img
                            src={t.avatarUrl}
                            alt={t.fullName}
                            className="w-9 h-9 rounded-lg object-cover border border-[var(--admin-border)]"
                        />
                    ) : (
                        <div className="w-9 h-9 rounded-lg bg-[var(--admin-surface2)] border border-[var(--admin-border)] flex items-center justify-center font-bold text-[var(--admin-text2)] text-xs">
                            {t.fullName.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-[var(--admin-text)] group-hover:text-[var(--admin-accent)] transition-colors">{t.fullName}</span>
                        <span className="text-[11px] text-[var(--admin-text3)]">{t.email}</span>
                    </div>
                </div>
            ),
            sortable: true
        },
        { header: 'Số ĐT', accessor: 'phone' as keyof Tutor },
        {
            header: 'Gói Cước',
            accessor: (t: Tutor) => {
                const tier = t.subscriptionPlan === 'PREMIUM' ? 'PRO' : 'FREE';
                const style = t.subscriptionPlan === 'PREMIUM'
                    ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                    : 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
                return (
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black ${style}`}>{tier}</span>
                );
            }
        },
        {
            header: 'Ngày Tham Gia',
            accessor: (t: Tutor) => new Date(t.createdAt).toLocaleDateString('vi-VN'),
            className: 'text-xs text-[var(--admin-text3)] font-medium'
        },
        {
            header: 'Trạng Thái',
            accessor: (t: Tutor) => (
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${t.subscriptionStatus === 'ACTIVE' ? 'bg-[var(--admin-green)]' : 'bg-[var(--admin-red)]'}`} />
                    <span className={`text-[11px] font-medium ${t.subscriptionStatus === 'ACTIVE' ? 'text-[var(--admin-green)]' : 'text-[var(--admin-red)]'}`}>
                        {t.subscriptionStatus === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                </div>
            )
        },
        {
            header: 'Actions',
            className: 'text-right',
            accessor: (t: Tutor) => (
                <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <button className="p-2 text-[var(--admin-text3)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface2)] rounded-lg transition-all" title="Xem chi tiết" onClick={() => handleViewTutor(t)}>
                        <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-[var(--admin-text3)] hover:text-[var(--admin-red)] hover:bg-[var(--admin-surface2)] rounded-lg transition-all" title="Khoá/Mở tài khoản" onClick={() => handleToggleStatus(t.id, t.fullName)}>
                        {t.subscriptionStatus === 'ACTIVE' ? <Ban className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="flex flex-col gap-6">
            <StatsBar items={[
                { label: 'Tổng', value: (stats?.totalTutors || 0).toString() },
                { label: 'Active', value: (stats?.activeTutors || 0).toString(), variant: 'green' },
                { label: 'Inactive', value: (stats?.inactiveTutors || 0).toString() },
                { label: 'Suspended', value: (stats?.suspendedTutors || 0).toString(), variant: 'red' },
                { label: 'Pro Tier', value: (stats?.proAccounts || 0).toString(), variant: 'accent' },
                { label: 'Free Tier', value: (stats?.freeAccounts || 0).toString() },
            ]} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-text3)]" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc email..."
                            className="w-full h-10 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl pl-10 pr-4 text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                        <SelectTrigger className="h-10 w-44 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] focus:ring-1 focus:ring-[var(--admin-accent-dim)] transition-all">
                            <SelectValue placeholder="Tất cả trạng thái" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                            <SelectItem value="INACTIVE">Ngừng hoạt động</SelectItem>
                            <SelectItem value="SUSPENDED">Bị khoá</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-6 py-2 bg-[var(--admin-accent)] text-[var(--admin-bg)] rounded-xl text-xs font-black shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-105 transition-all">
                    <UserPlus className="h-4 w-4" />
                    <span>THÊM GIA SƯ</span>
                </button>
            </div>

            <AdminTable
                columns={columns}
                data={tutors}
                loading={loading}
                onRowClick={handleViewTutor}
                pagination={{
                    current: page + 1,
                    total: totalElements,
                    pageSize: 10,
                    onPageChange: (p) => setPage(p - 1)
                }}
            />

            <TutorDetailDrawer
                isOpen={isDrawerOpen}
                onClose={() => {
                    setIsDrawerOpen(false);
                    fetchTutors(); // Refresh if status changed
                }}
                tutor={selectedTutor}
            />

            <AlertDialog open={suspendTutorId !== null} onOpenChange={(open) => {
                if (!open) {
                    setSuspendTutorId(null);
                    setSuspendTutorName('');
                }
            }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận thay đổi trạng thái</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn tạm khoá tài khoản <strong>{suspendTutorName}</strong>? Gia sư sẽ không thể đăng nhập tài khoản này.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex gap-2 justify-end">
                        <AlertDialogCancel onClick={() => {
                            setSuspendTutorId(null);
                            setSuspendTutorName('');
                        }}>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmToggleStatus} className="bg-[var(--admin-red)] hover:bg-[var(--admin-red)]/80">
                            Xác nhận
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            <CreateTutorModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    setPage(0);
                    fetchTutors();
                    fetchStats();
                }}
            />
        </div>
    );
}
