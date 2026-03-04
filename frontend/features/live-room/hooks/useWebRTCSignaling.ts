import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useRoomState } from '../context/RoomStateContext';

/**
 * Hook to manage WebRTC P2P connection and signaling.
 *
 * === Fixes Applied ===
 *
 * Bug 1 (Race condition — Offer before Student subscribes):
 *   retry-with-backoff + cancellation token.
 *
 * Bug 2 (Subscribe no-op / reconnect drops subscriptions):
 *   connectionId from WebSocketContext forces re-subscribe on every reconnect.
 *
 * Bug 3 (mode-change broadcast on every re-render):
 *   REMOVED the standalone mode-change effect entirely.
 *   mode-change is now broadcast only from inside replaceAndBroadcast (Bug 7 fix).
 *
 * Bug 5 (Async effect without cancellation — double offer):
 *   cancelled flag checked at every async checkpoint.
 *
 * Bug 6 (Stale closure for contentMode inside signal handler):
 *   contentModeRef kept in sync, used inside STOMP callback.
 *
 * Bug 7 ✅ NEW (mode-change broadcast BEFORE track is ready):
 *   replaceTrack and mode-change broadcast are now a single atomic operation.
 *   Student only receives mode-change AFTER the new track is live on the sender.
 *   The old standalone mode-change useEffect has been deleted.
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
    // Bug 6: contentModeRef prevents stale closures inside the STOMP callback
    const contentModeRef = useRef(state.contentMode);
    // Bug 7: isTutorRef avoids re-reading state inside the replaceAndBroadcast effect
    const isTutorRef = useRef(false);

    useEffect(() => { participantsRef.current = state.participants; }, [state.participants]);
    useEffect(() => { localStreamRef.current = state.localStream; }, [state.localStream]);
    useEffect(() => { contentModeRef.current = state.contentMode; }, [state.contentMode]);
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

    // ---- Track Replacement + mode-change Broadcast (Atomic) ----
    //
    // ✅ Bug 7 Fix: replaceTrack and mode-change signal are ONE atomic operation.
    //
    // OLD (broken) flow:
    //   contentMode changes → mode-change broadcast immediately
    //                       → replaceTrack starts (async, not done yet)
    //   Student receives mode-change → switches UI → remoteStream has OLD track → black screen
    //
    // NEW (correct) flow:
    //   contentMode changes → replaceTrack runs first
    //                       → ONLY AFTER replaceTrack succeeds → broadcast mode-change
    //   Student receives mode-change → switches UI → remoteStream already has NEW track ✅
    //
    // The old standalone mode-change useEffect has been DELETED.
    // This effect re-runs when media.screenStream becomes available (deferred case).
    useEffect(() => {
        const replaceAndBroadcast = async () => {
            if (!pcRef.current) return;

            // Guard: wait for screenStream before proceeding.
            // This effect re-runs automatically once media.screenStream is populated.
            if (state.contentMode === 'screen' && !media.screenStream) {
                console.log('[WebRTC] Deferring: screen stream not ready yet');
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
                console.log('[WebRTC] replaceTrack done for mode:', state.contentMode);

                // ✅ Broadcast mode-change ONLY after track is live on the sender.
                // Only Tutor broadcasts; Student just reacts when it receives the signal.
                if (isTutorRef.current && isConnected) {
                    const otherPlayer = participantsRef.current
                        .find(p => Number(p.id) !== currentUserId);
                    if (otherPlayer) {
                        console.log('[WebRTC] Broadcasting mode-change AFTER track replaced →', state.contentMode);
                        sendMessage(`/app/room/${roomId}/signal`, {
                            type: 'mode-change',
                            data: state.contentMode,
                            senderId: currentUserId,
                            receiverId: Number(otherPlayer.id),
                        });
                    }
                }
            }
        };

        replaceAndBroadcast();
    }, [media.screenStream, state.localStream, state.contentMode, isConnected, roomId, currentUserId, sendMessage]);

    // ---- Incoming Signal Handler ----
    // Bug 2: connectionId in deps ensures re-subscribe after every WebSocket reconnect
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
                        // Wait for local stream before creating PC so Student's tracks are included.
                        // Without this, Student's PeerConnection has no video track → Tutor sees black.
                        if (!localStreamRef.current) {
                            console.warn('[WebRTC] Local stream not ready on offer receipt, waiting...');
                            await new Promise<void>((resolve) => {
                                const interval = setInterval(() => {
                                    if (localStreamRef.current) {
                                        clearInterval(interval);
                                        resolve();
                                    }
                                }, 200);
                                // Timeout after 5s to avoid hanging forever
                                setTimeout(() => { clearInterval(interval); resolve(); }, 5000);
                            });
                        }

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
                        // Bug 6: use ref (not captured state) to avoid stale closure
                        if (contentModeRef.current !== signal.data) {
                            actions.setContentMode(signal.data);
                        }
                    }

                } catch (err) {
                    console.error('[WebRTC] Error handling signal:', err, '| type:', signal.type);
                }
            }
        );

        return () => {
            console.log('[WebRTC] Unsubscribing from signaling');
            unsubscribe();
            iceCandidateQueue.current = [];
        };
        // Bug 2: connectionId forces re-subscribe on every reconnect
    }, [isConnected, connectionId, roomId, currentUserId, subscribe, sendMessage, createPeerConnection, actions]);

    // ---- Late Track Synchronization ----
    // Adds tracks that became available after PeerConnection was already created.
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
    // Bug 1: retry-with-backoff so offer is only sent once Student is subscribed.
    // Bug 5: cancellation token prevents double-offers from overlapping async runs.
    useEffect(() => {
        let cancelled = false;

        const initiateConnection = async () => {
            const isTutor = state.participants.find(p => Number(p.id) === currentUserId)?.role === 'TUTOR';
            if (!isTutor || !isConnected || pcRef.current || !state.localStream) return;

            const waitForStudentReady = async (maxAttempts = 5) => {
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    if (cancelled) return null;
                    const student = participantsRef.current.find(p => p.role === 'STUDENT');
                    if (student) return student;
                    const delay = 800 * (attempt + 1); // 800, 1600, 2400, 3200, 4000 ms
                    console.log(`[WebRTC] Student not found — retrying in ${delay}ms (attempt ${attempt + 1}/${maxAttempts})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
                return null;
            };

            const student = await waitForStudentReady();

            // Bug 5: all three guards must pass after the async wait
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

        // Bug 5: cancel in-flight async operation when effect re-runs
        return () => { cancelled = true; };
    }, [state.participants, state.localStream, currentUserId, roomId, isConnected, sendMessage, createPeerConnection]);

    // ---- Cleanup on Unmount ----
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);
};