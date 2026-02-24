'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { usePerformanceAnalytics } from '@/features/dashboard/admin-dashboard/hooks/useAnalytics';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, TrendingUp, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function PerformanceAnalyticsPage() {
    const { data: stats, isLoading, isError, refetch } = usePerformanceAnalytics();

    const tutorRankings = stats?.tutorRankings ?? [];

    if (isError) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-[50vh] text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-base font-bold mb-1">Không thể tải dữ liệu hiệu suất</h3>
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
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
                <Skeleton className="h-[500px] w-full" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hiệu Suất &amp; Tăng Trưởng</h1>
                    <p className="text-muted-foreground">Đánh giá chất lượng giảng dạy và tỉ lệ giữ chân học sinh.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Hài Lòng Trung Bình</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4.8 / 5.0</div>
                        <p className="text-xs text-muted-foreground">+0.2 so với tháng trước</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tỷ Lệ Hoàn Thành</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{((stats?.attendance.globalCompletionRate ?? 0) * 100).toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">{stats?.attendance.totalCompleted ?? 0} buổi học thành công</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tăng Trưởng Thuần</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+{stats?.growth.newStudents ?? 0} mới</div>
                        <p className="text-xs text-muted-foreground">{stats?.growth.lostStudents ?? 0} học sinh rời bỏ (Churn)</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Bảng Xếp Hạng Giáo Viên</CardTitle>
                        <CardDescription>Dựa trên điểm đánh giá trung bình và sự chuyên cần.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tutorRankings} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" domain={[0, 5]} />
                                <YAxis dataKey="tutorName" type="category" width={100} />
                                <Tooltip />
                                <Bar dataKey="averageRating" fill="#f59e0b" name="Điểm Đánh Giá" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Phân Tích Churn</CardTitle>
                        <CardDescription>Tỉ lệ học sinh nghỉ học theo tháng.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center h-[400px]">
                        <div className="text-center space-y-4">
                            <div className="relative h-40 w-40 flex items-center justify-center rounded-full border-8 border-muted border-b-red-500">
                                <span className="text-3xl font-bold">
                                    {((stats?.growth.netGrowthRate ?? 0) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium">Tỉ lệ giữ chân cao</p>
                                <p className="text-sm text-muted-foreground">Bạn đã giữ được 98% học sinh trong tháng này.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Chi Tiết Hiệu Suất Từng Giáo Viên</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Giáo viên</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Đánh giá</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tỉ lệ hoàn thành</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Số học sinh</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tutorRankings.map((t) => (
                                    <tr key={t.tutorId} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{t.tutorName}</td>
                                        <td className="p-4 align-middle">
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                <span>{t.averageRating.toFixed(1)}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-middle">{(t.completionRate * 100).toFixed(0)}%</td>
                                        <td className="p-4 align-middle">{t.studentCount} học sinh</td>
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
