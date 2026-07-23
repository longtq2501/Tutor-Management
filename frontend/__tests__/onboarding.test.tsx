import { fireEvent, render, screen, renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { TourStep } from '@/components/onboarding/TourStep';
import { TourOverlay } from '@/components/onboarding/TourOverlay';
import { useOnboarding } from '@/hooks/useOnboarding';

const mockUseAuth = vi.fn();
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));


vi.mock('@/components/onboarding/useTour', () => ({
  useTour: () => ({
    currentStep: 0,
    currentStepData: {
      id: 'welcome',
      title: 'Chào mừng',
      description: 'Mô tả test',
      position: 'center' as const,
      targetSelector: undefined,
    },
    totalSteps: 6,
    isLastStep: false,
    isFirstStep: true,
    isCompleting: false,
    nextStep: vi.fn(),
    prevStep: vi.fn(),
    finishTour: vi.fn(),
    skipTour: vi.fn(),
  }),
}));

const mockStep = {
  id: 'welcome',
  title: 'Chào mừng',
  description: 'Mô tả test',
  position: 'center' as const,
};

describe('TourStep', () => {
  it('renders title and description', () => {
    render(
      <TourStep
        step={mockStep}
        currentIndex={0}
        totalSteps={6}
        isLastStep={false}
        isFirstStep={true}
        isCompleting={false}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        onFinish={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByText('Chào mừng')).toBeInTheDocument();
    expect(screen.getByText('Mô tả test')).toBeInTheDocument();
  });

  it('shows Next button when not last step', () => {
    render(
      <TourStep
        step={mockStep}
        currentIndex={0}
        totalSteps={6}
        isLastStep={false}
        isFirstStep={true}
        isCompleting={false}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        onFinish={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Tiếp theo/i })).toBeInTheDocument();
  });

  it('shows Finish button on last step', () => {
    render(
      <TourStep
        step={mockStep}
        currentIndex={5}
        totalSteps={6}
        isLastStep={true}
        isFirstStep={false}
        isCompleting={false}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        onFinish={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Bắt đầu sử dụng/i })).toBeInTheDocument();
  });

  it('calls onSkip when skip button clicked', () => {
    const onSkip = vi.fn();

    render(
      <TourStep
        step={mockStep}
        currentIndex={0}
        totalSteps={6}
        isLastStep={false}
        isFirstStep={true}
        isCompleting={false}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        onFinish={vi.fn()}
        onSkip={onSkip}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Bỏ qua' }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('disables finish button while completing', () => {
    render(
      <TourStep
        step={mockStep}
        currentIndex={5}
        totalSteps={6}
        isLastStep={true}
        isFirstStep={false}
        isCompleting={true}
        onNext={vi.fn()}
        onPrev={vi.fn()}
        onFinish={vi.fn()}
        onSkip={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /Đang lưu/i })).toBeDisabled();
  });
});

describe('TourOverlay', () => {
  it('renders mocked first step content', () => {
    render(<TourOverlay onComplete={vi.fn()} onNavigateView={vi.fn()} />);

    expect(screen.getByText('Chào mừng')).toBeInTheDocument();
    expect(screen.getByText('Mô tả test')).toBeInTheDocument();
  });
});

describe('useOnboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not show tour if user is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
      markTourCompleted: vi.fn(),
    });

    const { result } = renderHook(() => useOnboarding());
    expect(result.current.showTour).toBe(false);
  });

  it('does not show tour if user is not TUTOR', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'STUDENT', tourCompleted: false },
      loading: false,
      markTourCompleted: vi.fn(),
    });

    const { result } = renderHook(() => useOnboarding());
    expect(result.current.showTour).toBe(false);
  });

  it('does not show tour if tourCompleted is true', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'TUTOR', tourCompleted: true },
      loading: false,
      markTourCompleted: vi.fn(),
    });

    const { result } = renderHook(() => useOnboarding());
    expect(result.current.showTour).toBe(false);
  });

  it('shows tour after 800ms delay if user is TUTOR and has not completed tour', () => {
    mockUseAuth.mockReturnValue({
      user: { role: 'TUTOR', tourCompleted: false },
      loading: false,
      markTourCompleted: vi.fn(),
    });

    const { result } = renderHook(() => useOnboarding());
    expect(result.current.showTour).toBe(false);

    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(result.current.showTour).toBe(true);
  });

  it('hides tour and marks completed when handleTourComplete is called', async () => {
    const markTourCompletedMock = vi.fn();
    mockUseAuth.mockReturnValue({
      user: { role: 'TUTOR', tourCompleted: false },
      loading: false,
      markTourCompleted: markTourCompletedMock,
    });

    const { result } = renderHook(() => useOnboarding());

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current.showTour).toBe(true);

    act(() => {
      result.current.handleTourComplete();
    });

    expect(result.current.showTour).toBe(false);
    expect(markTourCompletedMock).toHaveBeenCalledTimes(1);
  });
});

