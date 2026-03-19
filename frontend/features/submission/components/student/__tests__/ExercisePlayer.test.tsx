/// <reference types="vitest" />
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { ExercisePlayer } from '../ExercisePlayer';
import { exerciseService } from '@/features/exercise-import/services/exerciseService';
import { submissionService } from '@/features/submission/services/submissionService';
import { Exercise, QuestionType } from '@/features/exercise-import/types/exercise.types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// mocks of services
vi.mock('@/features/exercise-import/services/exerciseService');
vi.mock('@/features/submission/services/submissionService');

const fakeExercise = {
  id: 'ex1',
  title: 'Test exercise',
  totalPoints: 0,
  status: 'DRAFT',
  createdBy: 'u1',
  createdAt: new Date().toISOString(),
  questions: Array.from({ length: 50 }).map((_, i) => ({
    id: `q${i}`,
    orderIndex: i,
    type: i % 2 === 0 ? QuestionType.MCQ : QuestionType.ESSAY,
    questionText: `Question ${i}`,
    options: [],
    points: 1,
  })),
} as unknown as Exercise;

describe('ExercisePlayer', () => {
  const renderWithQueryClient = (ui: React.ReactElement) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    ((exerciseService.getById) as any).mockResolvedValue(fakeExercise);
    ((submissionService.getByExerciseAndStudent) as any).mockResolvedValue(null);
    ((submissionService.submit) as any).mockResolvedValue({
      id: 'sub1',
      status: 'GRADED',
      mcqScore: 10,
      essayScore: 0,
      totalScore: 10,
    });
  });

  it('renders scrollable container with proper utility classes', async () => {
    renderWithQueryClient(<ExercisePlayer exerciseId="ex1" />);
    // wait for exercise to load
    await waitFor(() => expect(exerciseService.getById).toHaveBeenCalled());
    const scroll = screen.getByTestId('scroll-container');
    expect(scroll).toHaveClass('overflow-y-auto');
    expect(scroll).toHaveClass('min-h-0');
  });

  it('does not show essay-waiting message when status is GRADED', async () => {
    renderWithQueryClient(<ExercisePlayer exerciseId="ex1" studentId="student1" />);
    await waitFor(() => expect(exerciseService.getById).toHaveBeenCalled());
    // simulate submitting
    const submit = screen.getByRole('button', { name: /nộp bài/i });
    fireEvent.click(submit);
    
    // Wait for the asynchronous submit to resolve and the UI to update
    await waitFor(() => {
        expect(screen.getByText(/HOÀN THÀNH/i)).toBeInTheDocument();
    });
    
    // check that modal/message is not rendered
    expect(screen.queryByText(/Các câu hỏi tự luận/)).not.toBeInTheDocument();
  });
});
