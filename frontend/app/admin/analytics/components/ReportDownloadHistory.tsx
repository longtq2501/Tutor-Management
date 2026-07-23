'use client';

import { FileSpreadsheet, FileText, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface ReportHistoryItem {
  id: string;
  name: string;
  date: string;
  size: string;
  type: 'xlsx' | 'csv';
}

export interface ReportDownloadHistoryProps {
  items?: ReportHistoryItem[];
  isLoading?: boolean;
  onDownload?: (id: string) => void;
}

/**
 * Report download history section
 * Displays previous report downloads and allows re-downloading
 * TODO: Connect to real API endpoint after implementing Task 2
 */
export function ReportDownloadHistory({
  items = [],
  isLoading = false,
  onDownload,
}: ReportDownloadHistoryProps) {
  // Fallback to empty state if no items
  const hasItems = items && items.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Báo Cáo Gần Đây</CardTitle>
        <CardDescription>Lịch sử các lần xuất dữ liệu của bạn.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : hasItems ? (
          <div className="space-y-3">
            {items.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-background rounded-md flex-shrink-0">
                    {report.type === 'xlsx' ? (
                      <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <FileText className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{report.name}</p>
                    <p className="text-xs text-muted-foreground">{report.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{report.size}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDownload?.(report.id)}
                    aria-label={`Tải xuống ${report.name}`}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">Chưa có báo cáo nào</p>
            <p className="text-xs text-muted-foreground/75 mt-1">
              Những báo cáo bạn tải xuống sẽ hiển thị ở đây
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
