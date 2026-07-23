'use client';

import { useState, useCallback } from 'react';
import { ReportConfigSection } from '../components/ReportConfigSection';
import { ReportDownloadHistory, type ReportHistoryItem } from '../components/ReportDownloadHistory';

/**
 * Admin Reports Page
 * Centralized report generation and download management for system analytics
 * Handles: Financial reports, Performance reports, and download history
 *
 * Standards compliance:
 * - Client component ('use client') for interactivity
 * - Error boundaries via toast notifications
 * - Loading states for async operations
 * - Type-safe component props
 */
export default function ReportsPage() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [reportHistory, setReportHistory] = useState<ReportHistoryItem[]>([]);

  const handleDownloadStart = useCallback(() => {
    setIsDownloading(true);
  }, []);

  const handleDownloadComplete = useCallback(() => {
    setIsDownloading(false);
    // TODO: Fetch updated history after successful download (Task 2)
    // const history = await reportApi.getHistory();
    // setReportHistory(history);
  }, []);

  const handleReDownload = useCallback((id: string) => {
    // TODO: Implement re-download functionality (Task 2)
    console.log('Re-download report:', id);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trung Tâm Báo Cáo</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý, xuất dữ liệu hệ thống và xem lịch sử báo cáo của bạn.
          </p>
        </div>

        {/* Report Config and History Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Config Section - Takes 2/3 on large screens */}
          <div className="lg:col-span-2">
            <ReportConfigSection
              onDownloadStart={handleDownloadStart}
              onDownloadComplete={handleDownloadComplete}
            />
          </div>

          {/* History Section - Takes 1/3 on large screens */}
          <div className="lg:col-span-1">
            <ReportDownloadHistory
              items={reportHistory}
              isLoading={isDownloading}
              onDownload={handleReDownload}
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <div className="p-4 rounded-lg border bg-muted/30">
            <h3 className="font-semibold text-sm mb-2">Báo Cáo Tài Chính</h3>
            <p className="text-sm text-muted-foreground">
              Doanh thu toàn hệ thống, hoa hồng giáo viên, và phân tích tài chính chi tiết theo tutor.
            </p>
          </div>
          <div className="p-4 rounded-lg border bg-muted/30">
            <h3 className="font-semibold text-sm mb-2">Báo Cáo Hiệu Suất</h3>
            <p className="text-sm text-muted-foreground">
              Đánh giá học sinh, tỷ lệ hoàn thành, xếp hạng giáo viên, và các chỉ số hiệu suất khác.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
