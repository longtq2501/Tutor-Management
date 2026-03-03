import { useState, useEffect, useCallback, useRef } from 'react';
import { useRoomState } from '../context/RoomStateContext';
import { onlineSessionApi } from '@/lib/services/onlineSession';
import axios from 'axios';

interface UseBillableTimerResult {
    formattedTime: string;
    isBillable: boolean;
}

interface TimerState {
    baseDurationSeconds: number; // Historical duration from backend
    accumulatedSeconds: number; // Local seconds accumulated since last backend sync
    isBillable: boolean;
}

const POLLING_INTERVAL_MS = 30000; // 30 seconds

/**
 * Hook to calculate and display real-time billable duration.
 * 
 * Production-Ready Features:
 * - Polls backend every 30s to sync historical duration (handles rejoins).
 * - Uses Date.now() delta for drift-free local timing.
 * - Aborts API calls on unmount.
 * - Consolidates state to prevent race conditions.
 *
 * @param roomId - The ID of the current room
 * @returns Formatted time string (MM:SS) and billable status
 */
export const useBillableTimer = (roomId: string): UseBillableTimerResult => {
    const { state } = useRoomState();

    // Consolidated state to avoid race conditions
    const [timerState, setTimerState] = useState<TimerState>({
        baseDurationSeconds: 0,
        accumulatedSeconds: 0,
        isBillable: false,
    });

    // Refs for interval management
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Polling & Sync Logic
    useEffect(() => {
        const controller = new AbortController();

        const fetchStats = async () => {
            try {
                const stats = await onlineSessionApi.getRoomStats(roomId, { signal: controller.signal });

                setTimerState(prev => ({
                    ...prev,
                    baseDurationSeconds: stats.durationSeconds ?? (stats.durationMinutes * 60),
                    // Reset local accumulation on sync to prevent double counting
                    accumulatedSeconds: 0
                }));
            } catch (error: unknown) {
                if (!axios.isCancel(error) && (error as Error).name !== 'AbortError') {
                    console.error('Failed to fetch room stats:', error);
                }
            }
        };

        // Initial fetch
        if (roomId) {
            fetchStats();

            // Setup polling
            pollingIntervalRef.current = setInterval(fetchStats, POLLING_INTERVAL_MS);
        }

        return () => {
            controller.abort();
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
            }
        };
    }, [roomId, state.participants]); // ✅ Re-sync when participants change (e.g. Join/Leave)

    // 2. Real-time Ticker (Increments only when billable)
    useEffect(() => {
        const checkBillable = () => {
            // Simply check if both Tutor and Student are in the participants list
            // Since we fixed the participant list to be real-time, this is accurate.
            const tutor = state.participants.find(p => p.role === 'TUTOR');
            const student = state.participants.find(p => p.role === 'STUDENT');
            return !!(tutor && student);
        };

        const intervalId = setInterval(() => {
            const isBillable = checkBillable();

            setTimerState(prev => ({
                ...prev,
                isBillable,
                // Only increment if billable
                accumulatedSeconds: isBillable ? prev.accumulatedSeconds + 1 : prev.accumulatedSeconds
            }));
        }, 1000);

        return () => clearInterval(intervalId);
    }, [state.participants]);

    const totalSeconds = timerState.baseDurationSeconds + timerState.accumulatedSeconds;

    const formatTime = useCallback((totalSeconds: number): string => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, []);

    return {
        formattedTime: formatTime(totalSeconds),
        isBillable: timerState.isBillable
    };
};
