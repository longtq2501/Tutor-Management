import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RoomStateProvider, useRoomState } from '../../context/RoomStateContext';
import { createElement } from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => createElement(RoomStateProvider, null, children);

describe('useRoomState', () => {
    it('should throw error when used outside provider', () => {
        expect(() => {
            renderHook(() => useRoomState());
        }).toThrow('useRoomState must be used within RoomStateProvider');
    });

    it('should provide initial state', () => {
        const { result } = renderHook(() => useRoomState(), { wrapper });

        expect(result.current.state.roomId).toBeNull();
        expect(result.current.state.sessionId).toBeNull();
        expect(result.current.state.participants).toEqual([]);
        expect(result.current.state.isConnected).toBe(false);
    });

    it('should update roomId', () => {
        const { result } = renderHook(() => useRoomState(), { wrapper });

        act(() => {
            result.current.actions.setRoomId('room-123');
        });

        expect(result.current.state.roomId).toBe('room-123');
    });

    it('should add and remove participants', () => {
        const { result } = renderHook(() => useRoomState(), { wrapper });

        const participant = {
            id: 'user-1',
            name: 'John Doe',
            role: 'TUTOR' as const,
            joinedAt: new Date(),
            isMicMuted: false,
            isCameraMuted: false,
        };

        act(() => {
            result.current.actions.addParticipant(participant);
        });

        expect(result.current.state.participants).toHaveLength(1);
        expect(result.current.state.participants[0].id).toBe('user-1');

        act(() => {
            result.current.actions.removeParticipant('user-1');
        });

        expect(result.current.state.participants).toHaveLength(0);
    });

    it('should update error state', () => {
        const { result } = renderHook(() => useRoomState(), { wrapper });

        act(() => {
            result.current.actions.setError('Connection lost');
        });

        expect(result.current.state.error).toBe('Connection lost');
    });

    it('should reset room state including error', () => {
        const { result } = renderHook(() => useRoomState(), { wrapper });

        act(() => {
            result.current.actions.setRoomId('room-123');
            result.current.actions.setError('Some error');
            result.current.actions.resetRoom();
        });

        expect(result.current.state.roomId).toBeNull();
        expect(result.current.state.error).toBeNull();
    });
});
