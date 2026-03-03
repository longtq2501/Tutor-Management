'use client';

import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { SessionStatusResponse } from '@/lib/types/onlineSession';
import { useRoomState } from '../context/RoomStateContext';

/**
 * Hook to manage room status alerts and inactivity warnings via WebSocket.
 * Hardened to handle reconnection and prevent countdown drift.
 */
export const useRoomStatus = (roomId: string) => {
    const { isConnected, subscribe } = useWebSocket();
    const { actions } = useRoomState();
    const [warning, setWarning] = useState<string | null>(null);
    const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
    const [isCountdownActive, setIsCountdownActive] = useState(false);
    const targetEndTimeRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isConnected || !roomId) return;

        // Clear existing warnings on reconnection to handle fresh state
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWarning(prev => prev !== null ? null : prev);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSecondsRemaining(prev => prev !== null ? null : prev);
        targetEndTimeRef.current = null;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsCountdownActive(prev => prev !== false ? false : prev);

        const unsubscribe = subscribe(`/topic/room/${roomId}/status`, (data) => {
            try {
                const update = data as SessionStatusResponse;

                if (!update || !update.type) {
                    console.error('Invalid status update received:', data);
                    return;
                }

                switch (update.type) {
                    case 'PARTICIPANT_JOINED':
                        setWarning(null);
                        setSecondsRemaining(null);
                        targetEndTimeRef.current = null;
                        setIsCountdownActive(false);
                        // Update participant list if possible (fallback to fetch)
                        if (update.userId && update.role) {
                            actions.addParticipant({
                                id: update.userId.toString(),
                                name: update.role === 'TUTOR' ? 'Giáo viên' : 'Học viên',
                                role: update.role as 'TUTOR' | 'STUDENT',
                                joinedAt: new Date(),
                                isMicMuted: false,
                                isCameraMuted: false
                            });
                        }
                        break;

                    case 'PARTICIPANT_LEFT':
                        setWarning(update.message || "Một người tham gia đã rời phòng.");
                        setSecondsRemaining(null);
                        targetEndTimeRef.current = null;
                        setIsCountdownActive(false);
                        if (update.userId) {
                            actions.removeParticipant(update.userId.toString());
                        }
                        break;

                    case 'INACTIVITY_WARNING':
                        setWarning(update.message || "Phòng học sắp bị đóng do không có hoạt động.");
                        if (update.remainingSeconds != null) {
                            const targetTime = Date.now() + (update.remainingSeconds * 1000);
                            targetEndTimeRef.current = targetTime;
                            setSecondsRemaining(update.remainingSeconds);
                            setIsCountdownActive(true);
                        }
                        break;

                    case 'ROOM_AUTO_ENDED':
                        setWarning("Phòng học đã tự động đóng do không có hoạt động.");
                        setSecondsRemaining(0);
                        targetEndTimeRef.current = null;
                        setIsCountdownActive(false);

                        // Redirect to sessions summary after a delay
                        setTimeout(() => {
                            window.location.href = `/sessions/${roomId}/summary`;
                        }, 3000);
                        break;

                    default:
                        console.warn('Unknown session status type:', update.type);
                }
            } catch (err: unknown) {
                console.error('Error processing room status message:', err);
            }
        });

        return unsubscribe;
    }, [isConnected, roomId, subscribe, actions]);

    // Precise countdown based on target timestamp to avoid drift
    useEffect(() => {
        if (!isCountdownActive || !targetEndTimeRef.current) return;

        const timer = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current! - now) / 1000));

            setSecondsRemaining(remaining);

            if (remaining === 0) {
                clearInterval(timer);
                setIsCountdownActive(false);
            }
        }, 500); // Check every 500ms for responsiveness

        return () => clearInterval(timer);
    }, [isCountdownActive]);

    return {
        warning,
        secondsRemaining,
        clearWarning: () => {
            setWarning(null);
            setSecondsRemaining(null);
            targetEndTimeRef.current = null;
            setIsCountdownActive(false);
        }
    };
};
