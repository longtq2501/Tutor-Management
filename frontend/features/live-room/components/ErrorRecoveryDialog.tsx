"use client";

import React from 'react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Mic, LogOut, AlertTriangle } from 'lucide-react';

interface ErrorRecoveryDialogProps {
    /** Whether the dialog is visible */
    isOpen: boolean;
    /** The error message to display */
    error: string | null;
    /** Callback to retry the full connection */
    onRetry: () => void;
    /** Callback to retry with only audio */
    onAudioOnly: () => void;
    /** Callback to exit the room */
    onExit: () => void;
}

/**
 * Dialog shown when a critical connection error occurs in the Live Room.
 * Provides multiple recovery strategies: full retry, audio-only fallback, or exit.
 */
export const ErrorRecoveryDialog: React.FC<ErrorRecoveryDialogProps> = ({
    isOpen,
    error,
    onRetry,
    onAudioOnly,
    onExit
}) => {
    const [showDiagnostics, setShowDiagnostics] = React.useState(false);

    // Simple network quality check
    const connectionQuality = React.useMemo(() => {
        if (typeof navigator === 'undefined') return 'unknown';
        if (!navigator.onLine) return 'offline';
        const conn = (navigator as Navigator & { connection?: { effectiveType: string } }).connection;
        if (conn?.effectiveType === '4g') return 'good';
        if (conn?.effectiveType === '3g' || conn?.effectiveType === '2g') return 'poor';
        return 'unknown';
    }, []);

    return (
        <AlertDialog open={isOpen}>
            <AlertDialogContent className="max-w-md border-destructive/20 bg-background/95 backdrop-blur-md">
                <AlertDialogHeader>
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                    </div>
                    <AlertDialogTitle className="text-center text-xl font-bold">
                        Kết nối thất bại
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center mt-2 text-muted-foreground">
                        {error || "Đã xảy ra sự cố không mong muốn với kết nối của bạn. Vui lòng chọn cách khắc phục bên dưới."}
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-6">
                    {connectionQuality === 'poor' && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <p>Kết nối mạng của bạn hiện đang yếu. Chế độ <strong>Chỉ âm thanh</strong> được khuyến nghị để đảm bảo ổn định.</p>
                        </div>
                    )}

                    <div className="grid gap-3">
                        <Button
                            variant="default"
                            className="w-full justify-start gap-3 h-12 text-base shadow-sm"
                            onClick={onRetry}
                            autoFocus
                        >
                            <RefreshCw className="h-5 w-5" />
                            <span>Thử kết nối lại ngay</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start gap-3 h-12 text-base border-primary/20 hover:bg-primary/5"
                            onClick={onAudioOnly}
                        >
                            <Mic className="h-5 w-5 text-primary" />
                            <span>Chế độ Chỉ âm thanh (Băng thông thấp)</span>
                        </Button>
                    </div>

                    <div className="pt-2">
                        <button
                            onClick={() => setShowDiagnostics(!showDiagnostics)}
                            className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mx-auto"
                        >
                            {showDiagnostics ? 'Ẩn' : 'Hiện'} thông tin chẩn đoán kỹ thuật
                        </button>

                        {showDiagnostics && (
                            <div className="mt-2 p-3 bg-muted rounded-md text-[10px] font-mono text-muted-foreground break-all space-y-1 animate-in fade-in zoom-in-95">
                                <div>OS/Browser: {navigator.userAgent}</div>
                                <div>Online Status: {navigator.onLine ? 'Connected' : 'Offline'}</div>
                                <div>Network Type: {(navigator as Navigator & { connection?: { effectiveType: string } }).connection?.effectiveType || 'Unknown'}</div>
                                <div>Timestamp: {new Date().toISOString()}</div>
                            </div>
                        )}
                    </div>
                </div>

                <AlertDialogFooter className="flex-col sm:flex-col gap-2">
                    <AlertDialogCancel
                        className="w-full gap-2 border-none hover:bg-muted"
                        onClick={onExit}
                    >
                        <LogOut className="h-4 w-4" />
                        Rời khỏi lớp học
                    </AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
