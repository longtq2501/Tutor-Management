'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Smile } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false, loading: () => <div className="w-[300px] h-[400px] bg-muted animate-pulse rounded-md" /> });

interface ChatInputProps {
    onSendMessage: (content: string) => void;
    onTyping?: (isTyping: boolean) => void;
    disabled?: boolean;
}

/**
 * Chat input component with send button and emoji picker.
 */
export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onTyping, disabled }) => {
    const [message, setMessage] = useState('');
    const isTypingRef = useRef(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const stopTyping = useCallback(() => {
        if (isTypingRef.current) {
            isTypingRef.current = false;
            try {
                onTyping?.(false);
            } catch (err) {
                console.warn('Failed to send typing stop status:', err);
            }
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
        } catch (err) {
            console.warn('Failed to send typing start status:', err);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        if (val.trim()) {
            typingTimeoutRef.current = setTimeout(() => {
                stopTyping();
            }, 3000); // Stop typing after 3s of inactivity
        }
    };

    const handleEmojiClick = (emojiData: { emoji: string }) => {
        setMessage((prev) => prev + emojiData.emoji);
        // Trigger typing if not already
        if (!isTypingRef.current) {
            try {
                isTypingRef.current = true;
                onTyping?.(true);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => stopTyping(), 3000);
            } catch (err) {
                // ignore
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
            stopTyping();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t border-border bg-background">
            <Popover>
                <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" disabled={disabled}>
                        <Smile className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto p-0 border-none">
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        width={300}
                        height={400}
                        previewConfig={{ showPreview: false }}
                    />
                </PopoverContent>
            </Popover>

            <Input
                value={message}
                onChange={handleMessageChange}
                placeholder="Nhập tin nhắn..."
                disabled={disabled}
                className="flex-1"
            />
            <Button type="submit" size="icon" disabled={disabled || !message.trim()}>
                <Send className="h-4 w-4" />
            </Button>
        </form>
    );
};
