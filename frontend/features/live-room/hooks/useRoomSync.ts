import { useEffect, useRef, useState } from 'react';
import { Participant, useRoomState } from '../context/RoomStateContext';
import { onlineSessionApi } from '@/lib/services/onlineSession';
import { useWebSocket } from '../context/WebSocketContext';

/**
 * Hook to handle room synchronization and initial data fetching.
 * Prevents infinite polling by strictly guarding fetch calls.
 */
export const useRoomSync = (roomId: string) => {
    const { actions } = useRoomState();
    const { isConnected, sendMessage, subscribe } = useWebSocket();
    const syncedRoomRef = useRef<string | null>(null);
    const [isSynced, setIsSynced] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // 1. Guard claues
        if (!roomId || !isConnected) return;

        // 2. Prevent re-syncing the same room
        if (syncedRoomRef.current === roomId) return;

        const syncRoom = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // 3. Mark as syncing immediately to prevent race conditions
                syncedRoomRef.current = roomId;

                // 4. Reset state for new room
                actions.resetRoom();
                actions.setRoomId(roomId);

                // 5. Fetch stats
                const stats = await onlineSessionApi.getRoomStats(roomId);

                // 6. Update participants (Strictly use Real-time status)
                const participants: Participant[] = [];
                if (stats.tutorName && stats.tutorPresent) {
                    participants.push({
                        id: String(stats.tutorId), // ✅ Use real User ID from backend
                        name: stats.tutorName,
                        role: 'TUTOR' as const,
                        joinedAt: stats.tutorJoinedAt ? new Date(stats.tutorJoinedAt) : new Date(),
                        isMicMuted: false,
                        isCameraMuted: false
                    });
                }
                if (stats.studentName && stats.studentPresent) {
                    // Fallback to 'student' ONLY if studentId is missing (unlikely if they have account)
                    // But if studentId is null, we can't match them to WS anyway.
                    const sId = stats.studentId ? String(stats.studentId) : 'student';
                    participants.push({
                        id: sId,
                        name: stats.studentName,
                        role: 'STUDENT' as const,
                        joinedAt: stats.studentJoinedAt ? new Date(stats.studentJoinedAt) : new Date(),
                        isMicMuted: false,
                        isCameraMuted: false
                    });
                }

                participants.forEach(p => actions.addParticipant(p));

                // 7. Mark as synced to trigger presence subscription
                setIsSynced(true);

            } catch (err) {
                console.error("Failed to sync room stats:", err);
                setError("Failed to load room data.");
                syncedRoomRef.current = null;
            } finally {
                setIsLoading(false);
            }
        };

        syncRoom();
    }, [roomId, isConnected, actions]);

    // Handle Real-time Presence
    useEffect(() => {
        // Only run if we are connected AND have finished the initial sync for this room
        if (!roomId || !isConnected || !isSynced || syncedRoomRef.current !== roomId) return;

        console.log('🔗 Subscribing to presence events for room:', roomId);

        // 1. Subscribe to presence events
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unsubscribe = subscribe(`/topic/room/${roomId}/presence`, (message: any) => {
            console.log('Presence update:', message);

            // Handle User Joined
            if (message.joinedAt) {
                const newParticipant = {
                    id: String(message.userId),
                    name: message.name,
                    role: message.role as 'TUTOR' | 'STUDENT',
                    joinedAt: new Date(message.joinedAt),
                    avatarUrl: message.avatarUrl,
                    isMicMuted: false,
                    isCameraMuted: false
                };

                // Context now handles duplicates safely
                actions.addParticipant(newParticipant);
            }
            // Handle User Left
            else if (message.leftAt) {
                actions.removeParticipant(String(message.userId));
            }
        });

        // 2. Announce Join (Backend broadcasts to others)
        sendMessage(`/app/room/${roomId}/join`, {});

        // 3. Announce Leave on unmount
        return () => {
            console.log('🔌 Unsubscribing presence');
            sendMessage(`/app/room/${roomId}/leave`, {});
            unsubscribe();
        };

    }, [roomId, isConnected, isSynced, subscribe, sendMessage, actions]); // ✅ Stable dependencies, no participants loop

    return { isLoading, error };
};
