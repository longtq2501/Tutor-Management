import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/shared/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { SessionManager } from '@/components/shared/SessionManager';
import QueryProvider from '@/providers/QueryProvider';
import { Toaster } from 'sonner';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    metadataBase: new URL('https://tutorpro.id.vn'),
    title: 'Tutor Pro — Hệ thống quản lý gia sư 1-1',
    description: 'Nền tảng quản lý gia sư toàn diện: lịch dạy, tài chính, lớp học trực tuyến, AI feedback. Dùng thử miễn phí.',
    keywords: ['gia su', 'quan ly gia su', 'phan mem gia su', 'tutor management'],
    manifest: '/manifest.json',
    openGraph: {
        type: 'website',
        locale: 'vi_VN',
        url: 'https://tutorpro.id.vn',
        title: 'Tutor Pro',
        description: 'Hệ thống quản lý gia sư 1-1 toàn diện',
        siteName: 'Tutor Pro',
        images: [
            {
                url: '/new-thumbail.png',
                width: 1200,
                height: 630,
                alt: 'Tutor Pro - Hệ thống quản lý gia sư',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Tutor Pro - Quản lý gia sư',
        description: 'Hệ thống quản lý gia sư chuyên nghiệp',
        images: ['/new-thumbail.png'],
    },
    verification: {
        google: 'google-site-verification-placeholder',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
};

export const viewport: Viewport = {
    themeColor: '#4f46e5',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi" suppressHydrationWarning>
            <body className={`${inter.variable} font-sans antialiased`}>
                <QueryProvider>
                    <AuthProvider>
                        <ThemeProvider
                            attribute="class"
                            defaultTheme="system"
                            enableSystem
                            disableTransitionOnChange
                        >
                            <SessionManager>
                                {children}
                            </SessionManager>
                            <Toaster richColors position="bottom-right" />
                        </ThemeProvider>
                    </AuthProvider>
                </QueryProvider>
            </body>
        </html>
    );
}


