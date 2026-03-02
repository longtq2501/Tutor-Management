"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Media extraction error types.
 */
export type MediaErrorType =
    | 'NotAllowedError'
    | 'NotFoundError'
    | 'NotReadableError'
    | 'OverconstrainedError'
    | 'TypeError'
    | 'UnknownError';

/**
 * Result of the useMediaStream hook.
 */
export interface UseMediaStreamResult {
    stream: MediaStream | null;
    error: MediaErrorType | null;
    isLoading: boolean;
    isMicMuted: boolean;
    isCameraMuted: boolean;
    isScreenSharing: boolean;
    screenStream: MediaStream | null;
    retry: (newConstraints?: MediaStreamConstraints) => void;
    toggleMic: () => void;
    toggleCamera: () => void;
    startScreenShare: () => Promise<MediaStream | null>;
    stopScreenShare: () => void;
    devices: MediaDeviceInfo[];
    switchDevice: (deviceId: string, kind: 'audio' | 'video') => void;
}

/**
 * Hook to manage media stream access (camera/microphone).
 * Features reliable cleanup via useRef, permission checks, and mute/unmute controls.
 */
export const useMediaStream = (
    initialConstraints: MediaStreamConstraints = { video: true, audio: true }
): UseMediaStreamResult => {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<MediaErrorType | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [retryCount, setRetryCount] = useState<number>(0);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [constraints, setConstraints] = useState(initialConstraints);
    const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
    const [isCameraMuted, setIsCameraMuted] = useState<boolean>(false);
    const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
    const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
    const streamRef = useRef<MediaStream | null>(null);
    const muteStateRef = useRef({ audio: false, video: false });

    // Keep ref in sync for initial stream creation
    useEffect(() => {
        muteStateRef.current = { audio: isMicMuted, video: isCameraMuted };
    }, [isMicMuted, isCameraMuted]);

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const toggleMic = useCallback(() => {
        setIsMicMuted(prev => {
            const newMutedState = !prev;
            if (streamRef.current) {
                streamRef.current.getAudioTracks().forEach(track => {
                    track.enabled = !newMutedState;
                });
            }
            return newMutedState;
        });
    }, []);

    const toggleCamera = useCallback(() => {
        console.log('[MediaStream] Toggling camera. Current muted state:', isCameraMuted);
        setIsCameraMuted(prev => {
            const newMutedState = !prev;
            if (streamRef.current) {
                console.log('[MediaStream] Setting video tracks enabled to:', !newMutedState);
                streamRef.current.getVideoTracks().forEach(track => {
                    track.enabled = !newMutedState;
                });
            }
            return newMutedState;
        });
    }, [isCameraMuted]);

    const startScreenShare = useCallback(async () => {
        try {
            console.log('[MediaStream] Requesting screen share');
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });
            setScreenStream(stream);
            setIsScreenSharing(true);

            stream.getVideoTracks()[0].onended = () => {
                stopScreenShare();
            };

            return stream;
        } catch (err) {
            console.error('[MediaStream] Failed to start screen share:', err);
            return null;
        }
    }, []);

    const stopScreenShare = useCallback(() => {
        if (screenStream) {
            screenStream.getTracks().forEach(track => track.stop());
        }
        setScreenStream(null);
        setIsScreenSharing(false);
    }, [screenStream]);

    const getDevices = useCallback(async () => {
        try {
            const deviceList = await navigator.mediaDevices.enumerateDevices();
            setDevices(deviceList);
        } catch (err) {
            console.error('Error enumerating devices:', err);
        }
    }, []);

    const getMedia = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setError('TypeError');
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            stopStream();
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = newStream;

            // Sync current mute states to new stream tracks using Ref to avoid getMedia dependency
            newStream.getAudioTracks().forEach(track => track.enabled = !muteStateRef.current.audio);
            newStream.getVideoTracks().forEach(track => track.enabled = !muteStateRef.current.video);

            setStream(newStream);
            setError(null);
            await getDevices();
        } catch (err: any) {
            // Silence console error for common/expected hardware missing scenarios 
            // the error is still propagated to the UI via state.
            const errName = err.name || '';
            const errMessage = err.message || '';

            if (errName !== 'NotFoundError' && errName !== 'DevicesNotFoundError') {
                console.warn('Media access error (handled):', { name: errName, message: errMessage });
            }

            if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError' || errName === 'SecurityError') {
                setError('NotAllowedError');
            } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
                setError('NotFoundError');
            } else if (
                errName === 'NotReadableError' ||
                errName === 'TrackStartError' ||
                errName === 'SourceUnavailableError' ||
                errMessage.includes('Could not start video source') ||
                errMessage.includes('hardware error')
            ) {
                setError('NotReadableError');
            } else if (errName === 'OverconstrainedError') {
                setError('OverconstrainedError');
            } else if (errName === 'TypeError') {
                setError('TypeError');
            } else {
                setError('UnknownError');
            }
            setStream(null);
        } finally {
            setIsLoading(false);
        }
    }, [constraints, stopStream, getDevices]); // Removed isMicMuted, isCameraMuted

    useEffect(() => {
        getMedia();
        return () => stopStream();
    }, [getMedia, stopStream, retryCount]);

    const retry = useCallback((newConstraints?: MediaStreamConstraints) => {
        if (newConstraints) {
            setConstraints(newConstraints);
        }
        stopStream(); // Ensure old stream is stopped before retry
        setRetryCount(prev => prev + 1);
    }, [stopStream]);

    const switchDevice = useCallback((deviceId: string, kind: 'audio' | 'video') => {
        setConstraints(prev => ({
            ...prev,
            [kind]: typeof prev[kind] === 'boolean'
                ? { deviceId: { exact: deviceId } }
                : { ...(prev[kind] as object), deviceId: { exact: deviceId } }
        }));
    }, []);

    return {
        stream,
        screenStream,
        error,
        isLoading,
        isMicMuted,
        isCameraMuted,
        isScreenSharing,
        retry,
        toggleMic,
        toggleCamera,
        startScreenShare,
        stopScreenShare,
        devices,
        switchDevice
    };
};
