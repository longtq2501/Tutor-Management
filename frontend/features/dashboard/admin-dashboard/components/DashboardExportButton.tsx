'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { dashboardApi } from '@/lib/services/dashboard';

interface DashboardExportButtonProps {
    currentMonth?: string;
    filename?: string;
}

export function DashboardExportButton({ currentMonth, filename = 'bao-cao-he-thong.pdf' }: DashboardExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const handleExport = async () => {
        setIsExporting(true);
        toast.info('Đang yêu cầu hệ thống tạo bản báo cáo PDF...');

        try {
            const blob = await dashboardApi.exportPdf(currentMonth);

            // Create a link and trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            // Clean up
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Xuất báo cáo PDF thành công!');
        } catch (error: unknown) {
            console.error('Export error:', error);
            const message = error instanceof Error ? error.message : 'Lỗi không xác định';
            toast.error(`Lỗi xuất PDF từ hệ thống: ${message}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Button
            onClick={handleExport}
            disabled={isExporting}
            variant="outline"
            className="gap-2 border-primary/20 hover:border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary transition-all duration-300"
        >
            {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <FileDown className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Xuất Báo Cáo</span>
            <span className="sm:hidden">Xuất</span>
        </Button>
    );
}
