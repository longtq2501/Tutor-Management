import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TourStep } from '@/components/onboarding/TourStep';
import { TourOverlay } from '@/components/onboarding/TourOverlay';

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
    render(<TourOverlay onComplete={vi.fn()} />);

    expect(screen.getByText('Chào mừng')).toBeInTheDocument();
    expect(screen.getByText('Mô tả test')).toBeInTheDocument();
  });
});
