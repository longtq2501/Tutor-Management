'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, FileSpreadsheet, Download, Loader2 } from 'lucide-react';
import { analyticsApi } from '@/lib/services';
import { generateLastNMonths, getCurrentMonth, formatMonthDisplay } from '@/lib/utils/date';
import { toast } from 'sonner';

export interface ReportConfigSectionProps {
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
}

/**
 * Report configuration section for admin analytics
 * Handles report type, date range, and format selection
 * Follows Next.js client component best practices
 */
export function ReportConfigSection({
  onDownloadStart,
  onDownloadComplete,
}: ReportConfigSectionProps) {
  const [reportType, setReportType] = useState<'finance' | 'performance'>('finance');
  const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [isDownloading, setIsDownloading] = useState(false);

  const months = generateLastNMonths(12);

  const handleDownload = useCallback(async () => {
    if (!selectedMonth) {
      toast.error('Vui lòng chọn tháng báo cáo');
      return;
    }

    try {
      setIsDownloading(true);
      onDownloadStart?.();

      await analyticsApi.exportReport(reportType, format, selectedMonth);

      toast.success(`Tải xuống ${reportType === 'finance' ? 'báo cáo tài chính' : 'báo cáo hiệu suất'} thành công`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Không thể tải xuống báo cáo. Vui lòng thử lại.');
    } finally {
      setIsDownloading(false);
      onDownloadComplete?.();
    }
  }, [reportType, format, selectedMonth, onDownloadStart, onDownloadComplete]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cấu Hình Báo Cáo</CardTitle>
        <CardDescription>Chọn loại dữ liệu, thời gian và định dạng xuất.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <label htmlFor="report-type" className="text-sm font-medium">
            Loại Báo Cáo
          </label>
          <Select value={reportType} onValueChange={(value) => setReportType(value as 'finance' | 'performance')}>
            <SelectTrigger id="report-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="finance">Báo Cáo Tài Chính (Doanh thu & Hoa hồng)</SelectItem>
              <SelectItem value="performance">Báo Cáo Hiệu Suất (Giáo viên & Học sinh)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <label htmlFor="month-select" className="text-sm font-medium">
            Thời Gian
          </label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger id="month-select">
              <SelectValue placeholder="Chọn tháng báo cáo" />
            </SelectTrigger>
            <SelectContent>
              {months.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {selectedMonth && `Báo cáo cho: ${formatMonthDisplay(selectedMonth)}`}
          </p>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label id="format-label" className="text-sm font-medium">
            Định Dạng
          </label>
          <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="format-label">
            <Button
              variant={format === 'xlsx' ? 'default' : 'outline'}
              onClick={() => setFormat('xlsx')}
              disabled={isDownloading}
              className="justify-start"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel (.xlsx)
            </Button>
            <Button
              variant={format === 'csv' ? 'default' : 'outline'}
              onClick={() => setFormat('csv')}
              disabled={isDownloading}
              className="justify-start"
            >
              <FileText className="mr-2 h-4 w-4" />
              CSV (.csv)
            </Button>
          </div>
        </div>

        {/* Download Button */}
        <Button
          className="w-full mt-4"
          size="lg"
          onClick={handleDownload}
          disabled={isDownloading}
          aria-busy={isDownloading}
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tải xuống...
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              Tải Xuống Báo Cáo
            </>
          )}
        </Button>

        {/* Info Text */}
        <p className="text-xs text-muted-foreground text-center">
          Báo cáo sẽ được tải xuống dưới dạng {format.toUpperCase()} trong vòng vài giây
        </p>
      </CardContent>
    </Card>
  );
}
