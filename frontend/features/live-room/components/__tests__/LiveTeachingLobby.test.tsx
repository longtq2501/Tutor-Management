import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LiveTeachingLobby } from '../LiveTeachingLobby';
import { useCurrentSession } from '../../hooks/useCurrentSession';
import { useUpcomingSessions } from '../../hooks/useUpcomingSessions';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock the hooks
vi.mock('../../hooks/useCurrentSession');
vi.mock('../../hooks/useUpcomingSessions');

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...(actual as object),
        Video: () => <div data-testid="icon-video" />,
        RefreshCw: () => <div data-testid="icon-refresh" />,
        CalendarDays: () => <div data-testid="icon-calendar" />,
        Clock: () => <div data-testid="icon-clock" />,
        Loader2: () => <div data-testid="icon-loader" />,
        AlertCircle: () => <div data-testid="icon-alert" />,
    };
});

// Mock SessionCard
vi.mock('../SessionCard', () => ({
    SessionCard: ({ session }: { session: { id: number; title: string; scheduledStart: string } }) => (
        <div data-testid={`session-card-${session.id}`}>
            {session.title}
        </div>
    )
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
    Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
        <button onClick={onClick} disabled={disabled} data-testid="button">
            {children}
        </button>
    )
}));

vi.mock('@/components/ui/badge', () => ({
    Badge: ({ children }: { children: React.ReactNode }) => <div data-testid="badge">{children}</div>
}));

vi.mock('@/components/ui/alert', () => ({
    Alert: ({ children }: { children: React.ReactNode }) => <div data-testid="alert">{children}</div>,
    AlertTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    AlertDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('@/components/ui/skeleton', () => ({
    Skeleton: () => <div data-testid="skeleton" />
}));

vi.mock('@/contexts/UIContext', () => ({
    useUI: () => ({
        headerPortalNode: null,
        setFooterPortalNode: vi.fn(),
        setHeaderPortalNode: vi.fn()
    }),
    DashboardHeader: ({ title, subtitle, actions }: { title: string, subtitle: string, actions?: React.ReactNode }) => (
        <div data-testid="dashboard-header">
            <h1>{title}</h1>
            <p>{subtitle}</p>
            {actions}
        </div>
    )
}));

describe('LiveTeachingLobby', () => {
    const mockOnJoin = vi.fn();
    const mockOnCreateTestRoom = vi.fn();
    const mockRefetchCurrent = vi.fn();
    const mockRefetchUpcoming = vi.fn();
    const mockFetchNextPage = vi.fn();

    const defaultProps = {
        onJoin: mockOnJoin,
        currentUserId: 1,
        isTutor: true,
        onCreateTestRoom: mockOnCreateTestRoom
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock IntersectionObserver
        const mockIntersectionObserver = vi.fn();
        mockIntersectionObserver.mockReturnValue({
            observe: () => null,
            unobserve: () => null,
            disconnect: () => null
        });
        window.IntersectionObserver = mockIntersectionObserver;

        // Default mock return values
        vi.mocked(useCurrentSession).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
            refetch: mockRefetchCurrent
        } as unknown as ReturnType<typeof useCurrentSession>);

        vi.mocked(useUpcomingSessions).mockReturnValue({
            data: { pages: [] } as unknown as ReturnType<typeof useUpcomingSessions>['data'],
            fetchNextPage: mockFetchNextPage,
            hasNextPage: false,
            isFetchingNextPage: false,
            isLoading: false,
            isError: false,
            refetch: mockRefetchUpcoming
        } as unknown as ReturnType<typeof useUpcomingSessions>);
    });

    it('renders header correctly', () => {
        render(<LiveTeachingLobby {...defaultProps} />);
        expect(screen.getByText('Sảnh chờ Lớp học')).toBeInTheDocument();
        expect(screen.getByText(/Quản lý các buổi dạy trực tuyến/)).toBeInTheDocument();
    });

    it('renders loading skeletons when retrieving data', () => {
        vi.mocked(useCurrentSession).mockReturnValue({
            data: undefined,
            isLoading: true, // Loading
            isError: false,
            refetch: mockRefetchCurrent
        } as unknown as ReturnType<typeof useCurrentSession>);

        render(<LiveTeachingLobby {...defaultProps} />);

        // Should show multiple skeletons
        const skeletons = screen.getAllByTestId('skeleton');
        expect(skeletons.length).toBeGreaterThan(0);
        expect(screen.queryByText('Đang thiết lập sảnh chờ...')).not.toBeInTheDocument(); // Old loader removed
    });

    it('renders error alert when data fetch fails', () => {
        vi.mocked(useUpcomingSessions).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true, // Error
            refetch: mockRefetchUpcoming
        } as unknown as ReturnType<typeof useUpcomingSessions>);

        render(<LiveTeachingLobby {...defaultProps} />);
        expect(screen.getByTestId('alert')).toBeInTheDocument();
        expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument();
    });

    it('renders empty state when no sessions', () => {
        render(<LiveTeachingLobby {...defaultProps} />);
        expect(screen.getByText('Hôm nay không có buổi dạy nào.')).toBeInTheDocument();
    });

    it('renders today and upcoming sessions correctly', () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const mockSessions = [
            { id: 1, title: 'Today Session', scheduledStart: today.toISOString() },
            { id: 2, title: 'Upcoming Session', scheduledStart: tomorrow.toISOString() }
        ];

        vi.mocked(useUpcomingSessions).mockReturnValue({
            data: { pages: [{ content: mockSessions }] } as unknown as ReturnType<typeof useUpcomingSessions>['data'],
            isLoading: false,
            isError: false,
            refetch: mockRefetchUpcoming
        } as unknown as ReturnType<typeof useUpcomingSessions>);

        render(<LiveTeachingLobby {...defaultProps} />);

        expect(screen.getByText('Today Session')).toBeInTheDocument();
        expect(screen.getByText('Upcoming Session')).toBeInTheDocument();
        expect(screen.getByText('Buổi học sắp tới')).toBeInTheDocument();
    });

    it('calls refetch on manual refresh', () => {
        render(<LiveTeachingLobby {...defaultProps} />);

        const refreshButton = screen.getByText('Làm mới');
        fireEvent.click(refreshButton);

        expect(mockRefetchCurrent).toHaveBeenCalled();
        expect(mockRefetchUpcoming).toHaveBeenCalled();
    });
});
