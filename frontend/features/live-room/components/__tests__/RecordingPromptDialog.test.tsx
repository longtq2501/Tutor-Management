import { render, screen, fireEvent } from '@testing-library/react';
import { RecordingPromptDialog } from '../RecordingPromptDialog';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('RecordingPromptDialog', () => {
    const mockOnConfirm = vi.fn();
    const mockOnDecline = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders dialog when open', () => {
        render(
            <RecordingPromptDialog
                isOpen={true}
                onConfirm={mockOnConfirm}
                onDecline={mockOnDecline}
            />
        );

        expect(screen.getByText('Ghi hình buổi học?')).toBeInTheDocument();
        expect(screen.getByText(/Bạn có muốn ghi lại buổi học này không/i)).toBeInTheDocument();
    });

    it('does not render dialog when closed', () => {
        render(
            <RecordingPromptDialog
                isOpen={false}
                onConfirm={mockOnConfirm}
                onDecline={mockOnDecline}
            />
        );

        expect(screen.queryByText('Ghi hình buổi học?')).not.toBeInTheDocument();
    });

    it('displays all recording items', () => {
        render(
            <RecordingPromptDialog
                isOpen={true}
                onConfirm={mockOnConfirm}
                onDecline={mockOnDecline}
            />
        );

        expect(screen.getByText(/Video từ camera/i)).toBeInTheDocument();
        expect(screen.getByText(/Âm thanh từ microphone/i)).toBeInTheDocument();
        expect(screen.getByText(/Nội dung trên bảng trắng/i)).toBeInTheDocument();
        expect(screen.getByText(/Tin nhắn chat/i)).toBeInTheDocument();
    });

    it('displays important notice', () => {
        render(
            <RecordingPromptDialog
                isOpen={true}
                onConfirm={mockOnConfirm}
                onDecline={mockOnDecline}
            />
        );

        expect(screen.getByText(/Nội dung được ghi lại/i)).toBeInTheDocument();
        expect(screen.getByText(/Video từ camera của bạn và học viên/i)).toBeInTheDocument();
    });

    it('calls onConfirm when "Ghi hình" button is clicked', () => {
        render(
            <RecordingPromptDialog
                isOpen={true}
                onConfirm={mockOnConfirm}
                onDecline={mockOnDecline}
            />
        );

        const confirmButton = screen.getByRole('button', { name: /Ghi hình/i });
        fireEvent.click(confirmButton);

        expect(mockOnConfirm).toHaveBeenCalledTimes(1);
        expect(mockOnDecline).not.toHaveBeenCalled();
    });

    it('calls onDecline when "Không ghi" button is clicked', () => {
        render(
            <RecordingPromptDialog
                isOpen={true}
                onConfirm={mockOnConfirm}
                onDecline={mockOnDecline}
            />
        );

        const declineButton = screen.getByRole('button', { name: /Không ghi/i });
        fireEvent.click(declineButton);

        expect(mockOnDecline).toHaveBeenCalledTimes(1);
        expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('has proper button styling for confirm button', () => {
        render(
            <RecordingPromptDialog
                isOpen={true}
                onConfirm={mockOnConfirm}
                onDecline={mockOnDecline}
            />
        );

        const confirmButton = screen.getByRole('button', { name: /Ghi hình/i });
        expect(confirmButton).toHaveClass('from-red-600');
    });

    it('has proper button styling for decline button', () => {
        render(
            <RecordingPromptDialog
                isOpen={true}
                onConfirm={mockOnConfirm}
                onDecline={mockOnDecline}
            />
        );

        const declineButton = screen.getByRole('button', { name: /Không ghi/i });
        expect(declineButton).toHaveAttribute('class', expect.stringContaining('outline'));
    });
});
