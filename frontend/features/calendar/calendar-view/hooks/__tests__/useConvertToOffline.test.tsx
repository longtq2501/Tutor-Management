import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConvertToOffline } from '../useConvertToOffline';
import { sessionsApi } from '@/lib/services/session';
import { toast } from 'sonner';
import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { SessionRecord, PageResponse } from '@/lib/types';

// Mock dependencies
vi.mock('@/lib/services/session', () => ({
    sessionsApi: {
        revertToOffline: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('useConvertToOffline', () => {
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

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    it('should revert to offline successfully', async () => {
        vi.mocked(sessionsApi.revertToOffline).mockResolvedValue(undefined as void);

        const { result } = renderHook(() => useConvertToOffline(), { wrapper });

        result.current.mutate(123);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(sessionsApi.revertToOffline).toHaveBeenCalledWith(123);
        expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Đã hủy phòng học Online'), expect.any(Object));
    });

    it('should handle error during reversion', async () => {
        const error = {
            response: {
                status: 400,
                data: { message: 'Cannot revert' }
            }
        };
        vi.mocked(sessionsApi.revertToOffline).mockRejectedValue(error);

        const { result } = renderHook(() => useConvertToOffline(), { wrapper });

        result.current.mutate(123);

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(toast.error).toHaveBeenCalledWith(
            expect.stringContaining('Cannot revert'),
            expect.any(Object)
        );
    });

    it('should perform optimistic update', async () => {
        queryClient.setQueryData(['sessions', '2023-10'], {
            content: [{ id: 1, isOnline: true }]
        });

        vi.mocked(sessionsApi.revertToOffline).mockImplementation(async () => {
            // Check cache during mutation
            const cache = queryClient.getQueryData<PageResponse<SessionRecord>>(['sessions', '2023-10']);
            expect(cache?.content[0].isOnline).toBe(false);
            return undefined as void;
        });

        const { result } = renderHook(() => useConvertToOffline(), { wrapper });

        result.current.mutate(1);

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
});
