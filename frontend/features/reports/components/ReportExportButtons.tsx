'use client';

import { Button } from '@/components/ui/button';
import { reportApi } from '@/lib/services';
import type { MonthlyReportData } from '@/lib/types';
import html2canvas from 'html2canvas';
import { toBlob as toBlobFromHtml } from 'html-to-image';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface ReportExportButtonsProps {
  disabled: boolean;
  studentId: number | null;
  data: MonthlyReportData | null;
}

export function ReportExportButtons({ disabled, studentId, data }: ReportExportButtonsProps) {
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPng, setExportingPng] = useState(false);

  const fileBaseName = useMemo(() => {
    if (!data) return 'BaoCao';
    const studentName = (data.studentName || 'HocSinh')
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-zA-Z0-9\s_-]/g, '')
      .trim()
      .replace(/\s+/g, '_');
    return `BaoCao_${studentName || 'HocSinh'}_T${data.month}_${data.year}`;
  }, [data]);

  const handleExportPdf = async () => {
    if (!data || !studentId) return;

    setExportingPdf(true);
    try {
      const blob = await reportApi.exportPdf(studentId, data.month, data.year);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${fileBaseName}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('Xuất PDF thành công');
    } catch (error) {
      console.error(error);
      toast.error('Xuất PDF thất bại');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportPng = async () => {
    const reportEl = document.getElementById('report-preview');
    if (!reportEl || !data) return;

    setExportingPng(true);
    try {
      let blob = await toBlobFromHtml(reportEl, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        style: {
          backgroundColor: '#ffffff',
          color: '#111827',
        },
      });

      if (!blob) {
        const canvas = await html2canvas(reportEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          removeContainer: true,
          imageTimeout: 0,
          backgroundColor: '#ffffff',
          foreignObjectRendering: true,
          onclone: (_doc, clonedRoot) => {
            if (clonedRoot instanceof HTMLElement) {
              clonedRoot.style.backgroundColor = '#ffffff';
              clonedRoot.style.color = '#111827';
            }
          },
        });

        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((result) => {
            if (result) {
              resolve(result);
              return;
            }
            reject(new Error('Không tạo được ảnh PNG'));
          }, 'image/png');
        });
      }

      const url = URL.createObjectURL(blob);
      try {
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${fileBaseName}.png`;
        anchor.click();
      } finally {
        URL.revokeObjectURL(url);
      }

      toast.success('Xuất PNG thành công');
    } catch (error) {
      console.error(error);
      toast.error('Xuất PNG thất bại');
    } finally {
      setExportingPng(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={handleExportPdf} disabled={disabled || exportingPdf || exportingPng}>
        {exportingPdf ? 'Đang xuất PDF...' : 'Export PDF'}
      </Button>
      <Button variant="outline" onClick={handleExportPng} disabled={disabled || exportingPng || exportingPdf}>
        {exportingPng ? 'Đang xuất PNG...' : 'Export PNG (ảnh)'}
      </Button>
    </div>
  );
}
