'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Next.js 15 per-route error boundary for the /admin segment.
 * Rendered automatically when an unhandled error occurs in any admin page.
 */
export default function AdminErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    const router = useRouter();

    useEffect(() => {
        console.error('[Admin Error Boundary]', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>

            <h1 className="text-2xl font-bold text-[var(--admin-text)] mb-2">
                Đã xảy ra lỗi không mong muốn
            </h1>
            <p className="text-sm text-[var(--admin-text3)] max-w-md mb-2">
                {error.message || 'Không thể tải trang này. Hãy thử tải lại hoặc quay về trang tổng quan.'}
            </p>
            {error.digest && (
                <p className="text-xs text-[var(--admin-text3)] font-mono mb-6">
                    Mã lỗi: {error.digest}
                </p>
            )}

            <div className="flex items-center gap-3">
                <button
                    onClick={reset}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--admin-accent)] text-[var(--admin-bg)] rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                >
                    <RefreshCw className="h-4 w-4" />
                    Thử lại
                </button>
                <button
                    onClick={() => router.push('/admin')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--admin-surface2)] text-[var(--admin-text)] border border-[var(--admin-border)] rounded-xl text-sm font-bold hover:bg-[var(--admin-surface)] transition-colors"
                >
                    <LayoutDashboard className="h-4 w-4" />
                    Về Tổng Quan
                </button>
            </div>
        </div>
    );
}
