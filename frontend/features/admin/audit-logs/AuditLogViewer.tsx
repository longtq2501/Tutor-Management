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
import { toast } from 'sonner';
import { adminAuditApi } from '@/lib/services/admin-audit';
import type { AuditLog } from '@/lib/types/admin';
import { Shield, Clock, BookOpen, AlertCircle, CheckCircle2, XCircle, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

export const AuditLogViewer: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchLogs = async (currentPage: number) => {
        try {
            setLoading(true);
            const response = await adminAuditApi.getAuditLogs(currentPage);
            setLogs(response.content);
            setTotalPages(response.totalPages);
        } catch (error) {
            toast.error('Không thể tải nhật ký hoạt động');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(page);
    }, [page]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'SUCCESS':
                return (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 flex gap-1 items-center">
                        <CheckCircle2 className="w-3 h-3" /> Thành công
                    </Badge>
                );
            case 'FAILURE':
                return (
                    <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 flex gap-1 items-center">
                        <XCircle className="w-3 h-3" /> Thất bại
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('DELETE')) return 'text-red-600';
        if (action.includes('UPDATE') || action.includes('PUT')) return 'text-blue-600';
        if (action.includes('CREATE') || action.includes('POST')) return 'text-green-600';
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
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Tìm kiếm nhật ký..." className="pl-9" />
                </div>
            </div>

            <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Thời gian</TableHead>
                            <TableHead>Người thực hiện</TableHead>
                            <TableHead>Hành động</TableHead>
                            <TableHead>Tài nguyên</TableHead>
                            <TableHead>Trạng thái</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                    Chưa có nhật ký hoạt động nào
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => (
                                <TableRow key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(log.timestamp).toLocaleString('vi-VN')}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{log.actorEmail}</span>
                                            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground">
                                                <Shield className="w-2.5 h-2.5" /> {log.actorRole}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`text-sm font-semibold ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="font-mono text-[10px]">
                                                {log.resourceType}
                                            </Badge>
                                            {log.resourceId && (
                                                <span className="text-xs text-muted-foreground">ID: {log.resourceId}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(log.status)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                    >
                        Trước
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Trang {page + 1} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages - 1}
                        onClick={() => setPage(p => p + 1)}
                    >
                        Sau
                    </Button>
                </div>
            )}
        </div>
    );
};
