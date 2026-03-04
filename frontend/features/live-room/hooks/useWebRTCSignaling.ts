import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useRoomState } from '../context/RoomStateContext';

/**
 * Hook to manage WebRTC P2P connection and signaling.
 *
 * === Fixes Applied ===
 *
 * Bug 1 (Race condition — Offer before Student subscribes):
 *   Added retry-with-backoff (waitForStudentReady) before sending the offer.
 *   Added cancellation token so overlapping async initiations never double-send.
 *
 * Bug 2 (Subscribe no-op / reconnect drops subscriptions):
 *   Added `connectionId` from WebSocketContext to the signal-subscription effect's
 *   dependency array. Each reconnect bumps connectionId, forcing a clean re-subscribe.
 *
 * Bug 3 (mode-change broadcast on every re-render):
 *   Added prevContentModeRef — only broadcasts when contentMode actually transitions.
 *
 * Bug 5 (Async effect without cancellation — double offer):
 *   Cleanup function sets `cancelled = true`; every await checkpoint respects it.
 *
 * Bug 6 (Stale closure for contentMode inside signal handler):
 *   contentModeRef is kept in sync and used inside the STOMP callback instead of
 *   the captured state value.
 */
export const useWebRTCSignaling = (
    roomId: string,
    currentUserId: number,
    media: any // eslint-disable-line @typescript-eslint/no-explicit-any
) => {
    const { subscribe, sendMessage, isConnected, connectionId } = useWebSocket();
    const { state, actions } = useRoomState();

    const pcRef = useRef<RTCPeerConnection | null>(null);

    // ---- Refs that mirror live state for use inside async callbacks / closures ----
    const participantsRef = useRef(state.participants);
    const localStreamRef = useRef(state.localStream);
    // ✅ Bug 6 Fix: contentModeRef prevents stale closures in the STOMP callback
    const contentModeRef = useRef(state.contentMode);

    useEffect(() => { participantsRef.current = state.participants; }, [state.participants]);
    useEffect(() => { localStreamRef.current = state.localStream; }, [state.localStream]);
    useEffect(() => { contentModeRef.current = state.contentMode; }, [state.contentMode]);

    // ---- ICE Candidate Queue ----
    // Holds candidates that arrive before setRemoteDescription is called.
    const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);

    // ---- PeerConnection Configuration ----
    const configuration: RTCConfiguration = useMemo(() => ({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ],
    }), []);

    // ---- Cleanup ----
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

    // ---- Create PeerConnection ----
    const createPeerConnection = useCallback(() => {
        cleanup();

        console.log('[WebRTC] Creating new PeerConnection');
        const pc = new RTCPeerConnection(configuration);

        pc.onicecandidate = (event) => {
            if (!event.candidate) return;
            const otherPlayer = participantsRef.current.find(p => Number(p.id) !== currentUserId);
            if (otherPlayer) {
                sendMessage(`/app/room/${roomId}/signal`, {
                    type: 'candidate',
                    data: event.candidate,
                    senderId: currentUserId,
                    receiverId: Number(otherPlayer.id),
                });
            }
        };

        pc.ontrack = (event) => {
            console.log('[WebRTC] Received remote track:', event.streams[0]);
            if (event.streams?.[0]) {
                actions.setRemoteStream(event.streams[0]);
            }
        };

        pc.onconnectionstatechange = () => {
            const cs = pc.connectionState;
            console.log(`[WebRTC] Connection state: ${cs}`);
            if (cs === 'connected') {
                actions.setConnectionState('CONNECTED');
            } else if (cs === 'failed') {
                actions.setConnectionState('FAILED');
                actions.setError('Kết nối P2P thất bại. Vui lòng thử lại.');
            } else if (cs === 'disconnected') {
                console.warn('[WebRTC] Peer disconnected');
            }
        };

        // Add local tracks immediately if available
        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
        }

        pcRef.current = pc;
        return pc;
    }, [roomId, currentUserId, sendMessage, actions, cleanup, configuration]);

    // ---- Track Replacement: Camera ↔ Screen ----
    useEffect(() => {
        const replaceTracks = async () => {
            if (!pcRef.current) return;
            if (state.contentMode === 'screen' && !media.screenStream) {
                console.log('[WebRTC] Deferring track replacement: screen stream not ready');
                return;
            }

            const pc = pcRef.current;
            const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (!videoSender) return;

            const targetStream = state.contentMode === 'screen' ? media.screenStream : state.localStream;
            const newTrack = targetStream?.getVideoTracks()[0] ?? null;

            if (newTrack && videoSender.track !== newTrack) {
                console.log('[WebRTC] Replacing video track →', state.contentMode === 'screen' ? 'screen' : 'camera');
                await videoSender.replaceTrack(newTrack);
            }
        };

        replaceTracks();
    }, [media.screenStream, state.localStream, state.contentMode]);

    // ---- Incoming Signal Handler ----
    // ✅ Bug 2 Fix: connectionId in deps ensures re-subscribe after every reconnect
    useEffect(() => {
        if (!isConnected || !roomId || !currentUserId) return;

        console.log(`[WebRTC] Subscribing to signals — user ${currentUserId}, room ${roomId}, connectionId ${connectionId}`);

        const unsubscribe = subscribe(
            `/topic/room/${roomId}/signal/${currentUserId}`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async (signal: any) => {
                console.log('[WebRTC] Received signal:', signal.type, 'from:', signal.senderId);

                try {
                    if (signal.type === 'offer') {
                        const pc = createPeerConnection();
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.data));

                        while (iceCandidateQueue.current.length > 0) {
                            const candidate = iceCandidateQueue.current.shift();
                            if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        }

                        const answer = await pc.createAnswer();
                        await pc.setLocalDescription(answer);

                        sendMessage(`/app/room/${roomId}/signal`, {
                            type: 'answer',
                            data: answer,
                            senderId: currentUserId,
                            receiverId: signal.senderId,
                        });
                    }

                    else if (signal.type === 'answer') {
                        const pc = pcRef.current;
                        if (pc && pc.signalingState !== 'stable') {
                            await pc.setRemoteDescription(new RTCSessionDescription(signal.data));

                            while (iceCandidateQueue.current.length > 0) {
                                const candidate = iceCandidateQueue.current.shift();
                                if (candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
                            }
                        }
                    }

                    else if (signal.type === 'candidate') {
                        const pc = pcRef.current;
                        if (pc?.remoteDescription?.type) {
                            await pc.addIceCandidate(new RTCIceCandidate(signal.data));
                        } else {
                            console.log('[WebRTC] Queueing ICE candidate (remote description not set yet)');
                            iceCandidateQueue.current.push(signal.data);
                        }
                    }

                    else if (signal.type === 'mode-change') {
                        console.log('[WebRTC] Received mode-change:', signal.data);
                        // ✅ Bug 6 Fix: Use ref — not the captured state — to avoid stale closure
                        if (contentModeRef.current !== signal.data) {
                            actions.setContentMode(signal.data);
                        }
                    }

                } catch (err) {
                    console.error('[WebRTC] Error handling signal:', err, '| Signal type:', signal.type);
                }
            }
        );

        return () => {
            console.log('[WebRTC] Unsubscribing from signaling');
            unsubscribe();
            iceCandidateQueue.current = [];
        };
        // ✅ Bug 2 Fix: connectionId added so this re-runs on every WebSocket reconnect
    }, [isConnected, connectionId, roomId, currentUserId, subscribe, sendMessage, createPeerConnection, actions]);

    // ---- Late Track Synchronization ----
    // Adds tracks that became available after the PeerConnection was already created.
    useEffect(() => {
        if (!pcRef.current || !state.localStream) return;

        const pc = pcRef.current;
        const senders = pc.getSenders();

        state.localStream.getTracks().forEach(track => {
            const alreadyAdded = senders.some(s => s.track?.kind === track.kind);
            if (!alreadyAdded) {
                console.log(`[WebRTC] Adding late track: ${track.kind}`);
                pc.addTrack(track, state.localStream!);
            }
        });
    }, [state.localStream]);

    // ---- Role-Based Connection Initiation (Tutor → Student) ----
    // ✅ Bug 1 Fix: retry-with-backoff so offer is only sent once Student is subscribed
    // ✅ Bug 5 Fix: cancellation token prevents double-offers from overlapping async runs
    useEffect(() => {
        let cancelled = false;

        const initiateConnection = async () => {
            const isTutor = state.participants.find(p => Number(p.id) === currentUserId)?.role === 'TUTOR';
            if (!isTutor || !isConnected || pcRef.current || !state.localStream) return;

            // Retry with backoff until Student appears in the participants list
            const waitForStudentReady = async (maxAttempts = 5) => {
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    if (cancelled) return null;

                    const student = participantsRef.current.find(p => p.role === 'STUDENT');
                    if (student) return student;

                    const delay = 800 * (attempt + 1); // 800ms, 1600ms, 2400ms …
                    console.log(
                        `[WebRTC] Student not found — retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`
                    );
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                return null;
            };

            const student = await waitForStudentReady();

            // ✅ Bug 5 Fix: all three guards must pass after async wait
            if (cancelled || !student || pcRef.current) {
                if (!student) console.warn('[WebRTC] Student not ready after max retries');
                return;
            }

            console.log('[WebRTC] Initiating offer to Student:', student.id);
            try {
                const pc = createPeerConnection();
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                sendMessage(`/app/room/${roomId}/signal`, {
                    type: 'offer',
                    data: offer,
                    senderId: currentUserId,
                    receiverId: Number(student.id),
                });
            } catch (err) {
                console.error('[WebRTC] Error initiating connection:', err);
            }
        };

        initiateConnection();

        // ✅ Bug 5 Fix: cancel any in-flight async operation when effect re-runs
        return () => { cancelled = true; };
    }, [state.participants, state.localStream, currentUserId, roomId, isConnected, sendMessage, createPeerConnection]);

    // ---- Content Mode Change Signaling (Tutor only) ----
    // ✅ Bug 3 Fix: prevContentModeRef prevents broadcasting on unrelated re-renders
    const prevContentModeRef = useRef(state.contentMode);

    useEffect(() => {
        if (!isConnected) return;

        if (prevContentModeRef.current === state.contentMode) return;
        prevContentModeRef.current = state.contentMode;

        const isTutor = state.participants.find(p => Number(p.id) === currentUserId)?.role === 'TUTOR';
        if (!isTutor) return;

        const otherPlayer = state.participants.find(p => Number(p.id) !== currentUserId);
        if (!otherPlayer) return;

        console.log('[WebRTC] Broadcasting mode change →', state.contentMode);
        sendMessage(`/app/room/${roomId}/signal`, {
            type: 'mode-change',
            data: state.contentMode,
            senderId: currentUserId,
            receiverId: Number(otherPlayer.id),
        });
    }, [state.contentMode, roomId, currentUserId, state.participants, isConnected, sendMessage]);

    // ---- Cleanup on Unmount ----
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);
};