import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useBillableTimer } from '../hooks/useBillableTimer';
import { useRoomState } from '../context/RoomStateContext';
import { onlineSessionApi } from '@/lib/services/onlineSession';

// Mock dependencies
vi.mock('../context/RoomStateContext');
vi.mock('@/lib/services/onlineSession');

describe('useBillableTimer', () => {
    const mockRoomId = 'test-room-123';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Mock Date.now() to control time flow
        vi.setSystemTime(new Date('2024-01-01T10:00:00Z'));

        // Default mock implementation
        vi.mocked(useRoomState).mockReturnValue({
            state: { participants: [] },
            dispatch: vi.fn(),
        } as unknown as ReturnType<typeof useRoomState>);

        vi.mocked(onlineSessionApi.getRoomStats).mockResolvedValue({
            durationMinutes: 0
        } as any);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should initialize with 00:00', async () => {
        const { result } = renderHook(() => useBillableTimer(mockRoomId));
        expect(result.current.formattedTime).toBe('00:00');
        expect(result.current.isBillable).toBe(false);
    });

    it('should load historical duration from API', async () => {
        vi.mocked(onlineSessionApi.getRoomStats).mockResolvedValue({
            durationMinutes: 10 // 600 seconds
        } as any);

        const { result } = renderHook(() => useBillableTimer(mockRoomId));

        // Wait for async effect
        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.formattedTime).toBe('10:00');
    });

    it('should count up when both participants are present', async () => {
        const startTime = new Date('2024-01-01T10:00:00Z');
        // Both joined at start time
        const joinedAt = startTime.toISOString();

        vi.mocked(useRoomState).mockReturnValue({
            state: {
                participants: [
                    { id: '1', role: 'TUTOR', joinedAt },
                    { id: '2', role: 'STUDENT', joinedAt }
                ]
            },
            dispatch: vi.fn()
        } as unknown as ReturnType<typeof useRoomState>);

        const { result } = renderHook(() => useBillableTimer(mockRoomId));

        // Advance 5 seconds
        await act(async () => {
            vi.advanceTimersByTime(5000);
        });

        expect(result.current.isBillable).toBe(true);
        expect(result.current.formattedTime).toBe('00:05');
    });

    it('should NOT count up if only one participant is present', async () => {
        const startTime = new Date('2024-01-01T10:00:00Z');
        const joinedAt = startTime.toISOString();

        vi.mocked(useRoomState).mockReturnValue({
            state: {
                participants: [
                    { id: '1', role: 'TUTOR', joinedAt }
                ]
            },
            dispatch: vi.fn(),
        } as unknown as ReturnType<typeof useRoomState>);

        const { result } = renderHook(() => useBillableTimer(mockRoomId));

        await act(async () => {
            vi.advanceTimersByTime(5000);
        });

        expect(result.current.formattedTime).toBe('00:00');
        expect(result.current.isBillable).toBe(false);
    });

    it('should combine base duration with real-time overlap', async () => {
        vi.mocked(onlineSessionApi.getRoomStats).mockResolvedValue({
            durationMinutes: 10 // 600 seconds base
        } as any);

        const startTime = new Date('2024-01-01T10:00:00Z');
        const joinedAt = startTime.toISOString();

        vi.mocked(useRoomState).mockReturnValue({
            state: {
                participants: [
                    { id: '1', role: 'TUTOR', joinedAt },
                    { id: '2', role: 'STUDENT', joinedAt }
                ]
            },
            dispatch: vi.fn()
        } as unknown as ReturnType<typeof useRoomState>);

        const { result } = renderHook(() => useBillableTimer(mockRoomId));

        // Wait for fetch
        await act(async () => {
            await Promise.resolve();
        });

        // Advance 30 seconds
        await act(async () => {
            vi.advanceTimersByTime(30000);
        });

        // 10:00 (base) + 00:30 (live) = 10:30
        expect(result.current.formattedTime).toBe('10:30');
    });

    it('should poll for stats updates', async () => {
        // First call returns 0
        vi.mocked(onlineSessionApi.getRoomStats)
            .mockResolvedValueOnce({ durationMinutes: 0 } as any)
            .mockResolvedValueOnce({ durationMinutes: 5 } as any); // Second call (poll) returns 5 min

        const { result } = renderHook(() => useBillableTimer(mockRoomId));

        // Wait for initial fetch
        await act(async () => {
            await Promise.resolve();
        });
        expect(result.current.formattedTime).toBe('00:00');

        // Advance 30 seconds (POLLING_INTERVAL)
        await act(async () => {
            vi.advanceTimersByTime(30000);
        });

        // Should now have fetched new stats (5 mins)
        expect(result.current.formattedTime).toBe('05:00');
    });

    it('should abort API call on unmount', async () => {
        const abortSpy = vi.fn();

        vi.mocked(onlineSessionApi.getRoomStats).mockImplementation(
            (roomId: string, options?: { signal?: AbortSignal }) => {
                options?.signal?.addEventListener('abort', abortSpy);
                return new Promise(resolve => setTimeout(() => resolve({ durationMinutes: 0 } as any), 1000));
            }
        );

        const { unmount } = renderHook(() => useBillableTimer(mockRoomId));

        // Unmount before API resolves
        unmount();

        expect(abortSpy).toHaveBeenCalled();
    });

    it('should handle participant rejoin correctly', async () => {
        const startTime = new Date('2024-01-01T10:00:00Z');

        // Initial: both joined at 10:00
        vi.mocked(useRoomState).mockReturnValue({
            state: {
                participants: [
                    { id: '1', role: 'TUTOR', joinedAt: startTime.toISOString() },
                    { id: '2', role: 'STUDENT', joinedAt: startTime.toISOString() }
                ]
            },
            dispatch: vi.fn()
        } as unknown as ReturnType<typeof useRoomState>);

        const { result, rerender } = renderHook(() => useBillableTimer(mockRoomId));

        // Advance 5 minutes
        await act(async () => {
            vi.advanceTimersByTime(300000);
        });
        expect(result.current.formattedTime).toBe('05:00');

        // Tutor leaves
        vi.mocked(useRoomState).mockReturnValue({
            state: { participants: [{ id: '2', role: 'STUDENT', joinedAt: startTime.toISOString() }] },
            dispatch: vi.fn()
        } as unknown as ReturnType<typeof useRoomState>);
        rerender();

        await act(async () => {
            vi.advanceTimersByTime(1000);
        });
        expect(result.current.isBillable).toBe(false);

        // Backend saves the 5 minutes
        vi.mocked(onlineSessionApi.getRoomStats).mockResolvedValue({
            durationMinutes: 5
        } as any);

        // Tutor rejoins 1 minute later
        const rejoinTime = new Date('2024-01-01T10:06:00Z');
        vi.setSystemTime(rejoinTime);

        vi.mocked(useRoomState).mockReturnValue({
            state: {
                participants: [
                    { id: '1', role: 'TUTOR', joinedAt: rejoinTime.toISOString() }, // New joinedAt
                    { id: '2', role: 'STUDENT', joinedAt: startTime.toISOString() }
                ]
            },
            dispatch: vi.fn()
        } as unknown as ReturnType<typeof useRoomState>);
        rerender();

        // Polling happens
        await act(async () => {
            vi.advanceTimersByTime(30000);
        });

        // 5 min (base from poll) + 30 sec (new overlap: 10:06:00 to 10:06:30)
        expect(result.current.formattedTime).toBe('05:30');
    });

    it('should format time correctly for hours', async () => {
        vi.mocked(onlineSessionApi.getRoomStats).mockResolvedValue({
            durationMinutes: 65 // 1 hour 5 minutes
        } as any);

        const { result } = renderHook(() => useBillableTimer(mockRoomId));

        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.formattedTime).toBe('1:05:00');
    });

    it('should NOT double-count when polling during active overlap (Standard Lifecycle)', async () => {
        const startTime = new Date('2024-01-01T10:00:00Z');

        // Mock API to return 0 (simulating no background save)
        vi.mocked(onlineSessionApi.getRoomStats).mockResolvedValue({
            durationMinutes: 0
        } as any);

        vi.mocked(useRoomState).mockReturnValue({
            state: {
                participants: [
                    { id: '1', role: 'TUTOR', joinedAt: startTime.toISOString() },
                    { id: '2', role: 'STUDENT', joinedAt: startTime.toISOString() }
                ]
            },
            dispatch: vi.fn()
        } as unknown as ReturnType<typeof useRoomState>);

        const { result } = renderHook(() => useBillableTimer(mockRoomId));

        // Initial fetch
        await act(async () => {
            await Promise.resolve();
        });

        // Advance 5 minutes (300s)
        await act(async () => {
            vi.advanceTimersByTime(300000);
        });

        // Current real-time overlap = 300s, Base = 0 => Total = 5:00
        expect(result.current.formattedTime).toBe('05:00');

        // Polling happens (30s interval)
        // Since backend mock still returns 0, Base remains 0. Timer remains 5:00.
        await act(async () => {
            vi.advanceTimersByTime(30000);
        });
        expect(result.current.formattedTime).toBe('05:30');
    });
});
