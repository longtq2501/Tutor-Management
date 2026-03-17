'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, MessageCircle, Send, X } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supportApi } from '@/lib/services/support';
import { SupportMessage } from '@/lib/types/support';
import { useFeedbackChat } from '../hooks/useFeedbackChat';
import type { UserInfo } from '@/lib/services/auth';

type MessageType = 'TEXT' | 'BUG_REPORT' | 'FEATURE_REQUEST';

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

const TYPE_LABELS: Record<MessageType, string> = {
    TEXT: 'Góp ý chung',
    BUG_REPORT: 'Báo lỗi',
    FEATURE_REQUEST: 'Đề xuất tính năng',
};

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    OPEN: { label: 'Đang mở', variant: 'default' },
    RESOLVED: { label: 'Đã giải quyết', variant: 'secondary' },
};

// ─── Inner widget (all hooks unconditionally inside) ──────────────────────────

function FeedbackWidgetInner({ user }: { user: UserInfo }) {
    const [open, setOpen] = useState(false);
    const [content, setContent] = useState('');
    const [type, setType] = useState<MessageType>('TEXT');
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    const { data: conversation } = useQuery({
        queryKey: ['support-conversation'],
        queryFn: supportApi.getMyConversation,
        enabled: open,
        staleTime: 60_000,
    });

    const { data: history } = useQuery({
        queryKey: ['support-messages', conversation?.id],
        queryFn: () => supportApi.getMyMessages(),
        enabled: !!conversation?.id,
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
    }, []);

    const { isConnected, sendMessage } = useFeedbackChat({
        conversationId: conversation?.id ?? null,
        onNewMessage: handleNewMessage,
    });

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        const trimmed = content.trim();
        if (!trimmed || sending) return;
        setSending(true);
        try {
            if (isConnected && conversation?.id) {
                sendMessage({ content: trimmed, type });
            } else {
                setTimeout(() => {
                    queryClient.invalidateQueries({ queryKey: ['support-messages'] });
                }, 500);
            }
            setContent('');
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const statusInfo = conversation ? (STATUS_BADGE[conversation.status] ?? STATUS_BADGE.OPEN) : null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="w-[360px] max-h-[560px] flex flex-col rounded-2xl shadow-2xl border border-border bg-background overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground">
                            <div className="flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                <span className="font-semibold text-sm">Hỗ trợ &amp; Phản hồi</span>
                                {statusInfo && (
                                    <Badge variant={statusInfo.variant} className="text-[10px] h-4 px-1.5">
                                        {statusInfo.label}
                                    </Badge>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-primary-foreground hover:bg-white/20"
                                onClick={() => setOpen(false)}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Intro banner when no messages */}
                        {messages.length === 0 && (
                            <div className="px-4 py-3 bg-muted/50 border-b border-border text-xs text-muted-foreground leading-relaxed">
                                Bạn gặp lỗi hoặc có góp ý? Hãy nhắn tin cho chúng tôi — đội ngũ sẽ phản hồi trong thời gian sớm nhất.
                            </div>
                        )}

                        {/* Messages */}
                        <ScrollArea className="flex-1 px-3 py-2">
                            <div className="flex flex-col gap-2">
                                {messages.map((msg) => {
                                    const isMyMsg = msg.senderId === user.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col max-w-[80%] gap-1 ${isMyMsg ? 'self-end items-end' : 'self-start items-start'}`}
                                        >
                                            {!isMyMsg && (
                                                <span className="text-[10px] font-medium text-muted-foreground px-1">
                                                    {msg.senderName}
                                                </span>
                                            )}
                                            <div
                                                className={`rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                                    isMyMsg
                                                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                        : 'bg-muted text-foreground rounded-tl-sm'
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
                                                {formatDate(msg.createdAt)} {formatTime(msg.createdAt)}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>
                        </ScrollArea>

                        {/* Input area */}
                        {conversation?.status !== 'RESOLVED' ? (
                            <div className="border-t border-border p-3 flex flex-col gap-2">
                                <Select value={type} onValueChange={(v) => setType(v as MessageType)}>
                                    <SelectTrigger className="h-7 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(Object.entries(TYPE_LABELS) as [MessageType, string][]).map(([v, label]) => (
                                            <SelectItem key={v} value={v} className="text-xs">
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex gap-2 items-end">
                                    <Textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Nhập tin nhắn... (Enter để gửi)"
                                        className="min-h-[60px] max-h-[120px] text-sm resize-none"
                                        maxLength={2000}
                                    />
                                    <Button
                                        size="icon"
                                        className="shrink-0 h-9 w-9"
                                        disabled={!content.trim() || sending}
                                        onClick={handleSend}
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground text-center">
                                Cuộc trò chuyện này đã được đánh dấu giải quyết.
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating trigger button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setOpen((v) => !v)}
                className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl flex items-center justify-center transition-shadow"
                aria-label="Mở hỗ trợ"
            >
                <AnimatePresence mode="wait">
                    {open ? (
                        <motion.span
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <X className="h-5 w-5" />
                        </motion.span>
                    ) : (
                        <motion.span
                            key="open"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            <MessageCircle className="h-5 w-5" />
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        </div>
    );
}

// ─── Public export (guards role before rendering hooks) ───────────────────────

export function FeedbackWidget() {
    const { user, hasAnyRole } = useAuth();
    if (!user || !hasAnyRole(['TUTOR', 'STUDENT'])) return null;
    return <FeedbackWidgetInner user={user} />;
}
