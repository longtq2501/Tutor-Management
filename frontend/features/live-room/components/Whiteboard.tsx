"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useWhiteboardSync } from '../hooks/useWhiteboardSync';
import { WhiteboardToolbar } from './WhiteboardToolbar';
import { ConfirmDialog } from './ConfirmDialog';
import type { StrokePoint } from '../hooks/useWhiteboardSync';

export interface WhiteboardProps {
    roomId: string;
    currentUserId?: string | number;
    sendMessage?: (destination: string, payload: unknown) => void;
    className?: string;
    isReadOnly?: boolean;
}

/**
 * Interactive whiteboard component with drawing capabilities.
 * Supports mouse/touch drawing with throttled WebSocket sync (50ms).
 */
export const Whiteboard = React.forwardRef<HTMLCanvasElement, WhiteboardProps>(({
    roomId,
    currentUserId,
    sendMessage,
    className,
    isReadOnly = false,
}, ref) => {
    const internalCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync external ref with internal canvas ref
    useEffect(() => {
        if (!ref) return;
        if (typeof ref === 'function') {
            ref(internalCanvasRef.current);
        } else {
            (ref as React.MutableRefObject<HTMLCanvasElement | null>).current = internalCanvasRef.current;
        }
    }, [ref]);

    const canvasRef = internalCanvasRef;

    // ✅ Add state for confirmation dialog
    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const {
        strokes,
        currentStroke,
        redoStack,
        selectedColor,
        selectedWidth,
        selectedTool,
        isDrawing,
        startStroke,
        addPoint,
        endStroke,
        clearBoard,
        undoBoard,
        redoBoard,
        setColor,
        setWidth,
        setTool,
        getMyStrokesCount,
    } = useWhiteboardSync(roomId, currentUserId, sendMessage);

    // ✅ Handler to show clear confirmation
    const handleClearRequest = useCallback(() => {
        setShowClearConfirm(true);
    }, []);

    // ✅ Handler for confirmed clear
    const handleClearConfirmed = useCallback(() => {
        clearBoard();
        setShowClearConfirm(false);
    }, [clearBoard]);

    // ✅ Compute canUndo based on user's strokes only
    const canUndo = getMyStrokesCount() > 0;

    // Add this useEffect at the top of the Whiteboard component, after the hook call
    useEffect(() => {
        console.log('[Whiteboard] Component initialized:', {
            roomId,
            currentUserId,
            currentUserIdType: typeof currentUserId,
            hasSendMessage: !!sendMessage
        });
    }, [roomId, currentUserId, sendMessage]);

    // Keyboard shortcuts for Undo/Redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!e.ctrlKey && !e.metaKey) return;

            if (e.key.toLowerCase() === 'z') {
                if (e.shiftKey) {
                    redoBoard();
                } else {
                    undoBoard();
                }
            } else if (e.key.toLowerCase() === 'y') {
                redoBoard();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undoBoard, redoBoard]);

    // Render all strokes to canvas
    const renderCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const { width, height } = canvas;
        if (width === 0 || height === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, width, height);

        [...strokes, currentStroke].filter(Boolean).forEach(stroke => {
            if (!stroke || stroke.points.length === 0) return;

            ctx.beginPath();
            ctx.strokeStyle = stroke.tool === 'eraser' ? '#FFFFFF' : stroke.color;

            // Safe scaling
            const scale = Math.min(width, height) / 1000;
            ctx.lineWidth = Math.max(1, stroke.width * scale);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Helper to safely denormalize
            const getSafePoint = (p: StrokePoint) => ({
                x: Math.max(0, Math.min(1, p.x)) * width,
                y: Math.max(0, Math.min(1, p.y)) * height
            });

            const start = getSafePoint(stroke.points[0]);
            ctx.moveTo(start.x, start.y);

            stroke.points.forEach(point => {
                const safe = getSafePoint(point);
                ctx.lineTo(safe.x, safe.y);
            });
            ctx.stroke();
        });
    }, [strokes, currentStroke]);

    useEffect(() => {
        renderCanvas();
    }, [renderCanvas]);

    // Handle canvas resize
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;

            // Set actual canvas size to match display size for sharp rendering
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
            renderCanvas();
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [renderCanvas]);

    const getNormalizedPoint = useCallback((clientX: number, clientY: number): StrokePoint | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        const rect = canvas.getBoundingClientRect();
        const width = canvas.width;
        const height = canvas.height;

        if (width === 0 || height === 0) return null;

        return {
            x: (clientX - rect.left) / width,
            y: (clientY - rect.top) / height,
        };
    }, []);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (isReadOnly) return;
            const point = getNormalizedPoint(e.clientX, e.clientY);
            if (point) startStroke(point);
        },
        [getNormalizedPoint, startStroke, isReadOnly]
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (isReadOnly || !isDrawing) return;
            const point = getNormalizedPoint(e.clientX, e.clientY);
            if (point) addPoint(point);
        },
        [isDrawing, getNormalizedPoint, addPoint, isReadOnly]
    );

    const handleMouseUp = useCallback(() => {
        if (!isReadOnly && isDrawing) endStroke();
    }, [isDrawing, endStroke, isReadOnly]);

    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (isReadOnly || e.touches.length === 0) return;
            const touch = e.touches[0];
            const point = getNormalizedPoint(touch.clientX, touch.clientY);
            if (point) startStroke(point);
        },
        [getNormalizedPoint, startStroke, isReadOnly]
    );

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (isReadOnly || !isDrawing || e.touches.length === 0) return;
            const touch = e.touches[0];
            const point = getNormalizedPoint(touch.clientX, touch.clientY);
            if (point) addPoint(point);
        },
        [isDrawing, getNormalizedPoint, addPoint, isReadOnly]
    );

    const handleTouchEnd = useCallback(() => {
        if (!isReadOnly && isDrawing) endStroke();
    }, [isDrawing, endStroke, isReadOnly]);

    return (
        <div className={`flex flex-col gap-2 ${className || ''}`}>
            {!isReadOnly && (
                <WhiteboardToolbar
                    selectedColor={selectedColor}
                    selectedWidth={selectedWidth}
                    selectedTool={selectedTool}
                    onColorChange={setColor}
                    onWidthChange={setWidth}
                    onToolChange={setTool}
                    onClear={clearBoard}
                    onClearRequest={handleClearRequest} // ✅ Add
                    onUndo={undoBoard}
                    onRedo={redoBoard}
                    canUndo={canUndo} // ✅ Updated logic
                    canRedo={redoStack.length > 0}
                />
            )}

            {/* ✅ Add Confirmation Dialog */}
            <ConfirmDialog
                open={showClearConfirm}
                onOpenChange={setShowClearConfirm}
                title="Xóa nét vẽ của bạn?"
                description="Hành động này sẽ xóa tất cả nét vẽ của bạn trên whiteboard. Bạn có chắc chắn muốn tiếp tục?"
                confirmText="Xóa"
                cancelText="Hủy"
                onConfirm={handleClearConfirmed}
                variant="destructive"
            />

            <div
                ref={containerRef}
                className="relative flex-1 bg-white border rounded-lg overflow-hidden touch-none"
                style={{ minHeight: '400px' }}
            >
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 cursor-crosshair touch-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                />
            </div>
        </div>
    );
});
