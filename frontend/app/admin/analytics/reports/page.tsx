'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, FileSpreadsheet, Download, Calendar } from 'lucide-react';
import { analyticsApi } from '@/lib/services';

export default function ReportsPage() {
    const [reportType, setReportType] = useState<string>('finance');
    const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx');
    const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));

    const handleDownload = () => {
        analyticsApi.exportReport(reportType as 'finance' | 'performance', format, month);
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Trung Tâm Báo Cáo</h1>
                <p className="text-muted-foreground">Xuất dữ liệu hệ thống ra các định dạng văn phòng.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Cấu Hình Báo Cáo</CardTitle>
                        <CardDescription>Chọn loại dữ liệu và định dạng bạn muốn xuất.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Loại Báo Cáo</label>
                            <Select value={reportType} onValueChange={setReportType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="finance">Báo Cáo Tài Chính (Doanh thu & Hoa hồng)</SelectItem>
                                    <SelectItem value="performance">Báo Cáo Hiệu Suất (Giáo viên & Học sinh)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Thời Gian</label>
                            <Select value={month} onValueChange={setMonth}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="2026-02">Tháng 02/2026</SelectItem>
                                    <SelectItem value="2026-01">Tháng 01/2026</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Định Dạng</label>
                            <div className="flex gap-4">
                                <Button
                                    variant={format === 'xlsx' ? 'default' : 'outline'}
                                    className="flex-1"
                                    onClick={() => setFormat('xlsx')}
                                >
                                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel (.xlsx)
                                </Button>
                                <Button
                                    variant={format === 'csv' ? 'default' : 'outline'}
                                    className="flex-1"
                                    onClick={() => setFormat('csv')}
                                >
                                    <FileText className="mr-2 h-4 w-4" /> CSV (.csv)
                                </Button>
                            </div>
                        </div>

                        <Button className="w-full mt-4" size="lg" onClick={handleDownload}>
                            <Download className="mr-2 h-5 w-5" /> Tải Xuống Báo Cáo
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Báo Cáo Gần Đây</CardTitle>
                        <CardDescription>Lịch sử các lần xuất dữ liệu của bạn.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { name: 'finance-report-2026-02.xlsx', date: '10 phút trước', size: '24 KB' },
                                { name: 'performance-report.csv', date: 'Hôm qua', size: '12 KB' },
                                { name: 'finance-report-2026-01.xlsx', date: '15/02/2026', size: '45 KB' },
                            ].map((report, i) => (
                                <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-background rounded-md">
                                            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{report.name}</p>
                                            <p className="text-xs text-muted-foreground">{report.date} • {report.size}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
