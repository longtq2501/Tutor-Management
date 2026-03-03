import { renderHook, act } from '@testing-library/react';
import { useChatTyping } from '../useChatTyping';
import { useWebSocket } from '../../context/WebSocketContext';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../../context/WebSocketContext', () => ({
    useWebSocket: vi.fn(),
}));

describe('useChatTyping', () => {
    let mockSendMessage: ReturnType<typeof vi.fn>;
    let mockSubscribe: ReturnType<typeof vi.fn>;
    let mockUnsubscribe: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockSendMessage = vi.fn();
        mockUnsubscribe = vi.fn();
        mockSubscribe = vi.fn().mockReturnValue(mockUnsubscribe);

        vi.mocked(useWebSocket).mockReturnValue({
            isConnected: true,
            sendMessage: mockSendMessage as any,
            subscribe: mockSubscribe as any,
        });

        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    it('should subscribe to typing topic on mount', () => {
        renderHook(() => useChatTyping('room-1', 1));
        expect(mockSubscribe).toHaveBeenCalledWith(
            '/topic/room/room-1/typing',
            expect.any(Function)
        );
    });

    it('should update typing users when receiving typing event', () => {
        const { result } = renderHook(() => useChatTyping('room-1', 1));

        const typingCallback = mockSubscribe.mock.calls[0][1];

        act(() => {
            typingCallback({ userId: 2, userName: 'Other User', typing: true });
        });

        expect(result.current.typingUsers).toContain('Other User');
    });

    it('should remove user when receiving typing stop event', () => {
        const { result } = renderHook(() => useChatTyping('room-1', 1));

        const typingCallback = mockSubscribe.mock.calls[0][1];

        act(() => {
            typingCallback({ userId: 2, userName: 'Other User', typing: true });
        });
        expect(result.current.typingUsers).toContain('Other User');

        act(() => {
            typingCallback({ userId: 2, userName: 'Other User', typing: false });
        });
        expect(result.current.typingUsers).not.toContain('Other User');
    });

    it('should auto-remove typing user after safety timeout', () => {
        const { result } = renderHook(() => useChatTyping('room-1', 1));

        const typingCallback = mockSubscribe.mock.calls[0][1];

        act(() => {
            typingCallback({ userId: 2, userName: 'Other User', typing: true });
        });
        expect(result.current.typingUsers).toContain('Other User');

        act(() => {
            vi.advanceTimersByTime(5001);
        });

        expect(result.current.typingUsers).not.toContain('Other User');
    });

    it('should send local typing status via WebSocket', () => {
        const { result } = renderHook(() => useChatTyping('room-1', 1));

        act(() => {
            result.current.setLocalTyping(true);
        });

        expect(mockSendMessage).toHaveBeenCalledWith(
            '/app/room/room-1/typing',
            { typing: true }
        );
    });
});
