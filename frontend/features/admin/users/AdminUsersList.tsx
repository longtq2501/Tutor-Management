'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminAuthApi } from '@/lib/services/admin-auth';
import type { ManagedUser } from '@/lib/types/admin';
import { AdminTable, type Column } from '@/components/admin/AdminTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, UserX, UserCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';

const PAGE_SIZE = 10;

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
    ROLE_ADMIN: { label: 'Admin', className: 'text-purple-500 !bg-purple-500/5 !border-purple-500/20' },
    ROLE_TUTOR: { label: 'Gia sư', className: 'text-blue-500 !bg-blue-500/5 !border-blue-500/20' },
    ROLE_STUDENT: { label: 'Học sinh', className: 'text-green-500 !bg-green-500/5 !border-green-500/20' },
};

export function AdminUsersList() {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1); // 1-indexed for AdminTable
    const [totalElements, setTotalElements] = useState(0);
    const [searchInput, setSearchInput] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);

    const debouncedSearch = useDebounce(searchInput, 300);

    const fetchUsers = useCallback(async (currentPage: number) => {
        try {
            setLoading(true);
            const response = await adminAuthApi.getUsers(currentPage - 1, PAGE_SIZE); // API is 0-indexed
            setUsers(response.content);
            setTotalElements(response.totalElements);
        } catch {
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers(page);
    }, [page, fetchUsers]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const handleToggleStatus = async (user: ManagedUser) => {
        try {
            await adminAuthApi.toggleUserStatus(user.id);
            setUsers(prev => prev.map(u =>
                u.id === user.id ? { ...u, enabled: !u.enabled } : u
            ));
            toast.success(`Đã ${user.enabled ? 'vô hiệu hóa' : 'kích hoạt'} tài khoản ${user.fullName}`);
        } catch {
            toast.error('Không thể thay đổi trạng thái tài khoản');
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await adminAuthApi.deleteUser(deleteTarget.id);
            setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
            setTotalElements(prev => prev - 1);
            toast.success(`Đã xóa tài khoản ${deleteTarget.fullName}`);
        } catch {
            toast.error('Không thể xóa tài khoản');
        } finally {
            setDeleteTarget(null);
        }
    };

    const filteredUsers = debouncedSearch
        ? users.filter(u =>
            u.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
        : users;

    const columns: Column<ManagedUser>[] = [
        {
            header: 'Người dùng',
            accessor: (u) => (
                <div className="flex items-center gap-4 group/user">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-black text-primary text-xs shadow-glow-sm group-hover/user:border-primary transition-all duration-500">
                        {u.fullName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors duration-300 mr-2">{u.fullName}</span>
                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-widest opacity-60">{u.email}</span>
                    </div>
                </div>
            ),
        },
        {
            header: 'Vai trò',
            accessor: (u) => {
                const roleName = typeof u.role === 'object' && u.role !== null
                    ? (u.role as { name: string }).name
                    : (u.role as string);

                const meta = ROLE_LABELS[roleName] ?? { label: roleName, className: 'text-slate-600 border-slate-200 bg-slate-50' };

                return (
                    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-current/20 bg-current/5 ${meta.className}`}>
                        {meta.label}
                    </div>
                );
            },
        },
        {
            header: 'Trạng thái',
            accessor: (u) => (
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${u.enabled
                        ? 'text-green-500 border-green-500/20 bg-green-500/5'
                        : 'text-red-500 border-red-500/20 bg-red-500/5'
                    }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${u.enabled ? 'bg-green-500 shadow-glow-sm shadow-green-500' : 'bg-red-500 shadow-glow-sm shadow-red-500'}`} />
                    {u.enabled ? 'Hoạt động' : 'Vô hiệu'}
                </div>
            ),
        },
        {
            header: 'Ngày tạo',
            accessor: (u) => (
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-black text-foreground opacity-80">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter opacity-40">Thành viên hệ thống</span>
                </div>
            ),
        },
        {
            header: 'Hành động',
            className: 'text-right',
            accessor: (u) => (
                <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => handleToggleStatus(u)}
                        title={u.enabled ? 'Vô hiệu hóa' : 'Kích hoạt'}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300 group/btn ${u.enabled
                                ? 'text-amber-500 bg-amber-500/10 border border-transparent hover:border-amber-500/20'
                                : 'text-green-500 bg-green-500/10 border border-transparent hover:border-green-500/20'
                            }`}
                    >
                        {u.enabled ? <UserX className="h-4 w-4 group-hover/btn:scale-110 transition-transform" /> : <UserCheck className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />}
                    </button>
                    <button
                        onClick={() => setDeleteTarget(u)}
                        title="Xóa tài khoản"
                        className="w-9 h-9 flex items-center justify-center text-red-500 bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all duration-300 group/btn"
                    >
                        <Trash2 className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <>
            {/* Search Bar */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-xl p-6 bg-white/40 dark:bg-black/40 border-premium rounded-[2.5rem] shadow-premium">
                <div className="relative flex-1 max-w-md group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                        <Search className="h-4.5 w-4.5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm theo tên hoặc email..."
                        className="w-full h-12 bg-white/50 dark:bg-white/5 border border-border/50 rounded-2xl pl-12 pr-6 text-sm font-bold text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                        {users.slice(0, 5).map((u, i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">
                                {u.fullName[0]}
                            </div>
                        ))}
                        {users.length > 5 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-black text-muted-foreground">
                                +{users.length - 5}
                            </div>
                        )}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Tổng {totalElements} người dùng</span>
                </div>
            </div>

            <AdminTable
                columns={columns}
                data={filteredUsers}
                loading={loading}
                emptyState={{
                    title: debouncedSearch ? 'Không tìm thấy người dùng' : 'Chưa có người dùng',
                    description: debouncedSearch
                        ? `Không có kết quả cho "${debouncedSearch}"`
                        : 'Chưa có tài khoản nào trong hệ thống.',
                }}
                pagination={
                    totalElements > PAGE_SIZE
                        ? { current: page, total: totalElements, pageSize: PAGE_SIZE, onPageChange: setPage }
                        : undefined
                }
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa tài khoản</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn xóa tài khoản <strong>{deleteTarget?.fullName}</strong>? Hành động này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
