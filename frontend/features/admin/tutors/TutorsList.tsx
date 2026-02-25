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
                <div className="flex items-center gap-4 group/tutor">
                    <div className="relative">
                        {t.avatarUrl ? (
                            <img
                                src={t.avatarUrl}
                                alt={t.fullName}
                                className="w-11 h-11 rounded-xl object-cover border-2 border-border/20 shadow-glow-sm group-hover/tutor:border-primary transition-all duration-500"
                            />
                        ) : (
                            <div className="w-11 h-11 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-black text-primary text-xs shadow-glow-sm group-hover/tutor:border-primary transition-all duration-500 uppercase">
                                {t.fullName.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                        )}
                        {t.subscriptionStatus === 'ACTIVE' && (
                            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-glow-sm shadow-green-500/50" />
                        )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors duration-300 leading-none">{t.fullName}</span>
                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-60 leading-none mt-1">{t.email}</span>
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
                            ? 'bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 text-violet-500 border border-violet-500/20 shadow-glow-sm shadow-fuchsia-500/10'
                            : 'bg-slate-100 dark:bg-white/5 text-muted-foreground border border-border/50'
                        }`}>
                        {isPro && <ShieldAlert className="w-3 h-3 text-fuchsia-500" />}
                        {isPro ? 'PRO MAX' : 'BASIC'}
                    </div>
                );
            }
        },
        {
            header: 'Ngày Tham Gia',
            accessor: (t: Tutor) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-black text-foreground opacity-80">{new Date(t.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter opacity-40">Hội viên mới</span>
                </div>
            )
        },
        {
            header: 'Trạng Thái',
            accessor: (t: Tutor) => {
                const isActive = t.subscriptionStatus === 'ACTIVE';
                return (
                    <div className="flex items-center gap-2.5">
                        <div className={`w-2 h-2 rounded-full shadow-glow-sm ${isActive ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'}`} />
                        <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${isActive ? 'text-green-500' : 'text-red-500'}`}>
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
                        className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary bg-slate-100 dark:bg-white/5 hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-xl transition-all duration-300 group/btn"
                        title="Xem chi tiết"
                        onClick={() => handleViewTutor(t)}
                    >
                        <Eye className="h-4.5 w-4.5 group-hover/btn:scale-110 transition-transform" />
                    </button>
                    <button
                        className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 group/btn ${t.subscriptionStatus === 'ACTIVE'
                                ? 'text-muted-foreground hover:text-red-500 bg-slate-100 dark:bg-white/5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20'
                                : 'text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20'
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
                    className="flex items-center justify-center gap-3 px-8 py-3 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-glow-md shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all duration-300 shrink-0"
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
