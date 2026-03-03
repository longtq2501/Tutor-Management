import { renderHook, act } from '@testing-library/react';
import { useWhiteboardPersistence } from '../useWhiteboardPersistence';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useWhiteboardPersistence', () => {
    const roomId = 'test-room';
    const storageKey = `tms_whiteboard_${roomId}`;

    beforeEach(() => {
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should load empty array when storage is empty', () => {
        const { result } = renderHook(() => useWhiteboardPersistence(roomId));
        expect(result.current.loadFromStorage()).toEqual([]);
    });

    it('should save and load data correctly', () => {
        const { result } = renderHook(() => useWhiteboardPersistence(roomId));
        const mockStrokes = [{ id: '1', points: [], color: '#000', width: 2, tool: 'pen' as const, timestamp: Date.now() }];

        act(() => {
            result.current.saveToStorage(mockStrokes);
        });

        expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual(mockStrokes);
        expect(result.current.loadFromStorage()).toEqual(mockStrokes);
    });

    it('should clear storage correctly', () => {
        const { result } = renderHook(() => useWhiteboardPersistence(roomId));
        localStorage.setItem(storageKey, JSON.stringify([{ id: '1' }]));

        act(() => {
            result.current.clearStorage();
        });

        expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it('should auto-save at intervals', () => {
        const mockStrokes = [{ id: '1', content: 'test' }];
        renderHook(() => {
            const persistence = useWhiteboardPersistence(roomId);
            persistence.useAutoSave(mockStrokes as unknown as Parameters<typeof persistence.useAutoSave>[0]);
        });

        // Advance time by 10 seconds
        act(() => {
            vi.advanceTimersByTime(10000);
        });

        expect(JSON.parse(localStorage.getItem(storageKey)!)).toEqual(mockStrokes);
    });

    it('should handle invalid JSON in storage', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        localStorage.setItem(storageKey, 'invalid-json');

        const { result } = renderHook(() => useWhiteboardPersistence(roomId));
        expect(result.current.loadFromStorage()).toEqual([]);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});
