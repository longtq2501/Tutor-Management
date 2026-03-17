import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import FeatureShowcase from '../FeatureShowcase';

describe('FeatureShowcase Component', () => {
    it('renders the section title and subtitle', () => {
        render(<FeatureShowcase />);
        expect(screen.getByText(/Mọi công cụ bạn cần/i)).toBeDefined();
        expect(screen.getByText(/Trong một nền tảng duy nhất/i)).toBeDefined();
    });

    it('renders all core features including Live Teaching', () => {
        render(<FeatureShowcase />);
        const features = [
            'Live Teaching',
            'Calendar',
            'Lesson Lobby',
            'Assessment',
            'Finance',
            'Storage'
        ];

        features.forEach(feature => {
            expect(screen.getByText(feature)).toBeDefined();
        });
    });

    it('renders the visual mockups for each feature', () => {
        const { container } = render(<FeatureShowcase />);
        const visuals = container.querySelectorAll('#features article, #features .grid.grid-cols-1.gap-6.rounded-3xl');
        expect(visuals.length).toBe(6);
    });
});
