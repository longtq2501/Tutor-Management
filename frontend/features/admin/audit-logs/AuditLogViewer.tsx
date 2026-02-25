'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { adminAuditApi } from '@/lib/services/admin-audit';
import type { AuditLog } from '@/lib/types/admin';
import { Shield, Clock, AlertCircle, CheckCircle2, XCircle, Search, Filter, ArrowRight, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';

const ACTION_TYPES = [
    { value: 'ALL', label: 'Tất cả hành động' },
    { value: 'CREATE', label: 'Tạo mới (CREATE)' },
    { value: 'UPDATE', label: 'Cập nhật (UPDATE)' },
    { value: 'DELETE', label: 'Xóa (DELETE)' },
    { value: 'LOGIN', label: 'Đăng nhập (LOGIN)' },
];

export const AuditLogViewer: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Filter state
    const [searchInput, setSearchInput] = useState('');
    const [actionType, setActionType] = useState('ALL');
    const debouncedSearch = useDebounce(searchInput, 300);

    const fetchLogs = useCallback(async (currentPage: number) => {
        try {
            setLoading(true);
            const response = await adminAuditApi.getAuditLogs(
                currentPage,
                20,
                debouncedSearch || undefined,
                actionType !== 'ALL' ? actionType : undefined
            );
            setLogs(response.content);
            setTotalPages(response.totalPages);
        } catch {
            toast.error('Không thể tải nhật ký hoạt động');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, actionType]);

    useEffect(() => {
        setPage(0);
    }, [debouncedSearch, actionType]);

    useEffect(() => {
        fetchLogs(page);
    }, [page, fetchLogs]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                        <CheckCircle2 className="w-3 h-3" /> THÀNH CÔNG
                    </div>
                );
            case 'FAILURE':
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider">
                        <XCircle className="w-3 h-3" /> THẤT BẠI
                    </div>
                );
            default:
                return (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-muted-foreground text-[10px] font-black uppercase tracking-wider">
                        {status}
                    </div>
                );
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'text-red-600';
        if (action.includes('UPDATE') || action.includes('PUT')) return 'text-blue-600';
        if (action.includes('CREATE') || action.includes('POST')) return 'text-green-600';
        if (action.includes('LOGIN')) return 'text-purple-600';
        return 'text-foreground';
    };

    if (loading && logs.length === 0) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header & Stats (Placeholder for future stats) */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-glow-sm shadow-primary/20">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Nhật ký Hoạt động</h2>
                        <p className="text-sm text-muted-foreground font-medium">Theo dõi và giám sát mọi thay đổi trên hệ thống</p>
                    </div>
                </div>
            </motion.div>

            {/* Filter Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass p-4 rounded-[2rem] border-premium shadow-premium flex flex-col sm:flex-row gap-3 items-center"
            >
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm theo email, tài nguyên hoặc hành động..."
                        className="pl-11 h-12 bg-white/50 dark:bg-black/20 border-border/50 rounded-2xl md:min-w-[400px]"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>

                <div className="flex w-full sm:w-auto gap-2">
                    <Select value={actionType} onValueChange={setActionType}>
                        <SelectTrigger className="h-12 w-full sm:w-52 bg-white/50 dark:bg-black/20 border-border/50 rounded-2xl font-bold">
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-primary" />
                                <SelectValue placeholder="Loại hành động" />
                            </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-premium backdrop-blur-xl">
                            {ACTION_TYPES.map((at) => (
                                <SelectItem key={at.value} value={at.value} className="font-medium rounded-xl">
                                    {at.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-2xl border-border/50 bg-white/50 dark:bg-black/20 hover:bg-primary/5 hover:text-primary transition-all"
                        onClick={() => fetchLogs(page)}
                    >
                        <Clock className="w-4 h-4" />
                    </Button>
                </div>
            </motion.div>

            {/* Table Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-3xl border border-premium bg-white/40 dark:bg-black/40 backdrop-blur-xl shadow-premium overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-none">
                                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground border-r">Thời gian</TableHead>
                                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground border-r">Người thực hiện</TableHead>
                                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground border-r">Hành động</TableHead>
                                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground border-r">Tài nguyên</TableHead>
                                <TableHead className="py-6 px-8 text-xs font-black uppercase tracking-widest text-muted-foreground">Trạng thái</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    Array.from({ length: 10 }).map((_, i) => (
                                        <TableRow key={i} className="border-b border-border/30">
                                            {Array.from({ length: 5 }).map((__, j) => (
                                                <TableCell key={j} className="py-8 px-8"><Skeleton className="h-4 w-full rounded-full" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : logs.length === 0 ? (
                                    <TableRow className="border-none">
                                        <TableCell colSpan={5} className="py-32 text-center">
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="flex flex-col items-center gap-4"
                                            >
                                                <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-muted-foreground/30">
                                                    <AlertCircle className="w-10 h-10" />
                                                </div>
                                                <div>
                                                    <p className="text-xl font-bold tracking-tight">Không tìm thấy kết quả</p>
                                                    <p className="text-muted-foreground font-medium mt-1">
                                                        {debouncedSearch || actionType !== 'ALL'
                                                            ? 'Hãy thử thay đổi từ khóa hoặc bộ lọc'
                                                            : 'Hệ thống chưa ghi nhận hoạt động nào'
                                                        }
                                                    </p>
                                                </div>
                                            </motion.div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.map((log, idx) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.03 * idx }}
                                            className="group hover:bg-primary/5 transition-colors border-b border-border/30"
                                        >
                                            <TableCell className="py-5 px-8 whitespace-nowrap border-r border-border/30">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-foreground">
                                                        {new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground group-hover:text-primary/70 transition-colors">
                                                        {new Date(log.timestamp).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 px-8 border-r border-border/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-muted-foreground ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm group-hover:text-primary transition-colors">{log.actorEmail}</span>
                                                        <div className="flex items-center gap-1 text-[9px] uppercase font-black text-muted-foreground/60 tracking-tighter">
                                                            <Shield className="w-2.5 h-2.5" /> <span>{log.actorRole}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 px-8 border-r border-border/30">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-black tracking-tight ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                    <div className="w-0 group-hover:w-4 overflow-hidden transition-all duration-300 text-muted-foreground/30">
                                                        <ArrowRight className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 px-8 border-r border-border/30">
                                                <div className="flex items-center gap-3">
                                                    <div className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-border/50 font-mono text-[10px] font-bold text-muted-foreground">
                                                        {log.resourceType}
                                                    </div>
                                                    {log.resourceId && (
                                                        <span className="text-[11px] font-black text-muted-foreground/40 bg-slate-50 dark:bg-white/[0.02] px-1.5 py-0.5 rounded border border-border/30">
                                                            #{log.resourceId}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-5 px-8">
                                                {getStatusBadge(log.status)}
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-6 border-t border-border/30 bg-white/50 dark:bg-black/20 backdrop-blur-md flex justify-between items-center">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Trang <span className="text-foreground">{page + 1}</span> / {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="h-10 px-6 rounded-xl border-border/50 font-bold hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-30"
                                disabled={page === 0 || loading}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Trước
                            </Button>
                            <Button
                                variant="outline"
                                className="h-10 px-6 rounded-xl border-border/50 font-bold hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-30"
                                disabled={page === totalPages - 1 || loading}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
