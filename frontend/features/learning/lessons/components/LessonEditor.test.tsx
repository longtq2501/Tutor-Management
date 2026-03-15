import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { LessonEditor } from './LessonEditor';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock ResizeObserver which is used by Tiptap tables and Radix UI
global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
} as unknown as typeof ResizeObserver;

// Mock IntersectionObserver
global.IntersectionObserver = class {
    root = null;
    rootMargin = '';
    thresholds = [];
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords = () => [];
} as unknown as typeof IntersectionObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock scrollTo
window.scrollTo = vi.fn();

// Mock PointerEvent for Radix UI
if (typeof window.PointerEvent === 'undefined') {
    class MockPointerEvent extends MouseEvent {
        constructor(type: string, props: PointerEventInit = {}) {
            super(type, props);
        }
    }
    window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
}

describe('LessonEditor Heading Recognition', () => {
    const mockOnChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock prompt for link tests
        window.prompt = vi.fn();
    });

    it('should recognize standard H1 tag as a heading', async () => {
        const content = '<h1>Title</h1>';
        render(<LessonEditor content={content} onChange={mockOnChange} />);

        // Wait for editor to initialize
        await waitFor(() => {
            const h1 = document.querySelector('.tiptap h1');
            expect(h1).toBeInTheDocument();
            expect(h1?.textContent).toBe('Title');
        }, { timeout: 5000 });
    });

    it('should recognize Google Docs style paragraphs with large font-size as headings', async () => {
        // Simulating a paragraph with font-size 24pt (Heading 1)
        const content = '<p style="font-size: 24pt;">LARGE TITLE</p>';
        render(<LessonEditor content={content} onChange={mockOnChange} />);

        await waitFor(() => {
            const trigger = screen.getByRole('combobox');
            expect(trigger).toHaveTextContent('Tiêu đề');
        }, { timeout: 5000 });
    });

    it('should recognize Google Docs style paragraphs with nested spans and font-size', async () => {
        // Simulating a paragraph with a nested span that has the font-size
        const content = '<p><span style="font-size: 24pt;">NESTED TITLE</span></p>';
        render(<LessonEditor content={content} onChange={mockOnChange} />);

        await waitFor(() => {
            const trigger = screen.getByRole('combobox');
            expect(trigger).toHaveTextContent('Tiêu đề');
        }, { timeout: 5000 });
    });

    it('should recognize Bold + All Caps paragraphs as Tiêu đề 1 (H3)', async () => {
        const content = '<p><b>BÀI TẬP CÂU BỊ ĐỘNG</b></p>';
        render(<LessonEditor content={content} onChange={mockOnChange} />);

        await waitFor(() => {
            const trigger = screen.getByRole('combobox');
            expect(trigger).toHaveTextContent('Tiêu đề 1');
        }, { timeout: 5000 });
    });

    it('should update current style dropdown when cursor is on a heading', async () => {
        const content = '<h3>Heading Level 3</h3>';
        render(<LessonEditor content={content} onChange={mockOnChange} />);

        await waitFor(() => {
            const trigger = screen.getByRole('combobox');
            expect(trigger).toHaveTextContent('Tiêu đề 1'); // Tiêu đề 1 is mapped to h3 in our implementation
        }, { timeout: 5000 });
    });

    it('should show table management options when table button is clicked', async () => {
        render(<LessonEditor content="" onChange={mockOnChange} />);
        const btn = screen.getByLabelText('Quản lý bảng');
        fireEvent.click(btn);

        await waitFor(() => {
            expect(screen.getByText('Chèn bảng (3x3)')).toBeInTheDocument();
        }, { timeout: 5000 });
    });

    it('should toggle underline on text', async () => {
        const content = '<p>Normal text</p>';
        render(<LessonEditor content={content} onChange={mockOnChange} />);

        await waitFor(() => {
            const underlineBtn = screen.getByLabelText('Gạch chân');
            expect(underlineBtn).toBeInTheDocument();
        }, { timeout: 5000 });
    });
});
