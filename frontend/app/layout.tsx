import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
    subsets: ['latin'],
    display: 'swap',
    variable: '--font-inter',
});

export const metadata: Metadata = {
    metadataBase: new URL('https://tutor-management-e7zh.vercel.app'),
    title: 'Tutor Pro',
    description: 'Hệ thống quản lý gia sư chuyên nghiệp, tối ưu hóa quy trình dạy và học.',
    icons: {
        icon: '/favicon.svg',
        shortcut: '/favicon.svg',
        apple: '/favicon.svg',
    },
    openGraph: {
        type: 'website',
        locale: 'vi_VN',
        url: 'https://tutor-management-e7zh.vercel.app',
        title: 'Tutor Pro - Hệ thống quản lý gia sư',
        description: 'Giải pháp quản lý gia sư, học sinh và học phí hiệu quả.',
        siteName: 'Tutor Pro',
        images: [
            {
                url: '/thumbnail.jpg',
                width: 1200,
                height: 630,
                alt: 'Tutor Pro Dashboard',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Tutor Pro - Quản lý gia sư',
        description: 'Hệ thống quản lý gia sư chuyên nghiệp',
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

import { ThemeProvider } from '@/components/shared/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { SessionManager } from '@/components/shared/SessionManager';
import QueryProvider from '@/providers/QueryProvider';
import { Toaster } from 'sonner';

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

