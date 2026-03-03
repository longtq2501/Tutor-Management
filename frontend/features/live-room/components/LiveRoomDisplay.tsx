'use client';

import React, { useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useRoomState } from '../context/RoomStateContext';
import { RoomErrorBoundary } from './RoomErrorBoundary';
import { useLiveRoomMedia } from '../hooks/useLiveRoomMedia';
import { RecordingPreviewDialog } from './RecordingPreviewDialog';
import { RoomMainContent } from './RoomMainContent';
import { useRoomStatus } from '../hooks/useRoomStatus';
import { InactivityWarning } from './InactivityWarning';
import { RoomHeader } from './RoomHeader';
import { MobileNavigation, RoomTab } from './MobileNavigation';
import { useIsMobile } from '../hooks/useIsMobile';
import { ErrorRecoveryDialog } from './ErrorRecoveryDialog';
import { MediaFallbackUI } from './MediaFallbackUI';
import { useRouter, useSearchParams } from 'next/navigation';
import { useHeartbeat } from '../hooks/useHeartbeat';
import { useRoomSync } from '../hooks/useRoomSync';
import { useWebRTCSignaling } from '../hooks/useWebRTCSignaling';

interface LiveRoomDisplayProps {
    roomId: string;
    currentUserId: number;
}

/**
 * Main display component for the Live Room feature.
 * Refactored to separate concerns and prevent infinite re-renders.
 */
export const LiveRoomDisplay: React.FC<LiveRoomDisplayProps> = ({ roomId, currentUserId }) => {
    const { isConnected, sendMessage } = useWebSocket();
    const { state, actions } = useRoomState();
    const retryCountRef = React.useRef(0);
    const MAX_RETRIES = 3;

    const media = useLiveRoomMedia();
    const { warning: statusWarning, secondsRemaining } = useRoomStatus(roomId);
    const isMobile = useIsMobile();
    const router = useRouter();
    const searchParams = useSearchParams();
    const autoRecordRef = React.useRef(false);
    const [hasGivenUp, setHasGivenUp] = React.useState(false); // ✅ Add escape flag

    // ✅ Sync Room State (Guarded against infinite loops)
    useRoomSync(roomId);

    // ✅ WebRTC Signaling
    useWebRTCSignaling(roomId, currentUserId, media);

    // Start heartbeat
    useHeartbeat(roomId);

    // Read recording preference from URL param
    const shouldAutoRecord = searchParams?.get('record') === 'true';

    // Tab persistence logic
    const [activeTab, setActiveTab] = React.useState<RoomTab>(() => {
        if (typeof window !== 'undefined') {
            const stored = sessionStorage.getItem(`room-${roomId}-active-tab`);
            if (stored === 'board' || stored === 'video' || stored === 'chat') return stored;
        }
        return 'board';
    });

    // Set mobile default tab
    useEffect(() => {
        if (isMobile && typeof window !== 'undefined' && !sessionStorage.getItem(`room-${roomId}-active-tab`)) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveTab(prev => prev !== 'video' ? 'video' : prev);
        }
    }, [isMobile, roomId]);

    const handleTabChange = React.useCallback((tab: RoomTab) => {
        setActiveTab(tab);
        sessionStorage.setItem(`room-${roomId}-active-tab`, tab);
    }, [roomId]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!isMobile && e.altKey) {
                if (e.key === '1') handleTabChange('board');
                if (e.key === '2') handleTabChange('video');
                if (e.key === '3') handleTabChange('chat');
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleTabChange, isMobile]);

    const handleRetry = React.useCallback(() => {
        if (retryCountRef.current >= MAX_RETRIES) {
            // ✅ FIX: Set flag to stop retry loop
            setHasGivenUp(true);
            actions.setError(`Đã thử kết nối lại ${MAX_RETRIES} lần nhưng vẫn thất bại. Vui lòng kiểm tra quyền truy cập camera/mic.`);
            return;
        }
        retryCountRef.current++;
        setHasGivenUp(false); // Reset flag on manual retry
        actions.setConnectionState('INITIALIZING');
        actions.setError(null);
        media.retry({ video: true, audio: true });
    }, [actions, media, MAX_RETRIES]);

    const handleAudioOnly = React.useCallback(() => {
        actions.setConnectionState('INITIALIZING');
        actions.setError(null);
        media.retry({ video: false, audio: true });
    }, [actions, media]);

    // Auto-start recording
    useEffect(() => {
        if (shouldAutoRecord && state.isConnected && !media.isRecording && !autoRecordRef.current) {
            autoRecordRef.current = true;
            media.startRecording();
        }
    }, [shouldAutoRecord, state.isConnected, media.isRecording, media]);

    // Connection state bridge
    useEffect(() => {
        if (!state.isConnected && isConnected) {
            actions.setConnectionState('CONNECTED');
            actions.setIsConnected(true);
            retryCountRef.current = 0;
        }
    }, [state.isConnected, isConnected, actions]);

    return (
        <RoomErrorBoundary>
            <div className="flex h-screen w-full bg-background overflow-hidden text-foreground selection:bg-primary/20">
                <div className="flex-1 relative flex flex-col min-w-0 h-full">
                    <InactivityWarning warning={statusWarning} secondsRemaining={secondsRemaining} />

                    <RoomHeader
                        roomId={roomId}
                        isConnected={state.isConnected}
                        isRecording={media.isRecording}
                    />

                    {media.error ? (
                        <div className="flex-1 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                            <MediaFallbackUI
                                error={media.error}
                                isLoading={media.isLoading}
                                onRetry={() => media.retry()}
                                devices={media.devices}
                            />
                        </div>
                    ) : (
                        <RoomMainContent
                            roomId={roomId}
                            currentUserId={currentUserId}
                            activeTab={activeTab}
                            media={media}
                            sendMessage={sendMessage}
                            onTabChange={handleTabChange}
                        />
                    )}

                    {isMobile && (
                        <MobileNavigation activeTab={activeTab} onTabChange={handleTabChange} />
                    )}
                </div>
            </div>

            <RecordingPreviewDialog
                isOpen={!!media.previewUrl}
                videoUrl={media.previewUrl}
                fileSize={media.previewMeta?.size}
                duration={media.previewMeta?.duration}
                onDownload={media.confirmDownload}
                onDiscard={media.discardRecording}
            />

            <ErrorRecoveryDialog
                isOpen={
                    !hasGivenUp && // ✅ Don't show if given up
                    (state.connectionState === 'FAILED' || !!media.error)
                }
                error={state.error || (media.error ? "Lỗi thiết bị media" : null)}
                onRetry={handleRetry}
                onAudioOnly={handleAudioOnly}
                onExit={() => {
                    setHasGivenUp(true); // ✅ Set flag on exit
                    router.push('/dashboard');
                }}
            />
        </RoomErrorBoundary>
    );
};
