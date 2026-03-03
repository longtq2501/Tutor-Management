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

import { toast } from 'sonner';
import { adminAuthApi } from '@/lib/services/admin-auth';
import type { Role } from '@/lib/types/admin';
import { Shield, Loader2, Info, Lock, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
        <div className="space-y-6 pb-20">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-700 dark:text-blue-300 backdrop-blur-md shadow-premium"
            >
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                    <Info className="w-5 h-5" />
                </div>
                <div className="text-sm">
                    <p className="font-bold text-base mb-1">Lưu ý về Phân quyền</p>
                    <p className="opacity-80 leading-relaxed font-medium">
                        Các thay đổi về quyền sẽ có hiệu lực ngay lập tức đối với tất cả người dùng thuộc vai trò đó.
                        Hãy cẩn trọng khi điều chỉnh các quyền hệ thống để đảm bảo tính an toàn dữ liệu.
                    </p>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-3xl border border-premium bg-white/40 dark:bg-black/40 backdrop-blur-xl shadow-premium overflow-hidden"
            >
                <div className="p-6 border-b border-border bg-white/50 dark:bg-black/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow-sm shadow-primary/20">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tight">Ma trận Phân quyền</h2>
                            <p className="text-sm text-muted-foreground font-medium">Quản lý quyền hạn chi tiết cho từng vai trò người dùng</p>
                        </div>
                    </div>
                    {updatingRoleId && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 text-primary text-xs font-black animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ĐANG CẬP NHẬT...
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="w-[280px] sticky left-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-20 py-6 px-8 border-r">
                                    <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quyền hạn / Vai trò</span>
                                </TableHead>
                                {roles.map((role) => (
                                    <TableHead key={role.id} className="text-center min-w-[160px] py-6 px-4">
                                        <div className="flex flex-col items-center gap-2 group">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:scale-110 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <span className="font-bold text-sm">{role.name}</span>
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {availablePermissions.map((permission, idx) => (
                                    <motion.tr
                                        key={permission}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 * idx }}
                                        className="group hover:bg-primary/5 transition-colors border-b border-border/50"
                                    >
                                        <TableCell className="font-medium sticky left-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-20 py-4 px-8 border-r">
                                            <div className="flex items-center group/item">
                                                <div className="w-0 group-hover/item:w-4 overflow-hidden transition-all duration-300 text-primary">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold tracking-tight group-hover:text-primary transition-colors">{permission}</span>
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-white/20 transition-colors">
                                                                        <Info className="w-3 h-3 text-muted-foreground" />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent className="p-3 max-w-[200px] rounded-xl border-premium backdrop-blur-xl">
                                                                    <p className="text-xs font-medium leading-relaxed">
                                                                        Cho phép người dùng thực hiện các hành động liên quan đến <b className="text-primary">{permission.toLowerCase()}</b>.
                                                                    </p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        {roles.map((role) => {
                                            const isChecked = role.permissions.includes(permission);
                                            return (
                                                <TableCell key={`${role.id}-${permission}`} className="text-center p-0">
                                                    <div
                                                        className={`w-full h-full flex items-center justify-center py-4 cursor-pointer group/cell transition-all`}
                                                        onClick={() => {
                                                            if (updatingRoleId === null) {
                                                                handlePermissionToggle(role.id, permission, !isChecked);
                                                            }
                                                        }}
                                                    >
                                                        <div className={`
                                                            w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300
                                                            ${isChecked
                                                                ? 'bg-primary border-primary shadow-glow-sm shadow-primary/30 rotate-0 scale-100'
                                                                : 'border-slate-300 dark:border-white/10 bg-transparent opacity-40 group-hover/cell:opacity-100 group-hover/cell:border-primary/50'
                                                            }
                                                        `}>
                                                            {isChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            );
                                        })}
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>
            </motion.div>
        </div>
    );
};
