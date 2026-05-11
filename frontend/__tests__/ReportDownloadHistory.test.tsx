import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReportDownloadHistory, type ReportHistoryItem } from '@/app/admin/analytics/components/ReportDownloadHistory';

describe('ReportDownloadHistory Component', () => {
  const mockItems: ReportHistoryItem[] = [
    {
      id: '1',
      name: 'finance-report-2026-05.xlsx',
      date: '2 giờ trước',
      size: '24 KB',
      type: 'xlsx',
    },
    {
      id: '2',
      name: 'performance-report.csv',
      date: 'Hôm qua',
      size: '12 KB',
      type: 'csv',
    },
  ];

  it('should render component with title and description', () => {
    render(<ReportDownloadHistory items={[]} />);

    expect(screen.getByText('Báo Cáo Gần Đây')).toBeInTheDocument();
    expect(screen.getByText('Lịch sử các lần xuất dữ liệu của bạn.')).toBeInTheDocument();
  });

  it('should display empty state when no items', () => {
    render(<ReportDownloadHistory items={[]} />);

    expect(screen.getByText('Chưa có báo cáo nào')).toBeInTheDocument();
    expect(
      screen.getByText('Những báo cáo bạn tải xuống sẽ hiển thị ở đây'),
    ).toBeInTheDocument();
  });

  it('should display report items when provided', () => {
    render(<ReportDownloadHistory items={mockItems} />);

    expect(screen.getByText('finance-report-2026-05.xlsx')).toBeInTheDocument();
    expect(screen.getByText('performance-report.csv')).toBeInTheDocument();
  });

  it('should display correct information for each report', () => {
    render(<ReportDownloadHistory items={mockItems} />);

    const items = screen.getAllByRole('button');
    expect(items.length).toBeGreaterThanOrEqual(mockItems.length);

    mockItems.forEach((item) => {
      expect(screen.getByText(item.name)).toBeInTheDocument();
      expect(screen.getByText(item.date)).toBeInTheDocument();
      expect(screen.getByText(item.size)).toBeInTheDocument();
    });
  });

  it('should show loading skeleton when isLoading is true', () => {
    const { container } = render(<ReportDownloadHistory items={[]} isLoading={true} />);

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should call onDownload callback when download button is clicked', () => {
    const onDownload = vi.fn();
    render(<ReportDownloadHistory items={mockItems} onDownload={onDownload} />);

    const downloadButtons = screen.getAllByRole('button', { name: /Tải xuống/i });
    fireEvent.click(downloadButtons[0]);

    expect(onDownload).toHaveBeenCalledWith('1');
  });

  it('should display correct file type icons', () => {
    const { container } = render(<ReportDownloadHistory items={mockItems} />);

    // Check for SVG icons indicating file types
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should have accessible download buttons', () => {
    render(<ReportDownloadHistory items={mockItems} onDownload={vi.fn()} />);

    const downloadButtons = screen.getAllByRole('button', { name: /Tải xuống/i });
    expect(downloadButtons.length).toBe(mockItems.length);

    downloadButtons.forEach((button) => {
      expect(button).toHaveAttribute('aria-label');
    });
  });

  it('should handle empty string name gracefully', () => {
    const itemsWithEmpty: ReportHistoryItem[] = [
      {
        id: '1',
        name: '',
        date: '2 giờ trước',
        size: '24 KB',
        type: 'xlsx',
      },
    ];

    render(<ReportDownloadHistory items={itemsWithEmpty} />);
    // Should not crash and render the item
    expect(screen.getByText('2 giờ trước')).toBeInTheDocument();
  });

  it('should have proper responsive layout', () => {
    const { container } = render(<ReportDownloadHistory items={mockItems} />);

    const mainContent = container.querySelector('.space-y-3');
    expect(mainContent).toBeInTheDocument();
  });

  it('should truncate long file names', () => {
    const longNameItem: ReportHistoryItem[] = [
      {
        id: '1',
        name: 'this-is-a-very-long-report-name-that-should-be-truncated-when-displayed.xlsx',
        date: '2 giờ trước',
        size: '24 KB',
        type: 'xlsx',
      },
    ];

    const { container } = render(<ReportDownloadHistory items={longNameItem} />);

    const fileName = container.querySelector('.truncate');
    expect(fileName).toBeInTheDocument();
  });
});
