import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useRoomState } from '../context/RoomStateContext';

/**
 * Hook to manage WebRTC P2P connection and signaling.
 *
 * === Key Design Principles ===
 *
 * 1. P2P connection is INDEPENDENT of camera/mic availability.
 *    The offer is sent as soon as both parties are present and WebSocket is ready,
 *    regardless of whether localStream exists. Tracks are added opportunistically.
 *
 * 2. Tracks are added/replaced non-destructively:
 *    - If localStream arrives AFTER the PC is created → addTrack (late sync)
 *    - If contentMode changes → replaceTrack (no renegotiation needed)
 *    - mode-change signal is sent ONLY after replaceTrack succeeds (atomic)
 *
 * 3. Reconnect-safe:
 *    - connectionId from WebSocketContext increments on every reconnect
 *    - Signal subscription effect re-runs on connectionId change
 *    - Offer initiation re-runs on connectionId change too
 *
 * === Bug Fixes ===
 * Bug 1  Race condition offer before Student subscribes → retry-with-backoff
 * Bug 2  Subscribe no-op after reconnect → connectionId dependency
 * Bug 3  mode-change broadcast on every re-render → removed standalone effect
 * Bug 5  Double offer from overlapping async → cancellation token
 * Bug 6  Stale closure for contentMode in STOMP callback → contentModeRef
 * Bug 7  mode-change before replaceTrack finishes → atomic replaceAndBroadcast
 * Bug 8  P2P fails when camera unavailable → offer no longer gated on localStream
 */
export const useWebRTCSignaling = (
    roomId: string,
    currentUserId: number,
    media: any // eslint-disable-line @typescript-eslint/no-explicit-any
) => {
    const { subscribe, sendMessage, isConnected, connectionId } = useWebSocket();
    const { state, actions } = useRoomState();

    const pcRef = useRef<RTCPeerConnection | null>(null);

    // ---- Refs: mirror live state for use inside async callbacks / closures ----
    const participantsRef = useRef(state.participants);
    const localStreamRef  = useRef(state.localStream);
    const contentModeRef  = useRef(state.contentMode);  // Bug 6
    const isTutorRef      = useRef(false);               // Bug 7

    useEffect(() => { participantsRef.current = state.participants; }, [state.participants]);
    useEffect(() => { localStreamRef.current  = state.localStream;  }, [state.localStream]);
    useEffect(() => { contentModeRef.current  = state.contentMode;  }, [state.contentMode]);
    useEffect(() => {
        isTutorRef.current =
            state.participants.find(p => Number(p.id) === currentUserId)?.role === 'TUTOR';
    }, [state.participants, currentUserId]);

    // ---- ICE Candidate Queue ----
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
            pcRef.current.onicecandidate      = null;
            pcRef.current.ontrack             = null;
            pcRef.current.onconnectionstatechange = null;
            pcRef.current.close();
            pcRef.current = null;
        }
    }, []);

    // ---- Create PeerConnection ----
    // Bug 8: Does NOT require localStream to exist.
    //        Tracks are added if available; added later via late-sync effect if not.
    const createPeerConnection = useCallback(() => {
        cleanup();
        console.log('[WebRTC] Creating new PeerConnection');

        const pc = new RTCPeerConnection(configuration);

        pc.onicecandidate = (event) => {
            if (!event.candidate) return;
            const other = participantsRef.current.find(p => Number(p.id) !== currentUserId);
            if (other) {
                sendMessage(`/app/room/${roomId}/signal`, {
                    type: 'candidate',
                    data: event.candidate,
                    senderId: currentUserId,
                    receiverId: Number(other.id),
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
                console.warn('[WebRTC] Peer disconnected — may recover automatically');
                // Do NOT set FAILED here; ICE may self-recover within a few seconds.
            }
        };

        // Add tracks only if stream is already available.
        // If not, late-sync effect will call addTrack when stream arrives.
        const stream = localStreamRef.current;
        if (stream) {
            stream.getTracks().forEach(track => {
                console.log(`[WebRTC] Adding initial track: ${track.kind}`);
                pc.addTrack(track, stream);
            });
        } else {
            console.log('[WebRTC] No local stream yet — tracks will be added when available');
        }

        pcRef.current = pc;
        return pc;
    }, [roomId, currentUserId, sendMessage, actions, cleanup, configuration]);

    // ---- Track Replacement + mode-change Broadcast (Atomic) ----
    // Bug 7: replaceTrack and mode-change signal are ONE atomic operation.
    // Bug 3: Standalone mode-change effect removed; broadcast only happens here.
    //
    // Flow:
    //   contentMode changes (or screenStream arrives)
    //   → replaceTrack on existing sender
    //   → ONLY AFTER success: broadcast mode-change to remote
    //   Student UI switches only after remote track is already updated ✅
    useEffect(() => {
        const replaceAndBroadcast = async () => {
            if (!pcRef.current) return;

            // Defer until screenStream is populated (effect re-runs when it is)
            if (state.contentMode === 'screen' && !media.screenStream) {
                console.log('[WebRTC] Deferring track replacement: screen stream not ready');
                return;
            }

            const pc = pcRef.current;
            const videoSender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (!videoSender) return;

            const targetStream =
                state.contentMode === 'screen' ? media.screenStream : state.localStream;
            const newTrack = targetStream?.getVideoTracks()[0] ?? null;

            if (newTrack && videoSender.track !== newTrack) {
                console.log('[WebRTC] Replacing video track →', state.contentMode);
                await videoSender.replaceTrack(newTrack);
                console.log('[WebRTC] replaceTrack complete');

                // Broadcast mode-change only after track is live on sender (Tutor only)
                if (isTutorRef.current && isConnected) {
                    const other = participantsRef.current.find(p => Number(p.id) !== currentUserId);
                    if (other) {
                        console.log('[WebRTC] Broadcasting mode-change AFTER replaceTrack →', state.contentMode);
                        sendMessage(`/app/room/${roomId}/signal`, {
                            type: 'mode-change',
                            data: state.contentMode,
                            senderId: currentUserId,
                            receiverId: Number(other.id),
                        });
                    }
                }
            }
        };

        replaceAndBroadcast();
    }, [media.screenStream, state.localStream, state.contentMode, isConnected, roomId, currentUserId, sendMessage]);

    // ---- Incoming Signal Handler ----
    // Bug 2: connectionId in deps → re-subscribe after every WebSocket reconnect
    useEffect(() => {
        if (!isConnected || !roomId || !currentUserId) return;

        console.log(`[WebRTC] Subscribing to signals — user ${currentUserId}, room ${roomId}, connId ${connectionId}`);

        const unsubscribe = subscribe(
            `/topic/room/${roomId}/signal/${currentUserId}`,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            async (signal: any) => {
                console.log('[WebRTC] Signal received:', signal.type, 'from:', signal.senderId);

                try {
                    if (signal.type === 'offer') {
                        // Bug 8: Do NOT wait for localStream before creating PC.
                        // We create the PC immediately so signaling isn't blocked.
                        // Late-sync effect will add tracks if/when stream arrives.
                        const pc = createPeerConnection();
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.data));

                        // Flush queued ICE candidates
                        while (iceCandidateQueue.current.length > 0) {
                            const c = iceCandidateQueue.current.shift();
                            if (c) await pc.addIceCandidate(new RTCIceCandidate(c));
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
                                const c = iceCandidateQueue.current.shift();
                                if (c) await pc.addIceCandidate(new RTCIceCandidate(c));
                            }
                        }
                    }

                    else if (signal.type === 'candidate') {
                        const pc = pcRef.current;
                        if (pc?.remoteDescription?.type) {
                            await pc.addIceCandidate(new RTCIceCandidate(signal.data));
                        } else {
                            console.log('[WebRTC] Queueing ICE candidate');
                            iceCandidateQueue.current.push(signal.data);
                        }
                    }

                    else if (signal.type === 'mode-change') {
                        console.log('[WebRTC] Received mode-change:', signal.data);
                        // Bug 6: use ref to avoid stale closure
                        if (contentModeRef.current !== signal.data) {
                            actions.setContentMode(signal.data);
                        }
                    }

                } catch (err) {
                    console.error('[WebRTC] Signal handling error:', err, '| type:', signal.type);
                }
            }
        );

        return () => {
            console.log('[WebRTC] Unsubscribing signals');
            unsubscribe();
            iceCandidateQueue.current = [];
        };
    }, [isConnected, connectionId, roomId, currentUserId, subscribe, sendMessage, createPeerConnection, actions]);

    // ---- Late Track Synchronization ----
    // Handles two cases:
    // 1. Camera permission granted AFTER PC was already created (common when no camera initially)
    // 2. Camera recovered after NotReadableError and user retried
    useEffect(() => {
        if (!pcRef.current || !state.localStream) return;

        const pc = pcRef.current;
        const senders = pc.getSenders();

        state.localStream.getTracks().forEach(track => {
            const existingSender = senders.find(s => s.track?.kind === track.kind);
            if (!existingSender) {
                // No sender for this kind → add the track
                console.log(`[WebRTC] Late-adding track: ${track.kind}`);
                pc.addTrack(track, state.localStream!);
            } else if (existingSender.track !== track) {
                // Sender exists but track changed (e.g. after retry()) → replace
                console.log(`[WebRTC] Late-replacing track: ${track.kind}`);
                existingSender.replaceTrack(track).catch(err =>
                    console.warn('[WebRTC] Late replaceTrack failed:', err)
                );
            }
        });
    }, [state.localStream]);

    // ---- Role-Based Connection Initiation (Tutor → Student) ----
    //
    // Bug 8: Offer is NO LONGER gated on localStream.
    //        P2P connects regardless of camera availability.
    //        If Tutor has no camera: offer is sent, ICE connects, remote sees no track (expected).
    //        If camera becomes available later: late-sync effect adds the track.
    //
    // Bug 1: retry-with-backoff waits for Student presence before sending offer
    // Bug 5: cancellation token prevents double-offers from overlapping async runs
    // Bug 2: connectionId in deps re-initiates after WebSocket reconnect
    useEffect(() => {
        let cancelled = false;

        const initiateConnection = async () => {
            const isTutor = state.participants.find(p => Number(p.id) === currentUserId)?.role === 'TUTOR';

            // Bug 8: Removed `&& !state.localStream` guard — P2P starts regardless of camera
            if (!isTutor || !isConnected || pcRef.current) return;

            const waitForStudent = async (maxAttempts = 5) => {
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    if (cancelled) return null;
                    const student = participantsRef.current.find(p => p.role === 'STUDENT');
                    if (student) return student;
                    const delay = 800 * (attempt + 1);
                    console.log(`[WebRTC] Waiting for Student — attempt ${attempt + 1}/${maxAttempts} (${delay}ms)`);
                    await new Promise(r => setTimeout(r, delay));
                }
                return null;
            };

            const student = await waitForStudent();

            // Bug 5: all guards re-checked after async wait
            if (cancelled || !student || pcRef.current) {
                if (!student) console.warn('[WebRTC] Student not ready after max retries');
                return;
            }

            console.log('[WebRTC] Initiating offer → Student:', student.id);
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
                console.error('[WebRTC] Offer initiation failed:', err);
            }
        };

        initiateConnection();

        // Bug 5: cancel in-flight async on re-run
        return () => { cancelled = true; };

    // Bug 2: connectionId re-initiates after WebSocket reconnect
    // Bug 8: state.localStream REMOVED from deps — no longer a gate
    }, [state.participants, isConnected, connectionId, currentUserId, roomId, sendMessage, createPeerConnection]);

    // ---- Cleanup on Unmount ----
    useEffect(() => () => cleanup(), [cleanup]);
};