import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import LandingPage from '@/app/page';

describe('Landing Page', () => {
    it('renders hero section', () => {
        render(<LandingPage />);
        expect(screen.getByText(/Nền tảng quản lý gia sư 1-1 đang phát triển/i)).toBeInTheDocument();
    });

    it('renders feature section', () => {
        render(<LandingPage />);
        expect(screen.getByText(/Phản hồi từ người dùng thật/i)).toBeInTheDocument();
    });

    it('has working CTA button', () => {
        render(<LandingPage />);
        const buttons = screen.getAllByText(/BẮT ĐẦU|Bắt đầu/i);
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('does not show fake stats', () => {
        render(<LandingPage />);
        expect(screen.queryByText(/12K/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/500\+/i)).not.toBeInTheDocument();
    });
});

describe('Features Page', () => {
    it('renders without crashing', async () => {
        const { default: FeaturesPage } = await import('@/app/features/page');
        render(<FeaturesPage />);
        expect(document.body).toBeTruthy();
    });
});

describe('Pricing Page', () => {
    it('renders without crashing', async () => {
        const { default: PricingPage } = await import('@/app/pricing/page');
        render(<PricingPage />);
        expect(document.body).toBeTruthy();
    });
});
