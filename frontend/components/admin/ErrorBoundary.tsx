'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

/**
 * Class-based React Error Boundary.
 * Catches JavaScript errors anywhere in the child component tree
 * and renders a fallback UI with a retry button.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--admin-red)]/10 border border-[var(--admin-red)]/20 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-8 w-8 text-[var(--admin-red)]" />
                    </div>
                    <h3 className="text-base font-bold text-[var(--admin-text)] mb-1">Đã xảy ra lỗi</h3>
                    <p className="text-sm text-[var(--admin-text3)] max-w-sm mb-5">
                        {this.state.error?.message ?? 'Không thể tải dữ liệu. Vui lòng thử lại.'}
                    </p>
                    <button
                        onClick={this.handleRetry}
                        className="flex items-center gap-2 px-5 py-2 bg-[var(--admin-accent)] text-[var(--admin-bg)] rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Thử lại
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
