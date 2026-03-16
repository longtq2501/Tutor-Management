'use client';

import { useState, useEffect } from 'react';
import { Ban, Edit2, Eye, Search, UserPlus, ShieldAlert } from 'lucide-react';
import { StatsBar } from '@/components/admin/StatsBar';
import { AdminTable } from '@/components/admin/AdminTable';
import { TutorDetailDrawer } from './TutorDetailDrawer';
import { CreateTutorModal } from './CreateTutorModal';
import { OptimizedAvatar } from '@/features/students/unified-view/components/OptimizedAvatar';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
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
                <div className="flex items-center gap-4 group/tutor">
                    <OptimizedAvatar
                        name={t.fullName}
                        avatarUrl={t.avatarUrl}
                        isActive={t.subscriptionStatus === 'ACTIVE'}
                        className="w-11 h-11 rounded-xl"
                    />
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-black text-foreground group-hover:text-[var(--admin-accent)] transition-colors duration-300 leading-none">{t.fullName}</span>
                        <span className="text-[11px] font-black text-[var(--admin-text2)] uppercase tracking-widest opacity-60 leading-none mt-1">{t.email}</span>
                    </div>
                </div>
            ),
            sortable: true
        },
        {
            header: 'Số ĐT',
            accessor: (t: Tutor) => (
                <span className="text-sm font-bold text-foreground tabular-nums opacity-80">{t.phone}</span>
            ),
            sortable: false
        },
        {
            header: 'Gói Cước',
            accessor: (t: Tutor) => {
                const isPro = t.subscriptionPlan === 'PREMIUM';
                return (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-500 ${isPro
                            ? 'bg-[var(--admin-accent)]/10 text-[var(--admin-accent)] border border-[var(--admin-accent)]/20 shadow-glow-sm shadow-[var(--admin-accent)]/10'
                            : 'bg-muted/50 text-[var(--admin-text2)] border border-border/50'
                        }`}>
                        {isPro && <ShieldAlert className="w-3 h-3 text-[var(--admin-accent)]" />}
                        {isPro ? 'PRO MAX' : 'BASIC'}
                    </div>
                );
            }
        },
        {
            header: 'Ngày Tham Gia',
            accessor: (t: Tutor) => {
                const date = t.createdAt ? new Date(t.createdAt) : null;
                return (
                    <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-black text-foreground opacity-80">
                            {date && !isNaN(date.getTime()) ? format(date, 'dd/MM/yyyy', { locale: vi }) : 'N/A'}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--admin-text3)] uppercase tracking-tighter opacity-40">Hội viên mới</span>
                    </div>
                );
            }
        },
        {
            header: 'Trạng Thái',
            accessor: (t: Tutor) => {
                const isActive = t.subscriptionStatus === 'ACTIVE';
                return (
                    <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full shadow-glow-sm ${isActive ? 'bg-[var(--admin-green)] shadow-[var(--admin-green)]/50' : 'bg-[var(--admin-red)] shadow-[var(--admin-red)]/50'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-[var(--admin-green)]' : 'text-[var(--admin-red)]'}`}>
                            {isActive ? 'Hoạt động' : 'Tạm khóa'}
                        </span>
                    </div>
                );
            }
        },
        {
            header: 'Actions',
            className: 'text-right',
            accessor: (t: Tutor) => (
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="w-10 h-10 flex items-center justify-center text-[var(--admin-text2)] hover:text-[var(--admin-accent)] bg-[var(--admin-surface2)] hover:bg-[var(--admin-accent-dim)] border border-transparent hover:border-[var(--admin-accent)]/20 rounded-xl transition-all duration-300 group/btn"
                        title="Xem chi tiết"
                        onClick={() => handleViewTutor(t)}
                    >
                        <Eye className="h-4.5 w-4.5 group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 group/btn ${t.subscriptionStatus === 'ACTIVE'
                                ? 'text-[var(--admin-text2)] hover:text-[var(--admin-red)] bg-[var(--admin-surface2)] hover:bg-[var(--admin-red)]/10 border border-transparent hover:border-[var(--admin-red)]/20'
                                : 'text-[var(--admin-red)] bg-[var(--admin-red)]/10 border border-[var(--admin-red)]/20 hover:bg-[var(--admin-red)]/20 shadow-glow-sm shadow-[var(--admin-red)]/20'
                            }`}
                        title={t.subscriptionStatus === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        onClick={() => handleToggleStatus(t.id, t.fullName)}
                    >
                        {t.subscriptionStatus === 'ACTIVE' ? <Ban className="h-4.5 w-4.5 group-hover/btn:scale-110 transition-transform" /> : <ShieldAlert className="h-4.5 w-4.5 group-hover/btn:scale-110 transition-transform" />}
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

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-xl p-6 bg-white/40 dark:bg-black/40 border-premium rounded-[2.5rem] shadow-premium">
                <div className="flex items-center gap-4 flex-1 max-w-2xl">
                    <div className="relative flex-1 group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                            <Search className="h-4.5 w-4.5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc email..."
                            className="w-full h-12 bg-white/50 dark:bg-white/5 border border-border/50 rounded-2xl pl-12 pr-6 text-sm font-bold text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="w-px h-8 bg-border/50 hidden md:block" />

                    <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
                        <SelectTrigger className="h-12 w-48 bg-white/50 dark:bg-white/5 border border-border/50 rounded-2xl text-[11px] font-black uppercase tracking-widest text-foreground focus:ring-4 focus:ring-primary/5 transition-all outline-none">
                            <SelectValue placeholder="Tất cả trạng thái" />
                        </SelectTrigger>
                        <SelectContent className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-premium">
                            <SelectItem value="all" className="text-[11px] font-black uppercase tracking-widest py-3">Tất cả trạng thái</SelectItem>
                            <SelectItem value="ACTIVE" className="text-[11px] font-black uppercase tracking-widest py-3 text-green-500">Hoạt động</SelectItem>
                            <SelectItem value="INACTIVE" className="text-[11px] font-black uppercase tracking-widest py-3 text-muted-foreground">Ngừng hoạt động</SelectItem>
                            <SelectItem value="SUSPENDED" className="text-[11px] font-black uppercase tracking-widest py-3 text-red-500">Bị khoá</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="h-px w-full bg-border/30 md:hidden" />

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center justify-center gap-3 px-8 py-3 bg-[var(--admin-accent)] text-[var(--admin-bg)] rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-glow-md shadow-[var(--admin-accent)]/30 hover:scale-[1.03] active:scale-95 transition-all duration-300 shrink-0"
                >
                    <UserPlus className="h-4.5 w-4.5" />
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
