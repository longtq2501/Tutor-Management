import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useRoomState } from '../context/RoomStateContext';

/**
 * Hook to manage WebRTC P2P connection and signaling.
 */
export const useWebRTCSignaling = (roomId: string, currentUserId: number, media: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const { subscribe, sendMessage, isConnected } = useWebSocket();
    const { state, actions } = useRoomState();

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const participantsRef = useRef(state.participants);
    const localStreamRef = useRef(state.localStream);

    // Keep refs updated with latest state
    useEffect(() => {
        participantsRef.current = state.participants;
    }, [state.participants]);

    useEffect(() => {
        localStreamRef.current = state.localStream;
    }, [state.localStream]);

    // Initial configuration for PeerConnection
    const configuration: RTCConfiguration = useMemo(() => ({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    }), []);

    const cleanup = useCallback(() => {
        if (pcRef.current) {
            console.log('[WebRTC] Closing PeerConnection');
            pcRef.current.onicecandidate = null;
            pcRef.current.ontrack = null;
            pcRef.current.onconnectionstatechange = null;
            pcRef.current.close();
            pcRef.current = null;
        }
    }, []);

    const createPeerConnection = useCallback(() => {
        cleanup();

        console.log('[WebRTC] Creating new PeerConnection');
        const pc = new RTCPeerConnection(configuration);

        pc.onicecandidate = (event) => {
            const currentParticipants = participantsRef.current;
            if (event.candidate && currentParticipants.length > 0) {
                const otherPlayer = currentParticipants.find(p => Number(p.id) !== currentUserId);
                if (otherPlayer) {
                    sendMessage(`/app/room/${roomId}/signal`, {
                        type: 'candidate',
                        data: event.candidate,
                        senderId: currentUserId,
                        receiverId: Number(otherPlayer.id)
                    });
                }
            }
        };

        pc.ontrack = (event) => {
            console.log('[WebRTC] Received remote track:', event.streams[0]);
            if (event.streams && event.streams[0]) {
                actions.setRemoteStream(event.streams[0]);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('[WebRTC] Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                actions.setConnectionState('CONNECTED');
            } else if (pc.connectionState === 'failed') {
                actions.setConnectionState('FAILED');
            }
        };

        // Add local tracks
        const currentLocalStream = localStreamRef.current;
        if (currentLocalStream) {
            currentLocalStream.getTracks().forEach(track => {
                pc.addTrack(track, currentLocalStream);
            });
        }

        pcRef.current = pc;
        return pc;
    }, [roomId, currentUserId, sendMessage, actions, cleanup, configuration]);

    // Handle track replacement (Camera <-> Screen)
    useEffect(() => {
        const replaceTracks = async () => {
            if (!pcRef.current) return;

            // Guard: If switching to screen, wait until stream is ready
            if (state.contentMode === 'screen' && !media.screenStream) {
                console.log('[WebRTC] Deferring track replacement: screen stream not ready');
                return;
            }

            const pc = pcRef.current;
            const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');

            if (videoSender) {
                const targetStream = state.contentMode === 'screen' ? media.screenStream : state.localStream;
                const newTrack = targetStream?.getVideoTracks()[0] || null;

                if (newTrack && videoSender.track !== newTrack) {
                    console.log('[WebRTC] Replacing video track with:', state.contentMode === 'screen' ? 'screen' : 'camera');
                    await videoSender.replaceTrack(newTrack);
                }
            }
        };

        replaceTracks();
    }, [media.screenStream, state.localStream, state.contentMode]);

    // Handle incoming signals
    useEffect(() => {
        if (!isConnected || !roomId || !currentUserId) return;

        console.log(`[WebRTC] Subscribing to signals for user ${currentUserId} in room ${roomId}`);

        const unsubscribe = subscribe(`/topic/room/${roomId}/signal/${currentUserId}`, async (signal: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.log('[WebRTC] Received signal:', signal.type, 'from:', signal.senderId);

            try {
                if (signal.type === 'offer') {
                    const pc = createPeerConnection();
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.data));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    sendMessage(`/app/room/${roomId}/signal`, {
                        type: 'answer',
                        data: answer,
                        senderId: currentUserId,
                        receiverId: signal.senderId
                    });
                }
                else if (signal.type === 'answer') {
                    if (pcRef.current) {
                        await pcRef.current.setRemoteDescription(new RTCSessionDescription(signal.data));
                    }
                }
                else if (signal.type === 'candidate') {
                    if (pcRef.current) {
                        await pcRef.current.addIceCandidate(new RTCIceCandidate(signal.data));
                    }
                }
                else if (signal.type === 'mode-change') {
                    console.log('[WebRTC] Received mode-change:', signal.data);
                    actions.setContentMode(signal.data);
                }
            } catch (err) {
                console.error('[WebRTC] Error handling signal:', err);
            }
        });

        return () => unsubscribe();
    }, [isConnected, roomId, currentUserId, subscribe, sendMessage, createPeerConnection, actions]);

    // Track synchronization: Ensure tracks are added to the PC if they become available after connection
    useEffect(() => {
        if (!pcRef.current || !state.localStream) return;

        const pc = pcRef.current;
        const currentSenders = pc.getSenders();

        state.localStream.getTracks().forEach(track => {
            const existingSender = currentSenders.find(s => s.track?.kind === track.kind);
            if (!existingSender) {
                console.log(`[WebRTC] Adding late track: ${track.kind}`);
                pc.addTrack(track, state.localStream!);
            }
        });
    }, [state.localStream]);

    // Role-based initiation (Tutor initiates offer to Student)
    useEffect(() => {
        const initiateConnection = async () => {
            const isTutor = state.participants.find(p => Number(p.id) === currentUserId)?.role === 'TUTOR';
            const student = state.participants.find(p => p.role === 'STUDENT');

            if (isTutor && student && state.localStream && !pcRef.current && isConnected) {
                console.log('[WebRTC] Initiating offer to Student:', student.id);
                try {
                    const pc = createPeerConnection();
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);

                    sendMessage(`/app/room/${roomId}/signal`, {
                        type: 'offer',
                        data: offer,
                        senderId: currentUserId,
                        receiverId: Number(student.id)
                    });
                } catch (err) {
                    console.error('[WebRTC] Error initiating connection:', err);
                }
            }
        };

        initiateConnection();
    }, [state.participants, state.localStream, currentUserId, roomId, isConnected, sendMessage, createPeerConnection]);

    // Handle Content Mode Change Signaling
    // NOTE: This signal is now sent only by the Tutor when their mode changes
    useEffect(() => {
        if (!isConnected) return;

        const isTutor = state.participants.find(p => Number(p.id) === currentUserId)?.role === 'TUTOR';
        if (!isTutor) return;

        console.log('[WebRTC] Detected mode change to:', state.contentMode);

        // Broadcast mode change to other participant
        const otherPlayer = state.participants.find(p => Number(p.id) !== currentUserId);
        if (otherPlayer) {
            sendMessage(`/app/room/${roomId}/signal`, {
                type: 'mode-change',
                data: state.contentMode,
                senderId: currentUserId,
                receiverId: Number(otherPlayer.id)
            });
        }
    }, [state.contentMode, roomId, currentUserId, state.participants, isConnected, sendMessage]);

    // Cleanup on unmount
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);
};
