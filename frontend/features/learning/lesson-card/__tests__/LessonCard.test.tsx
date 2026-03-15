import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LessonCard from '../index';
import type { Lesson } from '@/lib/types';

const mockLesson: Lesson = {
    id: 1,
    title: 'Test Lesson',
    tutorName: 'Tutor Name',
    lessonDate: '2024-01-01',
    viewCount: 10,
    isCompleted: false,
    studentId: 1,
    studentName: 'Student',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    // images and resources are missing (undefined) as in summary response
} as unknown as Lesson;

describe('LessonCard', () => {
    it('renders correctly without images or resources', () => {
        const onClick = vi.fn();
        render(<LessonCard lesson={mockLesson} onClick={onClick} />);

        expect(screen.getByText('Test Lesson')).toBeDefined();
        expect(screen.getByText('Tutor Name')).toBeDefined();
    });

    it('calls onClick when clicked', () => {
        const onClick = vi.fn();
        render(<LessonCard lesson={mockLesson} onClick={onClick} />);

        // The component uses a clickable div based on current logic, so we click the text
        fireEvent.click(screen.getByText('Test Lesson'));
        expect(onClick).toHaveBeenCalled();
    });
});
