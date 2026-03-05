'use client';

import { useEffect, useRef, useState } from 'react';
import { useChatMessages } from '../hooks/useChatMessages';
import { ChatInput } from './ChatInput';
import { useWebSocket } from '../context/WebSocketContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import type { ChatMessageResponse } from '@/lib/types/chat';
import { useChatTyping } from '../hooks/useChatTyping';

interface ChatPanelProps {
    roomId: string;
    currentUserId: number;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ roomId, currentUserId }) => {
    const {
        messages,
        loadMoreHistory,
        hasMoreHistory,
        isLoadingHistory,
        isLoadingInitial,
        addRealTimeMessage,
    } = useChatMessages(roomId);

    const { typingUsers, setLocalTyping } = useChatTyping(roomId, currentUserId);
    const { isConnected, sendMessage, subscribe } = useWebSocket();

    const listRef = useRef<HTMLDivElement>(null); // message list div (scrollable)
    const topObserverRef = useRef<HTMLDivElement>(null);
    const inputAreaRef = useRef<HTMLDivElement>(null); // input wrapper
    const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

    // ---- Subscribe to real-time messages ----
    useEffect(() => {
        if (!isConnected) return;
        const unsubscribe = subscribe(`/topic/room/${roomId}/chat`, (message) => {
            addRealTimeMessage(message as ChatMessageResponse);
        });
        return unsubscribe;
    }, [isConnected, roomId, subscribe, addRealTimeMessage]);

    const handleSendMessage = (content: string) => {
        sendMessage(`/app/room/${roomId}/chat`, { content });
    };

    // ---- Infinite scroll up (load history) ----
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreHistory && !isLoadingHistory) {
                    loadMoreHistory();
                    setShouldScrollToBottom(false);
                }
            },
            { threshold: 1.0 }
        );
        if (topObserverRef.current) observer.observe(topObserverRef.current);
        return () => observer.disconnect();
    }, [hasMoreHistory, isLoadingHistory, loadMoreHistory]);

    // ---- Auto scroll to bottom on new messages ----
    useEffect(() => {
        if (shouldScrollToBottom && listRef.current) {
            listRef.current.scrollTop = listRef.current.scrollHeight;
        }
    }, [messages, shouldScrollToBottom]);

    // ---- Scroll to bottom when keyboard opens on mobile ----
    // When the virtual keyboard appears, visualViewport shrinks.
    // We scroll the message list to keep latest messages visible
    // and ensure the input box stays in view.
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;

        const onResize = () => {
            // Small delay lets the browser finish layout before we scroll
            requestAnimationFrame(() => {
                if (listRef.current) {
                    listRef.current.scrollTop = listRef.current.scrollHeight;
                }
                // Scroll input into view explicitly for older iOS
                if (inputAreaRef.current) {
                    inputAreaRef.current.scrollIntoView({ block: 'end', behavior: 'smooth' });
                }
            });
        };

        vv.addEventListener('resize', onResize);
        return () => vv.removeEventListener('resize', onResize);
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const t = e.currentTarget;
        const isNearBottom = t.scrollHeight - t.scrollTop <= t.clientHeight + 100;
        setShouldScrollToBottom(isNearBottom);
    };

    if (isLoadingInitial) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        /*
         * Layout strategy (mobile-safe):
         *
         * ┌─────────────────────┐  ← flex col, h-full
         * │  Header "Trò chuyện"│  ← shrink-0
         * ├─────────────────────┤
         * │  Message list       │  ← flex-1, overflow-y-auto (native scroll, NOT Radix ScrollArea)
         * │  (scrollable)       │    Native scroll is required so visualViewport resize
         * │                     │    event can correctly scroll to bottom on keyboard open.
         * ├─────────────────────┤
         * │  Typing indicator   │  ← shrink-0
         * ├─────────────────────┤
         * │  ChatInput          │  ← shrink-0, sticky bottom, safe-area padding
         * └─────────────────────┘
         *
         * We deliberately avoid Radix ScrollArea here because its internal
         * viewport div makes visualViewport-based scroll calculations unreliable.
         */
        <div className="flex flex-col h-full bg-background">

            {/* Header */}
            <div className="px-4 py-3 border-b shrink-0">
                <h3 className="font-semibold text-sm">Trò chuyện</h3>
            </div>

            {/* Message list — native scroll */}
            <div
                ref={listRef}
                className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 space-y-4"
                onScroll={handleScroll}
            >
                {/* Top sentinel for infinite scroll */}
                <div ref={topObserverRef} className="h-4 w-full flex justify-center">
                    {isLoadingHistory && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>

                {messages.map((msg, index) => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                        <div
                            key={msg.id || `msg-${index}`}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                            <div className={`flex gap-2 max-w-[82%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <Avatar className="h-7 w-7 shrink-0">
                                    <AvatarFallback className="text-[10px]">
                                        {msg.senderName.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[10px] font-medium text-muted-foreground">
                                            {msg.senderName}
                                        </span>
                                        <Badge variant="outline" className="text-[9px] py-0 px-1 opacity-60">
                                            {msg.senderRole}
                                        </Badge>
                                    </div>
                                    <div
                                        className={`rounded-2xl px-3 py-2 text-sm leading-relaxed break-words ${isMe
                                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                : 'bg-muted text-foreground rounded-tl-sm'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground mt-1">
                                        {format(new Date(msg.timestamp), 'HH:mm', { locale: vi })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
                <div
                    className="px-4 py-1 text-[10px] text-muted-foreground italic animate-pulse shrink-0"
                    role="status"
                    aria-live="polite"
                >
                    {typingUsers.join(', ')} đang gõ...
                </div>
            )}

            {/* Input — sticky to bottom, respects iOS safe area & keyboard */}
            <div
                ref={inputAreaRef}
                className="shrink-0 border-t bg-background"
                style={{
                    // Ensures input stays above iOS home indicator and
                    // is not hidden behind the virtual keyboard on older WebKit
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                <ChatInput
                    onSendMessage={handleSendMessage}
                    onTyping={setLocalTyping}
                    disabled={!isConnected}
                />
            </div>
        </div>
    );
};