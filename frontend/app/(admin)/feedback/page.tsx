'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, MessageSquare, RefreshCw, Send } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supportApi } from '@/lib/services/support';
import { SupportConversation, SupportMessage } from '@/lib/types/support';
import { useFeedbackChat } from '@/features/support/hooks/useFeedbackChat';
import { toast } from 'sonner';

function formatTime(iso: string) {
    return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function initials(name: string) {
    return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

const ROLE_LABELS: Record<string, string> = { TUTOR: 'Gia sư', STUDENT: 'Học sinh', ADMIN: 'Admin' };
const ROLE_COLORS: Record<string, string> = {
    TUTOR: 'bg-blue-500/10 text-blue-600',
    STUDENT: 'bg-green-500/10 text-green-600',
    ADMIN: 'bg-red-500/10 text-red-600',
};

// ─── Conversation item ─────────────────────────────────────────────────────

function ConversationItem({
    conv,
    active,
    onClick,
}: {
    conv: SupportConversation;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 border-b border-[var(--admin-border)] flex items-start gap-3 transition-colors ${
                active ? 'bg-[var(--admin-accent)]/10' : 'hover:bg-[var(--admin-surface2)]'
            }`}
        >
            <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="text-xs font-bold bg-muted">
                    {initials(conv.userName)}
                </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold truncate">{conv.userName}</span>
                    {conv.unreadCountAdmin > 0 && (
                        <span className="shrink-0 h-4 min-w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                            {conv.unreadCountAdmin}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge
                        variant="secondary"
                        className={`text-[9px] h-4 px-1 ${ROLE_COLORS[conv.userRole] ?? ''}`}
                    >
                        {ROLE_LABELS[conv.userRole] ?? conv.userRole}
                    </Badge>
                    {conv.status === 'RESOLVED' && (
                        <Badge variant="outline" className="text-[9px] h-4 px-1 text-muted-foreground">
                            Đã giải quyết
                        </Badge>
                    )}
                </div>
                {conv.lastMessage && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                        {conv.lastMessage.senderRole === 'ADMIN' ? 'Bạn: ' : ''}
                        {conv.lastMessage.content}
                    </p>
                )}
            </div>
        </button>
    );
}

// ─── Chat panel ────────────────────────────────────────────────────────────

function ChatPanel({ conv }: { conv: SupportConversation }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [content, setContent] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    const { data: history } = useQuery({
        queryKey: ['support-admin-messages', conv.id],
        queryFn: () => supportApi.getConversationMessages(conv.id),
        staleTime: 30_000,
    });

    useEffect(() => {
        if (history) setMessages(history);
    }, [history]);

    const handleNewMessage = useCallback((msg: SupportMessage) => {
        setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
        });
        queryClient.invalidateQueries({ queryKey: ['support-conversations'] });
    }, [queryClient]);

    const { isConnected, sendMessage } = useFeedbackChat({
        conversationId: conv.id,
        onNewMessage: handleNewMessage,
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const updateStatus = useMutation({
        mutationFn: (status: 'OPEN' | 'RESOLVED') => supportApi.updateStatus(conv.id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-conversations'] });
            toast.success('Đã cập nhật trạng thái cuộc trò chuyện');
        },
    });

    const handleSend = () => {
        const trimmed = content.trim();
        if (!trimmed) return;
        if (isConnected) {
            sendMessage({ content: trimmed, type: 'TEXT' });
        }
        setContent('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)]">
                <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs font-bold">{initials(conv.userName)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="text-sm font-semibold">{conv.userName}</p>
                        <Badge variant="secondary" className={`text-[9px] h-4 px-1 ${ROLE_COLORS[conv.userRole] ?? ''}`}>
                            {ROLE_LABELS[conv.userRole] ?? conv.userRole}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {conv.status === 'OPEN' ? (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => updateStatus.mutate('RESOLVED')}
                            disabled={updateStatus.isPending}
                        >
                            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            Đánh dấu đã giải quyết
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5"
                            onClick={() => updateStatus.mutate('OPEN')}
                            disabled={updateStatus.isPending}
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Mở lại
                        </Button>
                    )}
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
                <div className="flex flex-col gap-3">
                    {messages.map((msg) => {
                        const isAdmin = msg.senderRole === 'ADMIN';
                        return (
                            <div
                                key={msg.id}
                                className={`flex flex-col max-w-[70%] gap-1 ${isAdmin ? 'self-end items-end' : 'self-start items-start'}`}
                            >
                                {!isAdmin && (
                                    <span className="text-[11px] font-medium text-muted-foreground px-1">
                                        {msg.senderName}
                                    </span>
                                )}
                                <div
                                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                        isAdmin
                                            ? 'bg-[var(--admin-accent)] text-white rounded-tr-sm'
                                            : 'bg-[var(--admin-surface2)] text-[var(--admin-text)] rounded-tl-sm'
                                    }`}
                                >
                                    {msg.type !== 'TEXT' && (
                                        <span className="block text-[10px] font-semibold opacity-70 mb-0.5">
                                            {msg.type === 'BUG_REPORT' ? '🐛 Báo lỗi' : '✨ Đề xuất'}
                                        </span>
                                    )}
                                    {msg.content}
                                </div>
                                <span className="text-[10px] text-muted-foreground px-1">
                                    {formatTime(msg.createdAt)}
                                </span>
                            </div>
                        );
                    })}
                    <div ref={bottomRef} />
                </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-[var(--admin-border)] p-4 flex gap-3 items-end">
                <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập phản hồi... (Enter để gửi)"
                    className="min-h-[60px] max-h-[120px] resize-none text-sm"
                    maxLength={2000}
                />
                <Button
                    size="icon"
                    className="shrink-0 h-9 w-9 bg-[var(--admin-accent)] hover:opacity-90"
                    disabled={!content.trim() || !isConnected}
                    onClick={handleSend}
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function AdminFeedbackPage() {
    const [selected, setSelected] = useState<SupportConversation | null>(null);

    const { data: conversations = [], isLoading } = useQuery({
        queryKey: ['support-conversations'],
        queryFn: supportApi.getAllConversations,
        refetchInterval: 30_000,
    });

    const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCountAdmin, 0);

    return (
        <div className="flex h-[calc(100vh-52px)] overflow-hidden">
            {/* Left — Conversation list */}
            <aside className="w-80 shrink-0 border-r border-[var(--admin-border)] flex flex-col bg-[var(--admin-surface)]">
                <div className="px-4 py-3 border-b border-[var(--admin-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-[var(--admin-accent)]" />
                        <span className="font-semibold text-sm">Hộp thư hỗ trợ</span>
                    </div>
                    {totalUnread > 0 && (
                        <span className="h-5 min-w-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                            {totalUnread}
                        </span>
                    )}
                </div>

                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                            Đang tải...
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
                            <MessageSquare className="h-8 w-8 opacity-30" />
                            <p className="text-xs">Chưa có cuộc trò chuyện nào</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <ConversationItem
                                key={conv.id}
                                conv={conv}
                                active={selected?.id === conv.id}
                                onClick={() => setSelected(conv)}
                            />
                        ))
                    )}
                </ScrollArea>
            </aside>

            {/* Right — Chat view */}
            <main className="flex-1 min-w-0 bg-background">
                {selected ? (
                    <ChatPanel key={selected.id} conv={selected} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
                        <MessageSquare className="h-12 w-12 opacity-20" />
                        <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
                    </div>
                )}
            </main>
        </div>
    );
}
