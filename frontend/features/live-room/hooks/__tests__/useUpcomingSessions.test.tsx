import { renderHook, waitFor, act } from '@testing-library/react';
import { useUpcomingSessions } from '../useUpcomingSessions';
import { onlineSessionApi } from '@/lib/services/onlineSession';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';

// Mock API
vi.mock('@/lib/services/onlineSession', () => ({
    onlineSessionApi: {
        getMySessions: vi.fn(),
    },
}));

describe('useUpcomingSessions', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        vi.clearAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children);

    it('should handle pagination flow', async () => {
        const page1 = {
            content: [{ id: 1 }],
            last: false,
            position: { value: 'cursor-1' }
        };

        const page2 = {
            content: [{ id: 2 }],
            last: true,
            position: { value: 'cursor-2' }
        };

        vi.mocked(onlineSessionApi.getMySessions).mockImplementation(((cursor: unknown) => {
            if (!cursor) return Promise.resolve(page1);
            if (cursor === 'cursor-1') return Promise.resolve(page2);
            return Promise.reject(new Error('Invalid cursor: ' + cursor));
        }) as any);

        const { result } = renderHook(() => useUpcomingSessions(5), { wrapper });

        // 1. Initial Load
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data?.pages).toHaveLength(1);
        expect(result.current.hasNextPage).toBe(true);

        // 2. Fetch Next Page
        await act(async () => {
            await result.current.fetchNextPage();
        });

        // 3. Verify Result
        await waitFor(() => {
            if (result.current.isError) {
                console.error('Fetch Error:', result.current.error);
            }
            expect(result.current.isFetching).toBe(false);
        });

        if (result.current.data?.pages.length !== 2) {
            console.log('Pages:', JSON.stringify(result.current.data?.pages, null, 2));
        }

        expect(result.current.data?.pages).toHaveLength(2);

        expect(result.current.data?.pages[0].content[0].id).toBe(1);
        expect(result.current.data?.pages[1].content[0].id).toBe(2);
    });
});
