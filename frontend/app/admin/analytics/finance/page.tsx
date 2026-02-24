'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, DollarSign, Users, Percent, AlertTriangle, RefreshCw } from 'lucide-react';
import { useFinancialAnalytics } from '@/features/dashboard/admin-dashboard/hooks/useAnalytics';
import { analyticsApi } from '@/lib/services';
import { Skeleton } from '@/components/ui/skeleton';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

export default function FinanceAnalyticsPage() {
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
    const { data: stats, isLoading, isError, refetch } = useFinancialAnalytics(selectedMonth);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    const handleExport = (format: 'csv' | 'xlsx') => {
        analyticsApi.exportReport('finance', format, selectedMonth);
    };

    const tooltipFormatter = (value: unknown) => formatCurrency(Number(value));

    if (isError) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-base font-bold mb-1">Không thể tải dữ liệu tài chính</h3>
                <p className="text-sm text-muted-foreground mb-5">Kiểm tra kết nối mạng và thử lại.</p>
                <Button variant="outline" onClick={() => refetch()}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
                </Button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
                <Skeleton className="h-[400px] w-full" />
            </div>
        );
    }

    const revenueByTutor = stats?.revenueByTutor ?? [];
    // Double-cast to satisfy Recharts v3 ChartDataInput[] strict generic
    const revenueByTier = (stats?.revenueByTier ?? []) as unknown as Record<string, unknown>[];

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Phân Tích Tài Chính</h1>
                    <p className="text-muted-foreground">Theo dõi doanh thu, hoa hồng và trạng thái thanh toán.</p>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Chọn tháng" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2026-02">Tháng 02/2026</SelectItem>
                            <SelectItem value="2026-01">Tháng 01/2026</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => handleExport('xlsx')}>
                        <Download className="mr-2 h-4 w-4" /> Xuất Excel
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng Hoa Hồng</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats?.commission.totalCommission ?? 0)}</div>
                        <p className="text-xs text-muted-foreground">TB {stats?.commission.averageCommissionRate ?? 0}% mỗi giáo viên</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Đã Thanh Toán</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats?.paymentStatus.paidAmount ?? 0)}</div>
                        <p className="text-xs text-muted-foreground">{((stats?.paymentStatus.collectionRate ?? 0) * 100).toFixed(1)}% tỉ lệ thu hồi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Đang Chờ</CardTitle>
                        <DollarSign className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(stats?.paymentStatus.pendingAmount ?? 0)}</div>
                        <p className="text-xs text-muted-foreground">Chưa tất toán trong tháng</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tutors</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{revenueByTutor.length}</div>
                        <p className="text-xs text-muted-foreground">Giáo viên phát sinh doanh thu</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Doanh Thu Theo Giáo Viên</CardTitle>
                        <CardDescription>Top 10 giáo viên có doanh thu cao nhất tháng.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueByTutor}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="tutorName" />
                                <YAxis tickFormatter={(val: number) => `${val / 1000}k`} />
                                <Tooltip
                                    formatter={tooltipFormatter}
                                    labelStyle={{ color: '#000' }}
                                />
                                <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Doanh Thu" />
                                <Bar dataKey="commissionAmount" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Hoa Hồng" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Phân Bổ Theo Gói Cước</CardTitle>
                        <CardDescription>Cơ cấu doanh thu theo Premium vs Basic.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueByTier}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="totalRevenue"
                                    nameKey="tier"
                                    label={({ name, percent }: { name?: string; percent?: number }) =>
                                        `${name ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`
                                    }
                                >
                                    {revenueByTier.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={tooltipFormatter} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Chi Tiết Hoa Hồng</CardTitle>
                    <CardDescription>Danh sách chi tiết hoa hồng phải thu từ giáo viên.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Giáo viên</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Doanh Thu</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Số Buổi</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Hoa Hồng</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {revenueByTutor.map((t) => (
                                    <tr key={t.tutorId} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium text-blue-600">{t.tutorName}</td>
                                        <td className="p-4 align-middle">{formatCurrency(t.totalRevenue)}</td>
                                        <td className="p-4 align-middle">{t.sessionCount} buổi</td>
                                        <td className="p-4 align-middle text-emerald-600 font-bold">{formatCurrency(t.commissionAmount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
