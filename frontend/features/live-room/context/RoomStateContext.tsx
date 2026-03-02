"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { UseMediaStreamResult } from '../hooks/useMediaStream';
import type { WebRTCConnectionState } from '../hooks/useWebRTCConnection';

/**
 * Participant information in the room.
 */
export interface Participant {
    id: string;
    name: string;
    role: 'TUTOR' | 'STUDENT';
    joinedAt: Date;
    avatarUrl?: string;
    isMicMuted: boolean;
    isCameraMuted: boolean;
}

/**
 * Centralized state for the live room.
 */
export interface RoomState {
    roomId: string | null;
    sessionId: string | null;
    participants: Participant[];
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    connectionState: WebRTCConnectionState;
    contentMode: 'whiteboard' | 'screen';
    isConnected: boolean;
    error: string | null;
}

/**
 * Actions to update room state.
 */
export interface RoomActions {
    setRoomId: (roomId: string) => void;
    setSessionId: (sessionId: string) => void;
    addParticipant: (participant: Participant) => void;
    removeParticipant: (participantId: string) => void;
    updateParticipant: (participantId: string, updates: Partial<Participant>) => void;
    setLocalStream: (stream: MediaStream | null) => void;
    setRemoteStream: (stream: MediaStream | null) => void;
    setConnectionState: (state: WebRTCConnectionState) => void;
    setIsConnected: (connected: boolean) => void;
    setContentMode: (mode: 'whiteboard' | 'screen') => void;
    setError: (error: string | null) => void;
    resetRoom: () => void;
}

/**
 * Combined context value.
 */
export interface RoomContextValue {
    state: RoomState;
    actions: RoomActions;
}

const RoomStateContext = createContext<RoomContextValue | undefined>(undefined);

const initialState: RoomState = {
    roomId: null,
    sessionId: null,
    participants: [],
    localStream: null,
    remoteStream: null,
    connectionState: 'INITIALIZING',
    contentMode: 'whiteboard',
    isConnected: false,
    error: null,
};

/**
 * Provider component for room state management.
 */
export const RoomStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<RoomState>(initialState);

    const setRoomId = useCallback((roomId: string) => {
        setState(prev => ({ ...prev, roomId }));
    }, []);

    const setSessionId = useCallback((sessionId: string) => {
        setState(prev => ({ ...prev, sessionId }));
    }, []);

    const addParticipant = useCallback((participant: Participant) => {
        setState(prev => {
            if (prev.participants.some(p => p.id === participant.id)) {
                return prev;
            }
            return { ...prev, participants: [...prev.participants, participant] };
        });
    }, []);

    const removeParticipant = useCallback((participantId: string) => {
        setState(prev => ({ ...prev, participants: prev.participants.filter(p => p.id !== participantId) }));
    }, []);

    const updateParticipant = useCallback((participantId: string, updates: Partial<Participant>) => {
        setState(prev => ({
            ...prev,
            participants: prev.participants.map(p => p.id === participantId ? { ...p, ...updates } : p)
        }));
    }, []);

    const setLocalStream = useCallback((stream: MediaStream | null) => {
        setState(prev => ({ ...prev, localStream: stream }));
    }, []);

    const setRemoteStream = useCallback((stream: MediaStream | null) => {
        setState(prev => ({ ...prev, remoteStream: stream }));
    }, []);

    const setConnectionState = useCallback((connectionState: WebRTCConnectionState) => {
        setState(prev => ({ ...prev, connectionState }));
    }, []);

    const setIsConnected = useCallback((isConnected: boolean) => {
        setState(prev => ({ ...prev, isConnected }));
    }, []);

    const setContentMode = useCallback((contentMode: 'whiteboard' | 'screen') => {
        setState(prev => ({ ...prev, contentMode }));
    }, []);

    const setError = useCallback((error: string | null) => {
        setState(prev => ({ ...prev, error }));
    }, []);

    const resetRoom = useCallback(() => {
        setState(initialState);
    }, []);

    const actions = React.useMemo(() => ({
        setRoomId,
        setSessionId,
        addParticipant,
        removeParticipant,
        updateParticipant,
        setLocalStream,
        setRemoteStream,
        setConnectionState,
        setIsConnected,
        setContentMode,
        setError,
        resetRoom,
    }), [
        setRoomId,
        setSessionId,
        addParticipant,
        removeParticipant,
        updateParticipant,
        setLocalStream,
        setRemoteStream,
        setConnectionState,
        setIsConnected,
        setContentMode,
        setError,
        resetRoom
    ]);

    const value: RoomContextValue = React.useMemo(() => ({
        state,
        actions,
    }), [state, actions]);

    return <RoomStateContext.Provider value={value}>{children}</RoomStateContext.Provider>;
};

/**
 * Hook to access room state and actions.
 * Must be used within RoomStateProvider.
 */
export const useRoomState = (): RoomContextValue => {
    const context = useContext(RoomStateContext);
    if (!context) {
        throw new Error('useRoomState must be used within RoomStateProvider');
    }
    return context;
};
