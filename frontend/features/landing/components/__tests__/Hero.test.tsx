import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Hero from '../Hero';

// Mock SplineVisual as it depends on external Spline SDK
vi.mock('../visuals/SplineVisual', () => ({
    default: () => <div data-testid="spline-visual">Mock Spline</div>
}));

describe('Hero Component', () => {
    it('renders the main headline correctly', () => {
        render(<Hero />);
        expect(screen.getByText('TUTOR')).toBeDefined();
        expect(screen.getByText('PRO')).toBeDefined();
    });

    it('renders the call to action buttons', () => {
        render(<Hero />);
        expect(screen.getByText('BẮT ĐẦU NGAY')).toBeDefined();
        expect(screen.getByText('KHÁM PHÁ')).toBeDefined();
    });

    it('renders the SplineVisual component', () => {
        render(<Hero />);
        expect(screen.getByTestId('spline-visual')).toBeDefined();
    });

    it('displays the statistics bar on desktop', () => {
        render(<Hero />);
        expect(screen.getByText('500+')).toBeDefined();
        expect(screen.getByText('12K+')).toBeDefined();
    });
});
