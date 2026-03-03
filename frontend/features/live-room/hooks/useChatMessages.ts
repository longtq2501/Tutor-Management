import { useInfiniteQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { chatApi } from '@/lib/services/chat';
import type { ChatMessageResponse } from '@/lib/types/chat';

/**
 * Hook for managing chat messages with infinite scroll (top-loading) and real-time updates.
 * @param {string} roomId - The unique room identifier.
 */
export const useChatMessages = (roomId: string) => {
    const [realTimeMessages, setRealTimeMessages] = useState<ChatMessageResponse[]>([]);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
    } = useInfiniteQuery({
        queryKey: ['chat-messages', roomId],
        queryFn: ({ pageParam = 0 }) => chatApi.getMessages(roomId, pageParam),
        getNextPageParam: (lastPage) => {
            if (lastPage.last) return undefined;
            return lastPage.number + 1;
        },
        initialPageParam: 0,
    });

    /**
     * Add a real-time message to the list.
     * @param {ChatMessageResponse} message - The message received via WebSocket.
     */
    const addRealTimeMessage = useCallback((message: ChatMessageResponse) => {
        setRealTimeMessages((prev) => [...prev, message]);
    }, []);

    /**
     * Clear all real-time messages (e.g., on room exit or refresh).
     */
    const clearMessages = useCallback(() => {
        setRealTimeMessages([]);
    }, []);

    // Flatten pages into a single message array
    // Since backend returns DESC (newest first for pagination), we reverse it for display
    // BUT for infinite scroll up, we want newest at the bottom.
    // The InfiniteQuery pages:
    // Page 0: [msg100, msg99, ... msg51]
    // Page 1: [msg50, msg49, ... msg1]

    const historicalMessages = data?.pages
        .flatMap((page) => page.content)
        .reverse() || [];

    const combined = [...historicalMessages, ...realTimeMessages];

    // Deduplicate by ID
    const allMessages = Array.from(
        new Map(combined.map(msg => [msg.id || `temp-${msg.timestamp}-${msg.senderId || 'anon'}`, msg])).values()
    );

    return {
        messages: allMessages,
        loadMoreHistory: fetchNextPage,
        hasMoreHistory: hasNextPage,
        isLoadingHistory: isFetchingNextPage,
        isLoadingInitial: isLoading,
        isError,
        addRealTimeMessage,
        clearMessages
    };
};
