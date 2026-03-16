'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { gmailApi, buildGmailConnectUrl } from '@/lib/services/gmail';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import type { UserInfo } from '@/lib/services/auth';

interface GmailSectionProps {
    user: UserInfo;
}

function GmailSectionContent({ user }: GmailSectionProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [gmailConnected, setGmailConnected] = useState<boolean | null>(null);
    const [gmailEmail, setGmailEmail] = useState<string>('');

    const loadGmailStatus = useCallback(async () => {
        if (!user || user.role !== 'TUTOR') {
            return;
        }

        try {
            const status = await gmailApi.getStatus();
            setGmailConnected(status.connected);
            setGmailEmail(status.email);
        } catch {
            setGmailConnected(false);
            setGmailEmail(user.email);
        }
    }, [user]);

    useEffect(() => {
        loadGmailStatus();
    }, [loadGmailStatus]);

    useEffect(() => {
        const gmail = searchParams.get('gmail');
        const reason = searchParams.get('reason');

        const buildDashboardUrl = () => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('gmail');
            params.delete('reason');
            const query = params.toString();
            return query ? `/dashboard?${query}` : '/dashboard';
        };

        if (gmail === 'connected') {
            toast.success('Đã kết nối Gmail thành công!');
            loadGmailStatus();
            router.replace(buildDashboardUrl());
            return;
        }

        if (gmail === 'error') {
            if (reason === 'no_refresh_token') {
                toast.error('Kết nối Gmail thất bại: Google chưa trả refresh token. Vui lòng thử lại.');
            } else {
                toast.error('Kết nối Gmail thất bại. Vui lòng thử lại.');
            }
            router.replace(buildDashboardUrl());
        }
    }, [searchParams, router, loadGmailStatus]);

    const handleConnectGmail = () => {
        window.location.href = buildGmailConnectUrl();
    };

    const handleDisconnectGmail = async () => {
        try {
            await gmailApi.disconnect();
            await loadGmailStatus();
            toast.success('Đã ngắt kết nối Gmail');
        } catch {
            toast.error('Không thể ngắt kết nối Gmail. Vui lòng thử lại.');
        }
    };

    if (gmailConnected === null) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="border-t border-border/60 pt-8 space-y-4">
            <div>
                <h4 className="text-lg font-bold tracking-tight text-foreground">Kết nối Gmail để gửi báo giá</h4>
                <p className="text-sm text-muted-foreground mt-1">
                    Khi kết nối Gmail, hóa đơn học phí sẽ được gửi trực tiếp từ địa chỉ Gmail của bạn đến phụ huynh thay vì từ email hệ thống.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Ứng dụng chỉ có quyền gửi mail thay mặt bạn, không đọc, không xóa, không truy cập nội dung hộp thư.
                </p>
            </div>

            {gmailConnected ? (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Đã kết nối: {gmailEmail || user.email}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Báo giá sẽ được gửi từ Gmail này đến phụ huynh.</p>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleDisconnectGmail}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                        Ngắt kết nối Gmail
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-sm">Chưa kết nối Gmail</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Hiện tại báo giá đang được gửi từ email hệ thống. Kết nối Gmail để gửi từ địa chỉ email của bạn.
                    </p>
                    <Button type="button" onClick={handleConnectGmail}>
                        <Mail className="h-4 w-4 mr-2" />
                        Kết nối Gmail
                    </Button>
                </div>
            )}
        </div>
    );
}

export function GmailSection({ user }: GmailSectionProps) {
    return (
        <Suspense fallback={
            <div className="border-t border-border/60 pt-8 flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
        }>
            <GmailSectionContent user={user} />
        </Suspense>
    );
}
