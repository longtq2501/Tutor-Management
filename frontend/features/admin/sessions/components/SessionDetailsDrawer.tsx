'use client';

import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { adminSessionsApi } from '@/lib/services/admin-sessions';
import { toast } from 'sonner';
import type { SessionRecord } from '@/lib/types/finance';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, BookOpen, CreditCard, MessageSquare, History } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface SessionDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: number | null;
}

export function SessionDetailsDrawer({
    isOpen,
    onClose,
    sessionId,
}: SessionDetailsDrawerProps) {
    const [session, setSession] = useState<SessionRecord | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSession = async () => {
            if (sessionId) {
                setLoading(true);
                try {
                    // Assuming there's a getById in adminSessionsApi, if not I'll need to add it or use getAll and find.
                    // Let me check adminSessionsApi again.
                    const data = await adminSessionsApi.getById(sessionId);
                    setSession(data);
                } catch (error) {
                    toast.error('Không thể tải chi tiết buổi học');
                    onClose();
                } finally {
                    setLoading(false);
                }
            }
        };

        if (isOpen) {
            fetchSession();
        }
    }, [isOpen, sessionId]);

    if (!session && loading) {
        return (
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="sm:max-w-[500px] admin-theme admin-glass border-[var(--admin-border)]">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Chi tiết buổi học</SheetTitle>
                    </SheetHeader>
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--admin-accent)]" />
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    if (!session) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-[500px] admin-glass border-[var(--admin-border)] overflow-y-auto">
                <SheetHeader className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--admin-accent)]/10 flex items-center justify-center border border-[var(--admin-accent)]/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                            <History className="h-8 w-8 text-[var(--admin-accent)]" />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-[var(--admin-text3)] uppercase tracking-widest mb-1">SESSION RECORD</div>
                            <SheetTitle className="text-2xl font-black text-[var(--admin-text)] tracking-tight">
                                SES-{session.id.toString().padStart(3, '0')}
                            </SheetTitle>
                        </div>
                    </div>
                </SheetHeader>

                <div className="space-y-8">
                    {/* Trạng thái thanh toán */}
                    <div className="p-4 rounded-2xl bg-[var(--admin-surface2)] border border-[var(--admin-border)] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${session.paid ? 'bg-[var(--admin-green)]/10 text-[var(--admin-green)]' : 'bg-[var(--admin-red)]/10 text-[var(--admin-red)]'}`}>
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-[var(--admin-text3)] uppercase">PHÍ BUỔI HỌC</div>
                                <div className="text-lg font-black text-[var(--admin-text)]">{formatCurrency(session.totalAmount)}</div>
                            </div>
                        </div>
                        <Badge variant={session.paid ? "default" : "destructive"} className={session.paid ? "bg-[var(--admin-green)] border-[var(--admin-green)]" : "bg-[var(--admin-red)] border-[var(--admin-red)]"}>
                            {session.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </Badge>
                    </div>

                    {/* Đối tượng */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-[var(--admin-text3)] uppercase tracking-widest flex items-center gap-2">
                            <User className="h-3 w-3" /> NHÂN SỰ LIÊN QUAN
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="p-4 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--admin-surface2)] border border-[var(--admin-border)] flex items-center justify-center font-bold text-xs">S</div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-[var(--admin-text3)] uppercase">HỌC SINH</span>
                                        <span className="text-sm font-bold text-[var(--admin-text)]">{session.studentName}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[var(--admin-accent)]/10 text-[var(--admin-accent)] flex items-center justify-center font-bold text-xs">T</div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-[var(--admin-text3)] uppercase">GIA SƯ</span>
                                        <span className="text-sm font-bold text-[var(--admin-text)]">{session.tutorName}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Chi tiết buổi học */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-[var(--admin-text3)] uppercase tracking-widest flex items-center gap-2">
                            <BookOpen className="h-3 w-3" /> CHI TIẾT BUỔI HỌC
                        </h3>
                        <div className="p-4 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-[var(--admin-text3)] uppercase">MÔN HỌC</div>
                                    <div className="text-sm font-black text-[var(--admin-text)] uppercase">{session.subject || 'N/A'}</div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <div className="text-[10px] font-bold text-[var(--admin-text3)] uppercase">THỜI LƯỢNG</div>
                                    <div className="text-sm font-black text-[var(--admin-text)]">{session.hours} GIỜ</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--admin-border)]">
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-[var(--admin-text3)] uppercase">NGÀY HỌC</div>
                                    <div className="text-sm font-black text-[var(--admin-text)] flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-[var(--admin-accent)]" />
                                        {session.sessionDate}
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <div className="text-[10px] font-bold text-[var(--admin-text3)] uppercase">HÌNH THỨC</div>
                                    <Badge variant="outline" className="text-[10px] font-black uppercase border-[var(--admin-accent)]/30 text-[var(--admin-accent)]">OFFLINE</Badge>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Ghi chú & Phản hồi */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-[var(--admin-text3)] uppercase tracking-widest flex items-center gap-2">
                            <MessageSquare className="h-3 w-3" /> GHI CHÚ & PHẢN HỒI
                        </h3>
                        <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-2">
                                <div className="text-[10px] font-bold text-[var(--admin-text3)] uppercase">GHI CHÚ TỪ GIA SƯ</div>
                                <p className="text-sm text-[var(--admin-text2)] leading-relaxed italic">
                                    {session.notes || 'Không có ghi chú cho buổi học này.'}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    );
}
