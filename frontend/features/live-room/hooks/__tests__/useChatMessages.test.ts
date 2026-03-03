import { renderHook, act } from '@testing-library/react';
import { useChatMessages } from '../useChatMessages';
import { chatApi, type PaginatedChatResponse } from '@/lib/services/chat';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

vi.mock('@/lib/services/chat', () => ({
    chatApi: {
        getMessages: vi.fn(),
    },
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

describe('useChatMessages', () => {
    beforeEach(() => {
        queryClient.clear();
        vi.clearAllMocks();
    });

    it('should fetch initial messages correctly', async () => {
        const mockData = {
            content: [
                { id: 1, roomId: 'room-1', senderId: 1, senderName: 'User', senderRole: 'TUTOR', content: 'Hello', timestamp: new Date().toISOString() }
            ],
            last: true,
            number: 0,
            totalPages: 1,
        } as unknown as PaginatedChatResponse;

        vi.mocked(chatApi.getMessages).mockResolvedValue(mockData);

        const { result } = renderHook(() => useChatMessages('room-1'), { wrapper });

        // Wait for loading to finish
        await vi.waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0].content).toBe('Hello');
    });

    it('should handle real-time messages correctly', async () => {
        vi.mocked(chatApi.getMessages).mockResolvedValue({
            content: [],
            last: true,
            number: 0,
            totalPages: 1,
        } as unknown as PaginatedChatResponse);

        const { result } = renderHook(() => useChatMessages('room-1'), { wrapper });

        await vi.waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

        act(() => {
            result.current.addRealTimeMessage({
                id: 2,
                roomId: 'room-1',
                senderId: 2,
                senderName: 'Other',
                senderRole: 'STUDENT',
                content: 'Real-time',
                timestamp: new Date().toISOString()
            });
        });

        expect(result.current.messages).toHaveLength(1);
        expect(result.current.messages[0].content).toBe('Real-time');
    });

    it('should correctly order historical and real-time messages', async () => {
        // Mock historical data from backend: newest first
        const mockHistory = [
            { id: 2, roomId: 'room-1', senderId: 1, senderName: 'User', senderRole: 'TUTOR', content: 'Middle', timestamp: '2024-01-01T10:01:00Z' },
            { id: 1, roomId: 'room-1', senderId: 1, senderName: 'User', senderRole: 'TUTOR', content: 'Oldest', timestamp: '2024-01-01T10:00:00Z' }
        ] as unknown as NonNullable<PaginatedChatResponse['content']>; // Intentional bypass for partial mock list

        vi.mocked(chatApi.getMessages).mockResolvedValue({
            content: mockHistory,
            last: true,
            number: 0,
            totalPages: 1,
        } as unknown as PaginatedChatResponse);

        const { result } = renderHook(() => useChatMessages('room-1'), { wrapper });

        await vi.waitFor(() => expect(result.current.isLoadingInitial).toBe(false));

        act(() => {
            result.current.addRealTimeMessage({
                id: 3,
                roomId: 'room-1',
                senderId: 1,
                senderName: 'User',
                senderRole: 'TUTOR',
                content: 'Newest',
                timestamp: '2024-01-01T10:02:00Z'
            });
        });

        expect(result.current.messages).toHaveLength(3);
        // Page result [Middle, Oldest] reversed -> [Oldest, Middle]
        // Appended real-time -> [Oldest, Middle, Newest]
        expect(result.current.messages[0].content).toBe('Oldest');
        expect(result.current.messages[1].content).toBe('Middle');
        expect(result.current.messages[2].content).toBe('Newest');
    });
});
