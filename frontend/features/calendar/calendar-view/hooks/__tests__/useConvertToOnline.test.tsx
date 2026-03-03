import { renderHook, act } from '@testing-library/react';
import { useConvertToOnline } from '../useConvertToOnline';
import { sessionsApi } from '@/lib/services/session';
import type { SessionRecord } from '@/lib/types/finance';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/services/session', () => ({
    sessionsApi: {
        convertToOnline: vi.fn(),
    },
}));

vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('useConvertToOnline', () => {
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

    const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children);

    it('should handle successful conversion', async () => {
        const mockResponse = {
            id: 1,
            roomId: 'room-123',
            roomStatus: 'WAITING',
            scheduledStart: '2024-01-01T10:00:00Z',
            scheduledEnd: '2024-01-01T11:00:00Z',
            tutorId: 1,
            tutorName: 'Tutor',
            studentId: 2,
            studentName: 'Student',
            canJoinNow: true
        };

        vi.mocked(sessionsApi.convertToOnline).mockResolvedValue(mockResponse as any);

        const { result } = renderHook(() => useConvertToOnline(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync(1);
        });

        expect(sessionsApi.convertToOnline).toHaveBeenCalledWith(1);
        expect(toast.success).toHaveBeenCalled();
    });

    it('should handle optimistically update cache (simulated)', async () => {
        // Setup initial cache
        queryClient.setQueryData(['calendar-sessions'], [{ id: 1, type: 'OFFLINE' }]);

        const mockResponse = { roomId: 'room-123' };
        vi.mocked(sessionsApi.convertToOnline).mockResolvedValue(mockResponse as any);

        const { result } = renderHook(() => useConvertToOnline(), { wrapper });

        await act(async () => {
            await result.current.mutateAsync(1);
        });

        expect(sessionsApi.convertToOnline).toHaveBeenCalledWith(1);
    });

    it('should handle conflict error (409)', async () => {
        const error = {
            response: {
                status: 409,
                data: { message: 'Already online' }
            }
        };

        vi.mocked(sessionsApi.convertToOnline).mockRejectedValue(error);

        const { result } = renderHook(() => useConvertToOnline(), { wrapper });

        await act(async () => {
            try {
                await result.current.mutateAsync(1);
            } catch (e) {
                // Ignore expected rejection
            }
        });

        expect(toast.error).toHaveBeenCalledWith(
            expect.stringContaining('Buổi học đã được chuyển sang Online rồi'),
            expect.anything()
        );
    });

    it('should handle permission error (403)', async () => {
        const error = {
            response: {
                status: 403,
                data: { message: 'Forbidden' }
            }
        };

        vi.mocked(sessionsApi.convertToOnline).mockRejectedValue(error);

        const { result } = renderHook(() => useConvertToOnline(), { wrapper });

        await act(async () => {
            try {
                await result.current.mutateAsync(1);
            } catch (e) { }
        });

        expect(toast.error).toHaveBeenCalledWith(
            expect.stringContaining('Bạn không có quyền chuyển đổi buổi học này'),
            expect.anything()
        );
    });
});
