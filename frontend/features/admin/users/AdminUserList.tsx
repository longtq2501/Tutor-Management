'use client';

import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { toast } from 'sonner';
import { adminAuthApi } from '@/lib/services/admin-auth';
import type { ManagedUser } from '@/lib/types/admin';
import { Trash2, UserCog, Mail, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const AdminUserList: React.FC = () => {
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteUserId, setDeleteUserId] = useState<number | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await adminAuthApi.getUsers();
            setUsers(response.content);
        } catch (error) {
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
        try {
            await adminAuthApi.toggleUserStatus(userId);
            setUsers(users.map(u => u.id === userId ? { ...u, enabled: !currentStatus } : u));
            toast.success('Đã cập nhật trạng thái người dùng');
        } catch (error) {
            toast.error('Không thể cập nhật trạng thái');
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteUserId) return;
        try {
            await adminAuthApi.deleteUser(deleteUserId);
            setUsers(users.filter(u => u.id !== deleteUserId));
            toast.success('Đã xóa người dùng');
        } catch (error) {
            toast.error('Không thể xóa người dùng');
        } finally {
            setDeleteUserId(null);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Người dùng</TableHead>
                        <TableHead>Vai trò</TableHead>
                        <TableHead>Ngày tham gia</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                Không tìm thấy người dùng nào
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{user.fullName}</span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Mail className="w-3 h-3" /> {user.email}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {(() => {
                                        const roleName = typeof user.role === 'string' ? user.role : user.role.name;
                                        return (
                                            <Badge variant={roleName === 'ADMIN' ? 'destructive' : 'secondary'}>
                                                {roleName}
                                            </Badge>
                                        );
                                    })()}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={user.enabled}
                                            onCheckedChange={() => handleToggleStatus(user.id, user.enabled)}
                                        />
                                        <span className={user.enabled ? 'text-green-600 text-sm' : 'text-red-600 text-sm'}>
                                            {user.enabled ? 'Hoạt động' : 'Bị khóa'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon">
                                            <UserCog className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => setDeleteUserId(user.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa người dùng?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Hành động này không thể hoàn tác. Mọi dữ liệu liên quan đến người dùng này sẽ bị ảnh hưởng.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
                            Xóa vĩnh viễn
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
