import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { ReportForm } from '@/features/reports/components/ReportForm';
import { TutorCommentBox } from '@/features/reports/components/TutorCommentBox';
import { ReportPreview } from '@/features/reports/components/ReportPreview';
import { ReportExportButtons } from '@/features/reports/components/ReportExportButtons';

vi.mock('html2canvas', () => ({
  default: vi.fn(),
}));

vi.mock('@/lib/services', () => ({
  reportApi: {
    exportPdf: vi.fn(),
  },
}));

describe('ReportForm', () => {
  it('renders student selector and month picker', () => {
    render(
      <ReportForm
        students={[{ id: 1, name: 'Nguyễn Văn A' } as any]}
        selectedStudentId={1}
        monthValue="2026-03"
        isLoading={false}
        onStudentChange={vi.fn()}
        onMonthChange={vi.fn()}
        onGenerate={vi.fn()}
      />,
    );

    expect(screen.getByText('Học sinh')).toBeInTheDocument();
    expect(screen.getByText('Tháng')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-03')).toBeInTheDocument();
  });

  it('disables export button when no data loaded', () => {
    render(<ReportExportButtons disabled={true} studentId={null} data={null} />);
    expect(screen.getByRole('button', { name: 'Export PDF' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Export PNG (ảnh)' })).toBeDisabled();
  });
});

describe('TutorCommentBox', () => {
  it('renders textarea', () => {
    render(<TutorCommentBox value="" onChange={vi.fn()} onSave={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByPlaceholderText('Nhập nhận xét tổng kết tháng...')).toBeInTheDocument();
  });

  it('shows saving indicator when typing', async () => {
    let resolveSave: (() => void) | null = null;
    const onSave = vi.fn().mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        }),
    );

    const Wrapper = () => {
      const [value, setValue] = React.useState('');
      return <TutorCommentBox value={value} onChange={setValue} onSave={onSave} />;
    };

    render(<Wrapper />);

    fireEvent.change(screen.getByPlaceholderText('Nhập nhận xét tổng kết tháng...'), {
      target: { value: 'Đang tiến bộ tốt' },
    });

    await waitFor(
      () => {
        expect(screen.getByText('Đang lưu...')).toBeInTheDocument();
      },
      { timeout: 1800 },
    );

    resolveSave?.();

    await waitFor(() => {
      expect(screen.getByText('Đã lưu ✓')).toBeInTheDocument();
    });
  });
});

describe('ReportPreview', () => {
  it('renders student name and month', () => {
    render(
      <ReportPreview
        data={{
          studentName: 'Nguyễn Văn A',
          tutorName: 'Gia sư 1',
          month: 3,
          year: 2026,
          totalSessions: 9,
          attendedSessions: 8,
          absentSessions: 1,
          attendanceRate: 88.9,
          totalAssessments: 0,
          averageScore: 7.8,
          previousMonthAvgScore: 7,
          scoreImprovement: 11.4,
          assessments: [],
          sessionFeedbacks: [],
          totalFee: 1800000,
          paidAmount: 1800000,
          remainingAmount: 0,
          paymentStatus: 'PAID',
          tutorComment: '',
        }}
      />,
    );

    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('88.9%')).toBeInTheDocument();
  });
});
