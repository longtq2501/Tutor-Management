'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ReportExportButtons } from '@/features/reports/components/ReportExportButtons';
import { ReportForm } from '@/features/reports/components/ReportForm';
import { ReportPreview } from '@/features/reports/components/ReportPreview';
import { SessionFeedbackList } from '@/features/reports/components/SessionFeedbackList';
import { TutorCommentBox } from '@/features/reports/components/TutorCommentBox';
import { reportApi, studentsApi } from '@/lib/services';
import type { MonthlyReportData, Student } from '@/lib/types';
import { DashboardHeader } from '@/contexts/UIContext';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

function parseMonthValue(monthValue: string): { month: number; year: number } {
  const [year, month] = monthValue.split('-').map(Number);
  return { month, year };
}

function getCurrentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export default function ReportsFeature() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [monthValue, setMonthValue] = useState(getCurrentMonthValue());
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [comment, setComment] = useState('');

  const loadStudents = useCallback(async () => {
    if (studentsLoaded) return;
    try {
      const response = await studentsApi.getAll(0, 200);
      setStudents(response.content || []);
      setSelectedStudentId((prev) => prev ?? response.content?.[0]?.id ?? null);
      setStudentsLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error('Không thể tải danh sách học sinh');
    }
  }, [studentsLoaded]);

  const generateReport = useCallback(async () => {
    if (!selectedStudentId || !monthValue) return;

    const { month, year } = parseMonthValue(monthValue);
    setLoadingReport(true);
    try {
      const data = await reportApi.getMonthlyReportData(selectedStudentId, month, year);
      setReportData(data);
      setComment(data.tutorComment || '');
    } catch (error) {
      console.error(error);
      toast.error('Không thể tạo báo cáo');
    } finally {
      setLoadingReport(false);
    }
  }, [monthValue, selectedStudentId]);

  const handleSaveComment = useCallback(
    async (value: string) => {
      if (!selectedStudentId) return;
      const { month, year } = parseMonthValue(monthValue);
      await reportApi.saveComment({
        studentId: selectedStudentId,
        month,
        year,
        comment: value,
      });
      setReportData((prev) => (prev ? { ...prev, tutorComment: value } : prev));
    },
    [monthValue, selectedStudentId],
  );

  const previewData = useMemo(() => {
    if (!reportData) return null;
    return {
      ...reportData,
      tutorComment: comment,
    };
  }, [comment, reportData]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  return (
    <div className="space-y-4">
      <DashboardHeader
        title="Báo Cáo"
        subtitle="Tạo và xuất báo cáo tiến độ học sinh theo tháng."
      />

      <Card>
        <CardContent className="space-y-4">
          <div data-tour="reports-form">
            <ReportForm
              students={students}
              selectedStudentId={selectedStudentId}
              monthValue={monthValue}
              isLoading={loadingReport}
              onStudentChange={setSelectedStudentId}
              onMonthChange={setMonthValue}
              onGenerate={generateReport}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              {previewData ? (
                <div data-tour="reports-preview">
                  <ReportPreview data={previewData} />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Chọn học sinh và tháng, sau đó bấm "Tạo báo cáo" để xem preview.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div data-tour="reports-comment">
                <TutorCommentBox
                  key={`${selectedStudentId ?? 'none'}-${monthValue}`}
                  value={comment}
                  disabled={!previewData}
                  onChange={setComment}
                  onSave={handleSaveComment}
                />
              </div>

              <SessionFeedbackList feedbacks={previewData?.sessionFeedbacks || []} />
            </div>
          </div>

          <div data-tour="reports-export-actions">
            <ReportExportButtons
              disabled={!previewData || !selectedStudentId}
              studentId={selectedStudentId}
              data={previewData}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
