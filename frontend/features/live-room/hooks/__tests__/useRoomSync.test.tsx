import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRoomSync } from '../useRoomSync';
import { RoomStateProvider } from '../../context/RoomStateContext';
import { WebSocketProvider } from '../../context/WebSocketContext';
import { onlineSessionApi } from '@/lib/services/onlineSession';

// Mock dependencies
vi.mock('@/lib/services/onlineSession');
vi.mock('../../context/WebSocketContext', async () => {
    const actual = await vi.importActual('../../context/WebSocketContext');
    return {
        ...actual,
        useWebSocket: () => ({ isConnected: true }),
        WebSocketProvider: ({ children }: { children: React.ReactNode }) => <div>{children} </div>
    };
});

// Mock RoomStateContext to avoid complex setup
const mockActions = {
    resetRoom: vi.fn(),
    setRoomId: vi.fn(),
    addParticipant: vi.fn(),
};

vi.mock('../../context/RoomStateContext', async () => {
    return {
        RoomStateProvider: ({ children }: { children: React.ReactNode }) => <div>{children} </div>,
        useRoomState: () => ({
            state: { roomId: null },
            actions: mockActions
        })
    };
});

describe('useRoomSync', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Setup default API response
        vi.mocked(onlineSessionApi.getRoomStats).mockResolvedValue({
            tutorName: 'Tutor Test',
            tutorPresent: true,
            studentName: 'Student Test',
            studentPresent: false,
        } as unknown as Awaited<ReturnType<typeof onlineSessionApi.getRoomStats>>); // Still need any here if the type is complex, but let's try to find the type
    });

    it('should fetch room stats only ONCE when connected', async () => {
        const roomId = 'test-room-123';

        // Render hook first time
        const { rerender } = renderHook(() => useRoomSync(roomId));

        // Wait for async operations
        await waitFor(() => {
            expect(onlineSessionApi.getRoomStats).toHaveBeenCalledTimes(1);
            expect(onlineSessionApi.getRoomStats).toHaveBeenCalledWith(roomId);
        });

        // Rerender hook (simulate parent re-render)
        rerender();

        // Should NOT fetch again
        expect(onlineSessionApi.getRoomStats).toHaveBeenCalledTimes(1);
    });

    it('should reset sync logic if roomId changes', async () => {
        const roomId1 = 'room-1';
        const roomId2 = 'room-2';

        const { rerender } = renderHook((props) => useRoomSync(props.roomId), {
            initialProps: { roomId: roomId1 }
        });

        await waitFor(() => {
            expect(onlineSessionApi.getRoomStats).toHaveBeenCalledWith(roomId1);
        });

        // Change room ID
        rerender({ roomId: roomId2 });

        await waitFor(() => {
            expect(onlineSessionApi.getRoomStats).toHaveBeenCalledWith(roomId2);
            expect(onlineSessionApi.getRoomStats).toHaveBeenCalledTimes(2); // Once for each room
        });
    });
});
