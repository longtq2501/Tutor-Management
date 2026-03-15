import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useWhiteboardSync } from '../useWhiteboardSync';

// Mock WebSocket context
vi.mock('../../context/WebSocketContext', () => ({
    useWebSocket: () => ({
        subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
        sendMessage: vi.fn(),
        isConnected: true,
    }),
}));

// Mock WhiteboardPersistence
vi.mock('../useWhiteboardPersistence', () => ({
    useWhiteboardPersistence: () => ({
        loadFromStorage: () => [],
        clearStorage: vi.fn(),
        useAutoSave: vi.fn(),
    }),
}));

describe('useWhiteboardSync - Delta Protocol', () => {
    let mockSendMessage: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockSendMessage = vi.fn();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('should send delta messages every 50ms during drawing', async () => {
        const { result } = renderHook(() =>
            useWhiteboardSync('room-123', 'user-1', mockSendMessage as (destination: string, payload: unknown) => void)
        );

        // Start a stroke
        act(() => {
            result.current.startStroke({ x: 10, y: 10 });
        });

        // Add points rapidly (simulating fast drawing)
        act(() => {
            for (let i = 0; i < 5; i++) {
                result.current.addPoint({ x: 10 + i, y: 10 + i });
            }
        });

        // No delta sent yet (interval hasn't fired)
        expect(mockSendMessage).not.toHaveBeenCalled();

        // Advance time by 50ms - should send first delta
        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(mockSendMessage).toHaveBeenCalledTimes(1);
        expect(mockSendMessage).toHaveBeenCalledWith(
            '/app/room/room-123/whiteboard/delta',
            expect.objectContaining({
                type: 'STROKE_DELTA',
                strokeId: expect.any(String),
                points: expect.arrayContaining([{ x: 10, y: 10 }]),
                startIndex: 0,
            })
        );

        // Add more points
        act(() => {
            for (let i = 0; i < 3; i++) {
                result.current.addPoint({ x: 20 + i, y: 20 + i });
            }
        });

        // Advance another 50ms - should send second delta with only new points
        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(mockSendMessage).toHaveBeenCalledTimes(2);
        const secondDelta = mockSendMessage.mock.calls[1][1] as { startIndex: number; points: unknown[] };
        expect(secondDelta.startIndex).toBe(6); // After 6 points from first batch
        expect(secondDelta.points).toHaveLength(3); // Only new points
    });

    it('should send complete stroke on endStroke', () => {
        const { result } = renderHook(() =>
            useWhiteboardSync('room-123', 'user-1', mockSendMessage as (destination: string, payload: unknown) => void)
        );

        act(() => {
            result.current.startStroke({ x: 0, y: 0 });
            result.current.addPoint({ x: 1, y: 1 });
            result.current.addPoint({ x: 2, y: 2 });
        });

        mockSendMessage.mockClear();

        act(() => {
            result.current.endStroke();
        });

        // Should send complete stroke message
        expect(mockSendMessage).toHaveBeenCalledWith(
            '/app/room/room-123/whiteboard',
            expect.objectContaining({
                type: 'STROKE',
                stroke: expect.objectContaining({
                    points: expect.arrayContaining([
                        { x: 0, y: 0 },
                        { x: 1, y: 1 },
                        { x: 2, y: 2 },
                    ]),
                }),
            })
        );
    });

    it('should include stroke metadata in delta messages', () => {
        const { result } = renderHook(() =>
            useWhiteboardSync('room-123', 'user-1', mockSendMessage as (destination: string, payload: unknown) => void)
        );

        act(() => {
            result.current.setColor('#FF0000');
            result.current.setWidth(4);
            result.current.setTool('pen');
            result.current.startStroke({ x: 10, y: 10 });
        });

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(mockSendMessage).toHaveBeenCalledWith(
            '/app/room/room-123/whiteboard/delta',
            expect.objectContaining({
                color: '#FF0000',
                width: 4,
                tool: 'pen',
                userId: 'user-1',
            })
        );
    });

    it('should clear interval when drawing stops', () => {
        const { result } = renderHook(() =>
            useWhiteboardSync('room-123', 'user-1', mockSendMessage as (destination: string, payload: unknown) => void)
        );

        act(() => {
            result.current.startStroke({ x: 10, y: 10 });
        });

        act(() => {
            vi.advanceTimersByTime(50);
        });

        expect(mockSendMessage).toHaveBeenCalledTimes(1);
        mockSendMessage.mockClear();

        // End stroke - should clear interval
        act(() => {
            result.current.endStroke();
        });

        // Advance time - no more delta messages should be sent
        act(() => {
            vi.advanceTimersByTime(100);
        });

        // Only the complete stroke message from endStroke
        expect(mockSendMessage).toHaveBeenCalledTimes(1);
        expect(mockSendMessage).toHaveBeenCalledWith(
            '/app/room/room-123/whiteboard',
            expect.anything()
        );
    });

    it('should merge remote delta into existing stroke', () => {
        const { result } = renderHook(() =>
            useWhiteboardSync('room-123', 'user-1', mockSendMessage as (destination: string, payload: unknown) => void)
        );

        const delta1 = {
            type: 'STROKE_DELTA' as const,
            strokeId: 'remote-1',
            points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
            startIndex: 0,
            color: '#0000FF',
            width: 2,
            tool: 'pen' as const,
            userId: 'user-2',
        };

        act(() => {
            result.current.receiveRemoteDelta(delta1);
        });

        expect(result.current.strokes).toHaveLength(1);
        expect(result.current.strokes[0].points).toHaveLength(2);

        // Receive second delta for same stroke
        const delta2 = {
            ...delta1,
            points: [{ x: 2, y: 2 }, { x: 3, y: 3 }],
            startIndex: 2,
        };

        act(() => {
            result.current.receiveRemoteDelta(delta2);
        });

        // Should merge points into same stroke
        expect(result.current.strokes).toHaveLength(1);
        expect(result.current.strokes[0].points).toHaveLength(4);
        expect(result.current.strokes[0].points[3]).toEqual({ x: 3, y: 3 });
    });

    it('should ignore own delta messages (echo cancellation)', () => {
        const { result } = renderHook(() =>
            useWhiteboardSync('room-123', 'user-1', mockSendMessage as (destination: string, payload: unknown) => void)
        );

        const ownDelta = {
            type: 'STROKE_DELTA' as const,
            strokeId: 'stroke-1',
            points: [{ x: 0, y: 0 }],
            startIndex: 0,
            color: '#000000',
            width: 2,
            tool: 'pen' as const,
            userId: 'user-1', // Same as current user
        };

        act(() => {
            result.current.receiveRemoteDelta(ownDelta);
        });

        // Should not add own stroke
        expect(result.current.strokes).toHaveLength(0);
    });

    it('should handle complete stroke messages from remote users', () => {
        const { result } = renderHook(() =>
            useWhiteboardSync('room-123', 'user-1', mockSendMessage as (destination: string, payload: unknown) => void)
        );

        const completeMessage = {
            type: 'STROKE' as const,
            stroke: {
                id: 'remote-1',
                points: [{ x: 50, y: 50 }, { x: 51, y: 51 }],
                color: '#0000FF',
                width: 2,
                tool: 'pen' as const,
                timestamp: Date.now(),
                userId: 'user-2',
            },
        };

        act(() => {
            result.current.receiveRemoteStroke(completeMessage);
        });

        expect(result.current.strokes).toHaveLength(1);
        expect(result.current.strokes[0]).toEqual(completeMessage.stroke);
    });

    it('should clear board and send clear message', () => {
        const { result } = renderHook(() =>
            useWhiteboardSync('room-123', 'user-1', mockSendMessage as (destination: string, payload: unknown) => void)
        );

        act(() => {
            result.current.startStroke({ x: 10, y: 10 });
            result.current.endStroke();
        });

        expect(result.current.strokes).toHaveLength(1);

        act(() => {
            result.current.clearBoard();
        });

        expect(result.current.strokes).toHaveLength(0);
        expect(mockSendMessage).toHaveBeenCalledWith(
            '/app/room/room-123/whiteboard/clear',
            {
                type: 'CLEAR',
                userId: 'user-1',
            }
        );
    });

    describe('Undo/Redo functionality', () => {
        it('should undo the last stroke and send undo message', () => {
            const { result } = renderHook(() =>
                useWhiteboardSync('room-123', 'user-1', mockSendMessage as (destination: string, payload: unknown) => void)
            );

            act(() => {
                result.current.startStroke({ x: 10, y: 10 });
                result.current.endStroke();
            });

            expect(result.current.strokes).toHaveLength(1);

            act(() => {
                result.current.undoBoard();
            });

            expect(result.current.strokes).toHaveLength(0);
            expect(result.current.redoStack).toHaveLength(1);
            expect(mockSendMessage).toHaveBeenCalledWith(
                '/app/room/room-123/whiteboard/undo',
                { 
                    type: 'UNDO',
                    id: expect.any(String),
                    userId: 'user-1',
                }
            );
        });

        it('should redo the last undone stroke', () => {
            const { result } = renderHook(() =>
                useWhiteboardSync('room-123', 'user-1', mockSendMessage as (destination: string, payload: unknown) => void)
            );

            act(() => {
                result.current.startStroke({ x: 10, y: 10 });
                result.current.endStroke();
                result.current.undoBoard();
            });

            expect(result.current.strokes).toHaveLength(0);

            act(() => {
                result.current.redoBoard();
            });

            expect(result.current.strokes).toHaveLength(1);
            expect(result.current.redoStack).toHaveLength(0);
            // Redo sends complete stroke
            expect(mockSendMessage).toHaveBeenLastCalledWith(
                '/app/room/room-123/whiteboard',
                expect.objectContaining({
                    type: 'STROKE',
                    stroke: expect.objectContaining({ points: [{ x: 10, y: 10 }] }),
                })
            );
        });

        it('should clear redo stack when a new stroke starts', () => {
            const { result } = renderHook(() =>
                useWhiteboardSync('room-123', 'user-1', mockSendMessage as (destination: string, payload: unknown) => void)
            );

            act(() => {
                result.current.startStroke({ x: 10, y: 10 });
                result.current.endStroke();
                result.current.undoBoard();
            });

            expect(result.current.redoStack).toHaveLength(1);

            act(() => {
                result.current.startStroke({ x: 20, y: 20 });
            });

            expect(result.current.redoStack).toHaveLength(0);
        });
    });
});
