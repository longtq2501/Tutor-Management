import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportConfigSection } from '@/app/admin/analytics/components/ReportConfigSection';
import * as dateUtils from '@/lib/utils/date';
import { toast } from 'sonner';

// Mock the toast notifications
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock analyticsApi
vi.mock('@/lib/services', () => ({
  analyticsApi: {
    exportReport: vi.fn().mockResolvedValue({}),
  },
}));

// Mock date utilities to have predictable dates in tests
vi.spyOn(dateUtils, 'getCurrentMonth').mockReturnValue('2026-05');
vi.spyOn(dateUtils, 'generateLastNMonths').mockReturnValue([
  { value: '2026-05', label: 'Tháng 05/2026' },
  { value: '2026-04', label: 'Tháng 04/2026' },
  { value: '2026-03', label: 'Tháng 03/2026' },
]);

describe('ReportConfigSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the component with all sections', () => {
    render(<ReportConfigSection />);

    expect(screen.getByText('Cấu Hình Báo Cáo')).toBeInTheDocument();
    expect(screen.getByText('Chọn loại dữ liệu, thời gian và định dạng xuất.')).toBeInTheDocument();
  });

  it('should render report type selector with correct options', () => {
    render(<ReportConfigSection />);

    const reportTypeSelect = screen.getByRole('combobox', { name: /Loại Báo Cáo/i });
    expect(reportTypeSelect).toBeInTheDocument();
  });

  it('should render month selector', () => {
    render(<ReportConfigSection />);

    const monthSelect = screen.getByRole('combobox', { name: /Thời Gian/i });
    expect(monthSelect).toBeInTheDocument();
  });

  it('should render format buttons', () => {
    render(<ReportConfigSection />);

    const excelButton = screen.getByRole('button', { name: /Excel/i });
    const csvButton = screen.getByRole('button', { name: /CSV/i });

    expect(excelButton).toBeInTheDocument();
    expect(csvButton).toBeInTheDocument();
  });

  it('should set Excel format as default', () => {
    render(<ReportConfigSection />);

    const excelButton = screen.getByRole('button', { name: /Excel/i });
    expect(excelButton).toHaveClass('bg-primary');
  });

  it('should toggle format selection', () => {
    render(<ReportConfigSection />);

    const csvButton = screen.getByRole('button', { name: /CSV/i });
    fireEvent.click(csvButton);

    // After clicking CSV, it should have the default variant styling (bg-primary)
    expect(csvButton).toHaveClass('bg-primary');
  });

  it('should render download button', () => {
    render(<ReportConfigSection />);

    const downloadButton = screen.getByRole('button', { name: /Tải Xuống Báo Cáo/i });
    expect(downloadButton).toBeInTheDocument();
    expect(downloadButton).not.toBeDisabled();
  });

  it('should disable download button while downloading', async () => {
    render(<ReportConfigSection />);

    const downloadButton = screen.getByRole('button', { name: /Tải Xuống Báo Cáo/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(downloadButton).toBeDisabled();
    });
  });

  it('should call onDownloadStart callback', async () => {
    const onDownloadStart = vi.fn();
    render(<ReportConfigSection onDownloadStart={onDownloadStart} />);

    const downloadButton = screen.getByRole('button', { name: /Tải Xuống Báo Cáo/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(onDownloadStart).toHaveBeenCalled();
    });
  });

  it('should call onDownloadComplete callback after download', async () => {
    const onDownloadComplete = vi.fn();
    render(<ReportConfigSection onDownloadComplete={onDownloadComplete} />);

    const downloadButton = screen.getByRole('button', { name: /Tải Xuống Báo Cáo/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(onDownloadComplete).toHaveBeenCalled();
    });
  });

  it('should show success toast on successful download', async () => {
    render(<ReportConfigSection />);

    const downloadButton = screen.getByRole('button', { name: /Tải Xuống Báo Cáo/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('báo cáo tài chính'),
      );
    });
  });

  it('should show error toast on failed download', async () => {
    const { analyticsApi } = await import('@/lib/services');
    vi.mocked(analyticsApi.exportReport).mockRejectedValueOnce(new Error('Network error'));

    render(<ReportConfigSection />);

    const downloadButton = screen.getByRole('button', { name: /Tải Xuống Báo Cáo/i });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Không thể tải xuống báo cáo. Vui lòng thử lại.',
      );
    });
  });

  it('should display current month in helper text', () => {
    render(<ReportConfigSection />);

    expect(screen.getByText(/Báo cáo cho: Tháng 05\/2026/)).toBeInTheDocument();
  });

  it('should have accessible labels', () => {
    render(<ReportConfigSection />);

    expect(screen.getByLabelText(/Loại Báo Cáo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Thời Gian/)).toBeInTheDocument();

    // Format label uses aria-labelledby pattern for button group
    const formatLabel = screen.getByText('Định Dạng');
    const buttonGroup = formatLabel.nextElementSibling;
    expect(formatLabel).toHaveAttribute('id', 'format-label');
    expect(buttonGroup).toHaveAttribute('aria-labelledby', 'format-label');
  });
});
