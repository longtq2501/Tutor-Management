'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Smile } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(
    () => import('emoji-picker-react'),
    {
        ssr: false,
        loading: () => <div className="w-[280px] h-[350px] bg-muted animate-pulse rounded-md" />,
    }
);

interface ChatInputProps {
    onSendMessage: (content: string) => void;
    onTyping?: (isTyping: boolean) => void;
    disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onTyping, disabled }) => {
    const [message, setMessage] = useState('');
    const [emojiOpen, setEmojiOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const isTypingRef = useRef(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const stopTyping = useCallback(() => {
        if (isTypingRef.current) {
            isTypingRef.current = false;
            try { onTyping?.(false); } catch { /* ignore */ }
        }
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
    }, [onTyping]);

    const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMessage(val);

        try {
            if (!isTypingRef.current && val.trim()) {
                isTypingRef.current = true;
                onTyping?.(true);
            }
        } catch { /* ignore */ }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (val.trim()) {
            typingTimeoutRef.current = setTimeout(() => stopTyping(), 3000);
        } else {
            stopTyping();
        }
    };

    const handleEmojiClick = (emojiData: { emoji: string }) => {
        setMessage(prev => prev + emojiData.emoji);
        setEmojiOpen(false);
        // Re-focus input after emoji selection so keyboard stays open on mobile
        requestAnimationFrame(() => inputRef.current?.focus());

        if (!isTypingRef.current) {
            try {
                isTypingRef.current = true;
                onTyping?.(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => stopTyping(), 3000);
            } catch { /* ignore */ }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;
        onSendMessage(message.trim());
        setMessage('');
        stopTyping();
        // Keep focus on input after send so mobile keyboard stays open
        requestAnimationFrame(() => inputRef.current?.focus());
    };

    return (
        // No border-t here — ChatPanel wrapper handles the border
        // px-2 py-2 (smaller padding than before) so input isn't cramped on small screens
        <form
            onSubmit={handleSubmit}
            className="flex items-center gap-1.5 px-2 py-2 bg-background"
        >
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        className="shrink-0 h-9 w-9"
                        // Prevent form submit + prevent keyboard dismiss on mobile
                        onPointerDown={e => e.preventDefault()}
                    >
                        <Smile className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </PopoverTrigger>

                {/* 
                  * side="top" keeps picker above input.
                  * On mobile the Popover may still be clipped if the chat panel
                  * has overflow:hidden parents — avoidCollisions handles repositioning.
                  * z-[200] ensures it's above MediaControls overlay (z-20).
                  */}
                <PopoverContent
                    side="top"
                    align="start"
                    sideOffset={8}
                    className="w-auto p-0 border-none z-[200]"
                    // Prevent closing when tapping inside picker on mobile
                    onOpenAutoFocus={e => e.preventDefault()}
                >
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        width={280}
                        height={350}
                        previewConfig={{ showPreview: false }}
                        searchDisabled={false}
                        skinTonesDisabled
                    />
                </PopoverContent>
            </Popover>

            <Input
                ref={inputRef}
                value={message}
                onChange={handleMessageChange}
                placeholder="Nhập tin nhắn..."
                disabled={disabled}
                // enterkeyhint="send" shows "Send" on mobile keyboard instead of "Return"
                enterKeyHint="send"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="sentences"
                className="flex-1 h-9 text-sm"
                onKeyDown={e => {
                    // Submit on Enter (mobile keyboards fire keydown)
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as unknown as React.FormEvent);
                    }
                }}
            />

            <Button
                type="submit"
                size="icon"
                disabled={disabled || !message.trim()}
                className="shrink-0 h-9 w-9"
            >
                <Send className="h-4 w-4" />
            </Button>
        </form>
    );
};