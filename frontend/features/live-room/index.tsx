'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LiveRoomDisplay } from './components/LiveRoomDisplay';
import { RoomStateProvider } from './context/RoomStateContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { onlineSessionApi } from '@/lib/services/onlineSession';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { LiveTeachingLobby } from './components/LiveTeachingLobby';
import { LobbyErrorBoundary } from './components/LobbyErrorBoundary';
import { RoomErrorBoundary } from './components/RoomErrorBoundary';
import { LiveRoomSkeleton } from './components/LiveRoomSkeleton';

/**
 * Main feature component for Live Teaching.
 * Toggles between the Lobby (list of sessions) and the Live Room (teaching interface).
 */
export const LiveRoomFeature = ({ roomId: propRoomId }: { roomId?: string }) => {
    const searchParams = useSearchParams();
    const roomId = propRoomId || searchParams.get('roomId');
    const { user } = useAuth();
    const router = useRouter();

    // Joining State (when entering a specific room)
    const [token, setToken] = useState<string | null>(null);
    const [turnServers, setTurnServers] = useState<Array<Record<string, unknown>>>([]);
    const [isJoining, setIsJoining] = useState(false);
    const [joinError, setJoinError] = useState<string | null>(null);

    useEffect(() => {
        const join = async () => {
            if (!roomId || !user) return;

            setIsJoining(true);
            setJoinError(null);

            try {
                const response = await onlineSessionApi.joinRoom(roomId);
                setToken(response.token);
                setTurnServers(response.turnServers || []);
            } catch (err: unknown) {
                console.error("Failed to join room:", err);
                const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Không thể tham gia phòng học.";
                setJoinError(errorMessage);
            } finally {
                setIsJoining(false);
            }
        };

        if (roomId) {
            join();
        }
    }, [roomId, user]);

    // If no specific room ID is provided, show the lobby
    if (!roomId) {
        return (
            <LobbyErrorBoundary>
                <div data-tour="live-room-lobby">
                    <LiveTeachingLobby
                        onJoin={(rid) => router.push(`/live-teaching/${rid}`)}
                        currentUserId={user?.id || 0}
                        isTutor={user?.role !== 'STUDENT'}
                    />
                </div>
            </LobbyErrorBoundary>
        );
    }

    // Full screen loading state when joining a room
    if (isJoining) {
        return <LiveRoomSkeleton />;
    }

    // Error state when joining fails
    if (joinError) {
        return (
            <div className="p-6">
                <Alert variant="destructive">
                    <AlertTitle>Lỗi tham gia phòng</AlertTitle>
                    <AlertDescription>{joinError}</AlertDescription>
                </Alert>
                <Button className="mt-4" onClick={() => router.push('/dashboard?view=live-room')}>
                    Quay lại sảnh chờ
                </Button>
            </div>
        );
    }

    if (!token || !user) return null;

    return (
        <RoomErrorBoundary onReset={() => window.location.reload()}>
            <WebSocketProvider roomId={roomId} token={token}>
                <RoomStateProvider>
                    <LiveRoomDisplay roomId={roomId} currentUserId={user.id} turnServers={turnServers} />
                </RoomStateProvider>
            </WebSocketProvider>
        </RoomErrorBoundary>
    );
};

export default LiveRoomFeature;
