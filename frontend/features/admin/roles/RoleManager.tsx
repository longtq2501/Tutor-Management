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
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { adminAuthApi } from '@/lib/services/admin-auth';
import type { Role } from '@/lib/types/admin';
import { Shield, Loader2, Info } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export const RoleManager: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [rolesRes, permsRes] = await Promise.all([
                adminAuthApi.getAllRoles(),
                adminAuthApi.getAvailablePermissions()
            ]);
            setRoles(rolesRes);
            setAvailablePermissions(permsRes);
        } catch (error) {
            toast.error('Không thể tải dữ liệu phân quyền');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePermissionToggle = async (roleId: number, permission: string, checked: boolean) => {
        const role = roles.find(r => r.id === roleId);
        if (!role) return;

        const newPermissions = checked
            ? [...role.permissions, permission]
            : role.permissions.filter(p => p !== permission);

        try {
            setUpdatingRoleId(roleId);
            const updatedRole = await adminAuthApi.updateRolePermissions(roleId, newPermissions);
            setRoles(roles.map(r => r.id === roleId ? updatedRole : r));
            toast.success(`Đã cập nhật quyền cho vai trò ${role.name}`);
        } catch (error) {
            toast.error('Không thể cập nhật quyền');
        } finally {
            setUpdatingRoleId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p>Đang tải dữ liệu phân quyền...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-800">
                <Info className="w-5 h-5 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold">Lưu ý về Phân quyền:</p>
                    <p>Các thay đổi về quyền sẽ có hiệu lực ngay lập tức đối với tất cả người dùng thuộc vai trò đó. Hãy cẩn trọng khi điều chỉnh các quyền hệ thống.</p>
                </div>
            </div>

            <div className="rounded-md border bg-white overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px] sticky left-0 bg-white z-10">Quyền hạn \ Vai trò</TableHead>
                            {roles.map((role) => (
                                <TableHead key={role.id} className="text-center min-w-[120px]">
                                    <div className="flex flex-col items-center gap-1">
                                        <Shield className="w-4 h-4 text-primary" />
                                        <span>{role.name}</span>
                                        {updatingRoleId === role.id && <Loader2 className="w-3 h-3 animate-spin" />}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {availablePermissions.map((permission) => (
                            <TableRow key={permission}>
                                <TableCell className="font-medium sticky left-0 bg-white z-10 border-r">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm">{permission}</span>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Quyền: {permission}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </TableCell>
                                {roles.map((role) => (
                                    <TableCell key={`${role.id}-${permission}`} className="text-center">
                                        <Checkbox
                                            checked={role.permissions.includes(permission)}
                                            onCheckedChange={(checked) => handlePermissionToggle(role.id, permission, !!checked)}
                                            disabled={updatingRoleId !== null}
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};
