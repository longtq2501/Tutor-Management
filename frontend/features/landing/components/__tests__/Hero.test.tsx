import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Hero from '../Hero';

vi.mock('../visuals/HeroDashboardPreview', () => ({
    default: () => <div data-testid="hero-dashboard-preview">Dashboard Preview</div>
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

    it('renders the dashboard preview component', () => {
        render(<Hero />);
        expect(screen.getByTestId('hero-dashboard-preview')).toBeDefined();
    });

    it('does not render stats bar values', () => {
        render(<Hero />);
        expect(screen.queryByText('11')).not.toBeInTheDocument();
        expect(screen.queryByText('Miễn phí')).not.toBeInTheDocument();
    });
});
