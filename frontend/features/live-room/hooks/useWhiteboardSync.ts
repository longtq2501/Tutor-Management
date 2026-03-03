import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useWhiteboardPersistence } from './useWhiteboardPersistence';
import { useWebSocket } from '../context/WebSocketContext';
import { onlineSessionApi } from '@/lib/services/onlineSession';

/**
 * Message payload for whiteboard synchronization.
 * Supports both delta updates (during drawing) and complete strokes (on end).
 */
interface StrokeDeltaMessage {
    type: 'STROKE_DELTA';
    strokeId: string;
    points: StrokePoint[];
    startIndex: number;
    color: string;
    width: number;
    tool: 'pen' | 'eraser';
    userId?: string;
}

interface CompleteStrokeMessage {
    type: 'STROKE';
    stroke: Stroke;
}

interface ClearMessage {
    type: 'CLEAR';
    userId?: string;
}

interface UndoMessage {
    type: 'UNDO';
    id: string;
    userId?: string;
}

type SyncMessage = StrokeDeltaMessage | CompleteStrokeMessage | ClearMessage | UndoMessage;

/**
 * Stroke data structure for whiteboard drawing.
 */
export interface StrokePoint {
    x: number;
    y: number;
}

export interface Stroke {
    id: string;
    points: StrokePoint[];
    color: string;
    width: number;
    tool: 'pen' | 'eraser';
    timestamp: number;
    userId?: string; // Track who made the stroke
}

export interface WhiteboardSyncState {
    strokes: Stroke[];
    currentStroke: Stroke | null;
    redoStack: Stroke[]; // Stacks for undo/redo
    selectedColor: string;
    selectedWidth: number;
    selectedTool: 'pen' | 'eraser';
    isDrawing: boolean;
}

export interface WhiteboardSyncActions {
    startStroke: (point: StrokePoint) => void;
    addPoint: (point: StrokePoint) => void;
    endStroke: () => void;
    clearBoard: () => void;
    undoBoard: () => void;
    redoBoard: () => void;
    setColor: (color: string) => void;
    setWidth: (width: number) => void;
    setTool: (tool: 'pen' | 'eraser') => void;
    receiveRemoteStroke: (stroke: Stroke) => void;
    receiveRemoteUndo: (strokeId: string) => void;
    getMyStrokesCount: () => number;
}


/**
 * Hook for managing whiteboard drawing with interval-based delta sync.
 * Sends only new points every 50ms (batched deltas) to reduce payload size by 80%+.
 * Sends complete stroke on endStroke for final reconciliation.
 */
export const useWhiteboardSync = (
    roomId: string,
    currentUserId?: string | number,
    sendMessage?: (destination: string, payload: unknown) => void
) => {
    const { loadFromStorage, clearStorage, useAutoSave } = useWhiteboardPersistence(roomId);

    // Hydrate initial state from localStorage
    const savedStrokes = useMemo(() => loadFromStorage(), [loadFromStorage]);

    const [state, setState] = useState<WhiteboardSyncState>(() => ({
        strokes: savedStrokes,
        currentStroke: null,
        redoStack: [],
        selectedColor: '#000000',
        selectedWidth: 2,
        selectedTool: 'pen',
        isDrawing: false,
    }));

    // Periodically save to localStorage (10s interval defined in useWhiteboardPersistence)
    useAutoSave(state.strokes);

    // ✅ Hydrate from Backend on mount
    useEffect(() => {
        const fetchStrokes = async () => {
            try {
                const fetchedStrokes = await onlineSessionApi.getWhiteboardStrokes(roomId);
                if (fetchedStrokes.length > 0) {
                    setState(prev => {
                        const merged = [...prev.strokes];
                        fetchedStrokes.forEach((fs: any) => {
                            if (!merged.find(s => s.id === fs.id)) {
                                merged.push(fs);
                            }
                        });
                        return { ...prev, strokes: merged.sort((a, b) => a.timestamp - b.timestamp) };
                    });
                }
            } catch (error) {
                console.error('[Whiteboard] Failed to fetch strokes from backend:', error);
            }
        };

        if (roomId) {
            fetchStrokes();
        }
    }, [roomId]);

    // Track last sent point index for delta protocol
    const lastSentIndexRef = useRef<number>(0);
    // Ref to access latest state in interval callback
    const stateRef = useRef(state);

    // Keep stateRef updated with latest state
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    /**
     * Interval-based delta sender: sends only new points every 50ms during drawing.
     * Eliminates race conditions and reduces payload size by 80%+.
     * Uses stateRef to access latest state in interval callback.
     */
    useEffect(() => {
        if (!sendMessage) return;

        // Only run interval when drawing
        if (!state.isDrawing || !state.currentStroke) {
            lastSentIndexRef.current = 0;
            return;
        }

        const intervalId = setInterval(() => {
            // Read from ref to get latest state
            const currentState = stateRef.current;
            const stroke = currentState.currentStroke;

            if (!stroke || !currentState.isDrawing) return;

            const newPoints = stroke.points.slice(lastSentIndexRef.current);
            if (newPoints.length > 0) {
                const deltaMessage: StrokeDeltaMessage = {
                    type: 'STROKE_DELTA',
                    strokeId: stroke.id,
                    points: newPoints,
                    startIndex: lastSentIndexRef.current,
                    color: stroke.color,
                    width: stroke.width,
                    tool: stroke.tool,
                    userId: currentUserId?.toString(),
                };
                sendMessage(`/app/room/${roomId}/whiteboard/delta`, deltaMessage);
                lastSentIndexRef.current = stroke.points.length;
            }
        }, 50);

        return () => clearInterval(intervalId);
    }, [state.isDrawing, state.currentStroke?.id, sendMessage, roomId, currentUserId]);


    const startStroke = useCallback((point: StrokePoint) => {
        setState(prev => {
            const newStroke: Stroke = {
                id: `${Date.now()}-${Math.random()}`,
                points: [point],
                color: prev.selectedColor,
                width: prev.selectedWidth,
                tool: prev.selectedTool,
                timestamp: Date.now(),
                userId: currentUserId?.toString(),
            };

            return {
                ...prev,
                currentStroke: newStroke,
                isDrawing: true,
                redoStack: [], // Clear redo stack on new action
            };
        });
    }, [currentUserId]);

    const addPoint = useCallback((point: StrokePoint) => {
        setState(prev => {
            if (!prev.currentStroke) return prev;

            const updatedStroke = {
                ...prev.currentStroke,
                points: [...prev.currentStroke.points, point],
            };

            return {
                ...prev,
                currentStroke: updatedStroke,
            };
        });
    }, []);

    const endStroke = useCallback(() => {
        setState(prev => {
            if (!prev.currentStroke) return prev;

            // Send complete stroke for final reconciliation
            if (sendMessage) {
                const completeMessage: CompleteStrokeMessage = {
                    type: 'STROKE',
                    stroke: prev.currentStroke,
                };
                sendMessage(`/app/room/${roomId}/whiteboard`, completeMessage);
            }

            return {
                ...prev,
                strokes: [...prev.strokes, prev.currentStroke],
                currentStroke: null,
                isDrawing: false,
            };
        });
    }, [sendMessage, roomId]);

    const clearBoard = useCallback(() => {
        const myUserId = currentUserId?.toString();

        setState(prev => {
            // Only clear strokes of the current user
            const remainingStrokes = myUserId
                ? prev.strokes.filter(s => s.userId !== myUserId)
                : []; // Fallback to clear all if no userId

            return {
                ...prev,
                strokes: remainingStrokes,
                currentStroke: null,
                redoStack: [], // Clear redo stack for this user
            };
        });

        clearStorage();

        if (sendMessage) {
            const clearMessage: ClearMessage = {
                type: 'CLEAR',
                userId: myUserId,
            };
            sendMessage(`/app/room/${roomId}/whiteboard/clear`, clearMessage);
        }
    }, [roomId, sendMessage, clearStorage, currentUserId]);

    const undoBoard = useCallback(() => {
        const myUserId = currentUserId?.toString();

        setState(prev => {
            if (prev.strokes.length === 0) return prev;

            // Find last stroke of current user
            const myStrokes = prev.strokes.filter(s => s.userId === myUserId);
            if (myStrokes.length === 0) {
                console.log('[Whiteboard] No strokes to undo for current user');
                return prev;
            }

            const lastMyStroke = myStrokes[myStrokes.length - 1];

            // Remove only that stroke
            const newStrokes = prev.strokes.filter(s => s.id !== lastMyStroke.id);

            if (sendMessage) {
                const undoMessage: UndoMessage = {
                    type: 'UNDO',
                    id: lastMyStroke.id,
                    userId: myUserId,
                };
                sendMessage(`/app/room/${roomId}/whiteboard/undo`, undoMessage);
            }

            return {
                ...prev,
                strokes: newStrokes,
                redoStack: [lastMyStroke, ...prev.redoStack],
            };
        });
    }, [roomId, sendMessage, currentUserId]);

    const redoBoard = useCallback(() => {
        setState(prev => {
            if (prev.redoStack.length === 0) return prev;

            const newRedoStack = [...prev.redoStack];
            const strokeToRestore = newRedoStack.shift();

            if (!strokeToRestore) return prev;

            if (sendMessage) {
                const completeMessage: CompleteStrokeMessage = {
                    type: 'STROKE',
                    stroke: strokeToRestore,
                };
                sendMessage(`/app/room/${roomId}/whiteboard`, completeMessage);
            }

            return {
                ...prev,
                strokes: [...prev.strokes, strokeToRestore],
                redoStack: newRedoStack,
            };
        });
    }, [roomId, sendMessage]);

    const setColor = useCallback((color: string) => {
        setState(prev => ({ ...prev, selectedColor: color }));
    }, []);

    const setWidth = useCallback((width: number) => {
        setState(prev => ({ ...prev, selectedWidth: width }));
    }, []);

    const setTool = useCallback((tool: 'pen' | 'eraser') => {
        setState(prev => ({ ...prev, selectedTool: tool }));
    }, []);

    /**
     * Handles incoming complete stroke messages (sent on endStroke).
     * Replaces or adds the complete stroke to the strokes array.
     * 
     * ✅ IMPROVED: Robust echo cancellation with proper type checking and logging
     */
    const receiveRemoteStroke = useCallback((message: CompleteStrokeMessage) => {
        const stroke = message.stroke;

        // ✅ Validate message structure
        if (!stroke || !stroke.id) {
            console.error('[Whiteboard] Received invalid stroke message:', message);
            return;
        }

        // ✅ Robust echo cancellation with proper type checking
        const myUserId = currentUserId?.toString();
        const strokeUserId = stroke.userId?.toString();

        // ✅ Detailed logging for debugging (can be removed in production)
        // console.log('[Whiteboard] Received remote stroke:', {
        //     strokeId: stroke.id,
        //     strokeUserId: strokeUserId,
        //     myUserId: myUserId,
        //     pointsCount: stroke.points?.length,
        //     willIgnore: !!(myUserId && strokeUserId && myUserId === strokeUserId)
        // });

        // Echo cancellation: Only ignore if BOTH userIds exist and match
        if (myUserId && strokeUserId && myUserId === strokeUserId) {
            // console.log('[Whiteboard] Ignoring own stroke (echo cancellation)');
            return;
        }

        // ✅ Process remote stroke
        setState(prev => {
            const index = prev.strokes.findIndex(s => s.id === stroke.id);
            if (index !== -1) {
                // Replace existing stroke (for stroke updates/corrections)
                const newStrokes = [...prev.strokes];
                newStrokes[index] = stroke;
                console.log('[Whiteboard] Updated existing stroke:', stroke.id);
                return { ...prev, strokes: newStrokes };
            }
            // Add new stroke
            console.log('[Whiteboard] Added new remote stroke:', stroke.id);
            return {
                ...prev,
                strokes: [...prev.strokes, stroke],
            };
        });
    }, [currentUserId]);

    const getMyStrokesCount = useCallback(() => {
        const myUserId = currentUserId?.toString();
        if (!myUserId) return 0;
        return state.strokes.filter(s => s.userId === myUserId).length;
    }, [state.strokes, currentUserId]);

    /**
     * Handles incoming delta messages (sent during drawing).
     * Merges new points into existing stroke or creates new stroke.
     * 
     * ✅ IMPROVED: Robust echo cancellation with proper type checking and logging
     */
    const receiveRemoteDelta = useCallback((delta: StrokeDeltaMessage) => {
        // ✅ Validate message structure
        if (!delta || !delta.strokeId || !delta.points || delta.points.length === 0) {
            console.error('[Whiteboard] Received invalid delta message:', delta);
            return;
        }

        // ✅ Robust echo cancellation with proper type checking
        const myUserId = currentUserId?.toString();
        const deltaUserId = delta.userId?.toString();

        // Echo cancellation: Only ignore if BOTH userIds exist and match
        if (myUserId && deltaUserId && myUserId === deltaUserId) {
            return;
        }

        // ✅ Process remote delta
        setState(prev => {
            const index = prev.strokes.findIndex(s => s.id === delta.strokeId);

            if (index !== -1) {
                // Merge points into existing stroke
                const newStrokes = [...prev.strokes];
                const existingStroke = newStrokes[index];
                newStrokes[index] = {
                    ...existingStroke,
                    points: [...existingStroke.points, ...delta.points],
                };
                return { ...prev, strokes: newStrokes };
            } else {
                // Create new stroke from delta (first delta for this stroke)
                const newStroke: Stroke = {
                    id: delta.strokeId,
                    points: delta.points,
                    color: delta.color,
                    width: delta.width,
                    tool: delta.tool,
                    timestamp: Date.now(),
                    userId: delta.userId,
                };
                // console.log('[Whiteboard] Created new stroke from delta:', delta.strokeId);
                return {
                    ...prev,
                    strokes: [...prev.strokes, newStroke],
                };
            }
        });
    }, [currentUserId]);

    const receiveRemoteUndo = useCallback((strokeId: string) => {
        setState(prev => ({
            ...prev,
            strokes: prev.strokes.filter(s => s.id !== strokeId),
        }));
    }, []);

    // WebSocket subscription for remote updates
    const { subscribe } = useWebSocket();
    useEffect(() => {
        if (!subscribe) {
            console.warn('[Whiteboard] No subscribe function available from WebSocketContext');
            return;
        }

        console.log(`[Whiteboard] Setting up subscriptions for room ${roomId}`);

        // ✅ Subscribe to complete stroke messages
        const unsubscribeStroke = subscribe(`/topic/room/${roomId}/whiteboard`, (data) => {
            // console.log('[Whiteboard] RAW stroke message:', data);
            try {
                receiveRemoteStroke(data as CompleteStrokeMessage);
            } catch (error) {
                console.error('[Whiteboard] Error processing stroke message:', error);
            }
        });

        // ✅ Subscribe to delta messages (real-time drawing)
        const unsubscribeDelta = subscribe(`/topic/room/${roomId}/whiteboard/delta`, (data) => {
            try {
                receiveRemoteDelta(data as StrokeDeltaMessage);
            } catch (error) {
                console.error('[Whiteboard] Error processing delta message:', error);
            }
        });

        // ✅ Subscribe to clear messages
        const unsubscribeClear = subscribe(`/topic/room/${roomId}/whiteboard/clear`, (data) => {
            console.log('[Whiteboard] Received clear command:', data);

            try {
                const clearMsg = data as ClearMessage;

                // If there is a userId, only clear strokes of that user
                if (clearMsg.userId) {
                    const clearUserId = clearMsg.userId.toString();

                    // Echo cancellation for clear
                    const myUserId = currentUserId?.toString();
                    if (myUserId && clearUserId === myUserId) {
                        console.log('[Whiteboard] Ignoring own clear (already applied locally)');
                        return;
                    }

                    setState(prev => ({
                        ...prev,
                        strokes: prev.strokes.filter(s => s.userId !== clearUserId),
                    }));
                    console.log('[Whiteboard] Cleared strokes for user:', clearUserId);
                } else {
                    // Fallback: clear all
                    setState(prev => ({
                        ...prev,
                        strokes: [],
                        currentStroke: null,
                        redoStack: [],
                    }));
                    console.log('[Whiteboard] Cleared all strokes (no userId specified)');
                }
            } catch (error) {
                console.error('[Whiteboard] Error processing clear message:', error);
            }
        });

        // ✅ Subscribe to undo messages
        const unsubscribeUndo = subscribe(`/topic/room/${roomId}/whiteboard/undo`, (data) => {
            console.log('[Whiteboard] RAW undo message:', data);
            try {
                const undoMsg = data as UndoMessage;
                if (!undoMsg || !undoMsg.id) {
                    console.error('[Whiteboard] Undo message missing id field');
                    return;
                }

                // Echo cancellation for undo
                const myUserId = currentUserId?.toString();
                const undoUserId = undoMsg.userId?.toString();

                if (myUserId && undoUserId && myUserId === undoUserId) {
                    console.log('[Whiteboard] Ignoring own undo (echo cancellation)');
                    return;
                }

                receiveRemoteUndo(undoMsg.id);
            } catch (error) {
                console.error('[Whiteboard] Error processing undo message:', error);
            }
        });

        console.log('[Whiteboard] All subscriptions active');

        return () => {
            console.log('[Whiteboard] Cleaning up subscriptions for room', roomId);
            unsubscribeStroke();
            unsubscribeDelta();
            unsubscribeClear();
            unsubscribeUndo();
        };
    }, [roomId, subscribe, receiveRemoteStroke, receiveRemoteDelta, receiveRemoteUndo, currentUserId]);

    return {
        ...state,
        startStroke,
        addPoint,
        endStroke,
        clearBoard,
        undoBoard,
        redoBoard,
        setColor,
        setWidth,
        setTool,
        receiveRemoteStroke,
        receiveRemoteDelta,
        receiveRemoteUndo,
        getMyStrokesCount,
    };
};
