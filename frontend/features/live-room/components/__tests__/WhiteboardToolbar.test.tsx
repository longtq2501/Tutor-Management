import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WhiteboardToolbar } from '../WhiteboardToolbar';
import { vi, describe, it, expect } from 'vitest';

describe('WhiteboardToolbar', () => {
    const defaultProps = {
        selectedColor: '#000000',
        selectedWidth: 2,
        selectedTool: 'pen' as const,
        onColorChange: vi.fn(),
        onWidthChange: vi.fn(),
        onToolChange: vi.fn(),
        onClear: vi.fn(),
        onUndo: vi.fn(),
        onRedo: vi.fn(),
        canUndo: true,
        canRedo: true,
    };

    it('should call onToolChange when tool buttons are clicked', () => {
        render(<WhiteboardToolbar {...defaultProps} />);

        const eraserButton = screen.getByLabelText(/eraser tool/i);
        fireEvent.click(eraserButton);
        expect(defaultProps.onToolChange).toHaveBeenCalledWith('eraser');

        const penButton = screen.getByLabelText(/pen tool/i);
        fireEvent.click(penButton);
        expect(defaultProps.onToolChange).toHaveBeenCalledWith('pen');
    });

    it('should call onUndo and onRedo when buttons are clicked', () => {
        render(<WhiteboardToolbar {...defaultProps} />);

        const undoButton = screen.getByLabelText(/undo/i);
        fireEvent.click(undoButton);
        expect(defaultProps.onUndo).toHaveBeenCalled();

        const redoButton = screen.getByLabelText(/redo/i);
        fireEvent.click(redoButton);
        expect(defaultProps.onRedo).toHaveBeenCalled();
    });

    it('should disable undo/redo buttons based on props', () => {
        render(<WhiteboardToolbar {...defaultProps} canUndo={false} canRedo={false} />);

        const undoButton = screen.getByLabelText(/undo/i);
        const redoButton = screen.getByLabelText(/redo/i);

        expect(undoButton).toBeDisabled();
        expect(redoButton).toBeDisabled();
    });

    it('should call onColorChange when a color is clicked', () => {
        render(<WhiteboardToolbar {...defaultProps} />);

        // Select red color (from PRESET_COLORS in component)
        const redButton = screen.getByLabelText(/select color #ef4444/i);
        fireEvent.click(redButton);
        expect(defaultProps.onColorChange).toHaveBeenCalledWith('#EF4444');
    });

    it('should call onWidthChange when a width is clicked', () => {
        render(<WhiteboardToolbar {...defaultProps} />);

        const widthButton = screen.getByLabelText(/stroke width 4px/i);
        fireEvent.click(widthButton);
        expect(defaultProps.onWidthChange).toHaveBeenCalledWith(4);
    });

    it('should call onClear when clear button is clicked', () => {
        render(<WhiteboardToolbar {...defaultProps} />);

        const clearButton = screen.getByLabelText(/clear my drawings/i);
        fireEvent.click(clearButton);
        expect(defaultProps.onClear).toHaveBeenCalled();
    });

    describe('Keyboard Navigation', () => {
        it('should navigate colors with arrow keys', () => {
            render(<WhiteboardToolbar {...defaultProps} />);
            const blackButton = screen.getByLabelText(/select color #000000/i);

            fireEvent.keyDown(blackButton, { key: 'ArrowRight' });
            expect(defaultProps.onColorChange).toHaveBeenCalledWith('#EF4444');

            fireEvent.keyDown(blackButton, { key: 'ArrowDown' });
            expect(defaultProps.onColorChange).toHaveBeenCalledWith('#EF4444');
        });

        it('should navigate widths with arrow keys', () => {
            render(<WhiteboardToolbar {...defaultProps} />);
            const width2Button = screen.getByLabelText(/stroke width 2px/i);

            fireEvent.keyDown(width2Button, { key: 'ArrowRight' });
            expect(defaultProps.onWidthChange).toHaveBeenCalledWith(4);
        });
    });

    describe('Accessibility & UI', () => {
        it('should have proper ARIA roles and labels', () => {
            render(<WhiteboardToolbar {...defaultProps} />);

            expect(screen.getByRole('group', { name: /color selection/i })).toBeInTheDocument();
            expect(screen.getByRole('group', { name: /stroke width selection/i })).toBeInTheDocument();

            const buttons = screen.getAllByRole('button');
            buttons.forEach(button => {
                expect(button).toHaveAccessibleName();
            });
        });

        it('should use responsive sizing classes', () => {
            render(<WhiteboardToolbar {...defaultProps} />);
            const penButton = screen.getByLabelText(/pen tool/i);

            expect(penButton).toHaveClass('h-12');
            expect(penButton).toHaveClass('md:h-9');
        });

        it('should handle haptic feedback if supported', () => {
            const vibrateSpy = vi.fn();
            global.navigator.vibrate = vibrateSpy;

            render(<WhiteboardToolbar {...defaultProps} />);
            const penButton = screen.getByLabelText(/pen tool/i);

            fireEvent.click(penButton);
            expect(vibrateSpy).toHaveBeenCalledWith(10);
        });
    });
});
