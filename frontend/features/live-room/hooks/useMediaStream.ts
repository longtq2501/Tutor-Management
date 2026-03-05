"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

export type MediaErrorType =
    | 'NotAllowedError'
    | 'NotFoundError'
    | 'NotReadableError'
    | 'OverconstrainedError'
    | 'TypeError'
    | 'UnknownError';

/**
 * Hint type for screen share audio limitations.
 * - 'mac'      : macOS detected, system audio not capturable → suggest sharing a Chrome Tab
 * - 'no-audio' : user unchecked "Share audio" or browser fallback without audio
 * - null       : no hint needed (audio is working)
 */
export type ScreenShareAudioHint = 'mac' | 'no-audio' | null;

export interface UseMediaStreamResult {
    stream: MediaStream | null;
    error: MediaErrorType | null;
    isLoading: boolean;
    isMicMuted: boolean;
    isCameraMuted: boolean;
    isScreenSharing: boolean;
    screenStream: MediaStream | null;
    screenShareAudioHint: ScreenShareAudioHint;
    retry: (newConstraints?: MediaStreamConstraints) => void;
    toggleMic: () => void;
    toggleCamera: () => void;
    startScreenShare: () => Promise<MediaStream | null>;
    stopScreenShare: () => void;
    devices: MediaDeviceInfo[];
    switchDevice: (deviceId: string, kind: 'audio' | 'video') => void;
}

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
    const [screenShareAudioHint, setScreenShareAudioHint] = useState<ScreenShareAudioHint>(null);

    const streamRef = useRef<MediaStream | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const muteStateRef = useRef({ audio: false, video: false });

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
            const newMuted = !prev;
            streamRef.current?.getAudioTracks().forEach(t => { t.enabled = !newMuted; });
            return newMuted;
        });
    }, []);

    const toggleCamera = useCallback(() => {
        setIsCameraMuted(prev => {
            const newMuted = !prev;
            streamRef.current?.getVideoTracks().forEach(t => { t.enabled = !newMuted; });
            return newMuted;
        });
    }, []);

    // stopScreenShare dùng ref → không bị stale closure khi gọi từ onended
    const stopScreenShare = useCallback(() => {
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }
        setScreenStream(null);
        setIsScreenSharing(false);
        setScreenShareAudioHint(null);
    }, []);

    const startScreenShare = useCallback(async () => {
        try {
            console.log('[MediaStream] Requesting screen share');

            // macOS does not allow system audio capture via any browser API.
            // The only workaround is to share a specific Chrome Tab
            // (Chrome injects tab audio automatically in that mode).
            const isMac = typeof navigator !== 'undefined' &&
                (/Mac/.test(navigator.userAgent) && !/iPhone|iPad|iPod/.test(navigator.userAgent));

            let newScreenStream: MediaStream;

            try {
                newScreenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: { frameRate: { ideal: 30 } },
                    // Works on Windows/ChromeOS Chrome & Edge.
                    // macOS: silently ignored (no error, just no audio track).
                    // Firefox: may throw TypeError → caught below.
                    audio: true,
                });
            } catch (err: unknown) {
                const name = err instanceof Error ? err.name : '';
                // Firefox throws TypeError for audio:true. Retry without audio.
                if (name === 'TypeError' || name === 'NotSupportedError') {
                    console.warn('[MediaStream] audio:true not supported, retrying without audio');
                    newScreenStream = await navigator.mediaDevices.getDisplayMedia({
                        video: { frameRate: { ideal: 30 } },
                    });
                } else {
                    throw err; // user cancelled or other error → propagate
                }
            }

            screenStreamRef.current = newScreenStream;
            setScreenStream(newScreenStream);
            setIsScreenSharing(true);

            const hasAudio = newScreenStream.getAudioTracks().length > 0;
            console.log(`[MediaStream] Screen share started — audio: ${hasAudio ? 'YES ✅' : 'NO'}`);

            // Determine hint to show in UI:
            // - macOS → always suggest Tab sharing regardless of audio result
            // - Others with no audio → user unchecked "Share audio" in dialog
            if (isMac) {
                setScreenShareAudioHint('mac');
            } else if (!hasAudio) {
                setScreenShareAudioHint('no-audio');
            } else {
                setScreenShareAudioHint(null);
            }

            // Auto-stop when user clicks "Stop sharing" in browser chrome
            newScreenStream.getVideoTracks()[0].onended = () => {
                console.log('[MediaStream] Screen share ended by user');
                stopScreenShare();
            };

            return newScreenStream;
        } catch (err) {
            console.error('[MediaStream] Failed to start screen share:', err);
            return null;
        }
    }, [stopScreenShare]);

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
            newStream.getAudioTracks().forEach(t => { t.enabled = !muteStateRef.current.audio; });
            newStream.getVideoTracks().forEach(t => { t.enabled = !muteStateRef.current.video; });
            setStream(newStream);
            setError(null);
            await getDevices();
        } catch (err: unknown) {
            const errName = err instanceof Error ? err.name : '';
            const errMessage = err instanceof Error ? err.message : '';

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
    }, [constraints, stopStream, getDevices]);

    useEffect(() => {
        getMedia();
        return () => stopStream();
    }, [getMedia, stopStream, retryCount]);

    const retry = useCallback((newConstraints?: MediaStreamConstraints) => {
        if (newConstraints) setConstraints(newConstraints);
        stopStream();
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
        screenShareAudioHint,
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
        switchDevice,
    };
};