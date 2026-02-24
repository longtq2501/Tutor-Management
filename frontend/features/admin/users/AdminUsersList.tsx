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
    ROLE_ADMIN: { label: 'Admin', className: 'text-purple-600 border-purple-200 bg-purple-50' },
    ROLE_TUTOR: { label: 'Gia sư', className: 'text-blue-600 border-blue-200 bg-blue-50' },
    ROLE_STUDENT: { label: 'Học sinh', className: 'text-green-600 border-green-200 bg-green-50' },
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
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{u.fullName}</span>
                    <span className="text-xs text-[var(--admin-text3)]">{u.email}</span>
                </div>
            ),
        },
        {
            header: 'Vai trò',
            accessor: (u) => {
                const meta = ROLE_LABELS[u.role] ?? { label: u.role, className: 'text-gray-600' };
                return (
                    <Badge variant="outline" className={`text-xs ${meta.className}`}>
                        {meta.label}
                    </Badge>
                );
            },
        },
        {
            header: 'Trạng thái',
            accessor: (u) => (
                <Badge
                    variant="outline"
                    className={u.enabled
                        ? 'text-green-600 border-green-200 bg-green-50'
                        : 'text-red-600 border-red-200 bg-red-50'
                    }
                >
                    {u.enabled ? 'Hoạt động' : 'Vô hiệu'}
                </Badge>
            ),
        },
        {
            header: 'Ngày tạo',
            accessor: (u) => (
                <span className="text-sm text-[var(--admin-text3)]">
                    {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                </span>
            ),
        },
        {
            header: 'Hành động',
            accessor: (u) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(u); }}
                        aria-label={`${u.enabled ? 'Vô hiệu hóa' : 'Kích hoạt'} ${u.fullName}`}
                        className={u.enabled
                            ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        }
                    >
                        {u.enabled ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(u); }}
                        aria-label={`Xóa tài khoản ${u.fullName}`}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <>
            {/* Search Bar */}
            <div className="mb-4 relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--admin-text3)]" />
                <input
                    type="text"
                    placeholder="Tìm theo tên hoặc email..."
                    className="w-full h-10 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl pl-9 pr-4 text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />
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
