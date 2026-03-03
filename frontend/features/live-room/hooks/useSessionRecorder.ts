'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { getSupportedMimeType } from '@/lib/utils/browserCompat';
import { createRecordingStream } from '@/lib/utils/mediaStreamUtils';

const MAX_DURATION = 2 * 60 * 60 * 1000;
const WARNING_1 = 105 * 60 * 1000;
const WARNING_2 = 115 * 60 * 1000;

export type RecordingQuality = 'low' | 'balanced' | 'high';

const BITRATES: Record<RecordingQuality, number> = {
    low: 256000,
    balanced: 1000000,
    high: 2500000,
};

export const FILE_SIZE_MB_PER_HOUR: Record<RecordingQuality, number> = {
    low: 112,
    balanced: 439,
    high: 1098,
};

const useRecordingTimer = (isRecording: boolean, onLimitReached: () => void) => {
    const [duration, setDuration] = useState(0);
    const [warning, setWarning] = useState<string | null>(null);
    const startTimeRef = useRef<number>(0);

    // Reset logic separated from the interval logic
    useEffect(() => {
        if (!isRecording) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDuration(prev => prev !== 0 ? 0 : prev);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setWarning(prev => prev !== null ? null : prev);
        }
    }, [isRecording]);

    useEffect(() => {
        if (!isRecording) {
            return;
        }

        startTimeRef.current = Date.now();
        const interval = setInterval(() => {
            const currentDuration = Date.now() - startTimeRef.current;
            setDuration(currentDuration);

            if (currentDuration >= MAX_DURATION) {
                onLimitReached();
            } else if (currentDuration >= WARNING_2) {
                setWarning('Ghi hình sẽ tự động dừng sau 5 phút để bảo vệ dữ liệu.');
            } else if (currentDuration >= WARNING_1) {
                setWarning('Ghi hình đã kéo dài 1h 45m. Giới hạn là 2 giờ.');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [isRecording, onLimitReached]);

    return { duration, warning };
};

const useBeforeUnload = (isRecording: boolean) => {
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isRecording) {
                e.preventDefault();
                e.returnValue = 'Ghi hình đang diễn ra. Bạn có chắc muốn rời đi?';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isRecording]);
};

export const useSessionRecorder = (stream: MediaStream | null) => {
    const [isRecording, setIsRecording] = useState(false);
    const [quality, setQualityState] = useState<RecordingQuality>('balanced');
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordingStreamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number>(0);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewMeta, setPreviewMeta] = useState<{ size: number; duration: number } | null>(null);

    const setQuality = useCallback((newQuality: RecordingQuality) => {
        if (isRecording) {
            console.warn('[Recording] Cannot change quality during recording');
            return;
        }
        setQualityState(newQuality);
    }, [isRecording]);

    const discardRecording = useCallback(() => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
            setPreviewMeta(null);
        }
        chunksRef.current = [];
        console.log('[Recording] Discarded');
    }, [previewUrl]);

    const confirmDownload = useCallback(() => {
        // ✅ FIX: Check previewUrl and previewMeta instead of chunksRef
        if (!previewUrl || !previewMeta) {
            console.error('[Download] No recording preview available');
            return;
        }

        console.log('[Download] Starting download from preview URL');

        try {
            // ✅ FIX: Fetch blob from existing preview URL
            fetch(previewUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.blob();
                })
                .then(blob => {
                    console.log('[Download] Blob fetched:', {
                        size: blob.size,
                        type: blob.type
                    });

                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `tms-session-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    a.click();

                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        console.log('[Download] Cleanup complete');
                    }, 100);

                    // Discard after successful download
                    discardRecording();
                })
                .catch(error => {
                    console.error('[Download] Failed to fetch blob from preview URL:', error);
                });
        } catch (error) {
            console.error('[Download] Failed to initiate download:', error);
        }
    }, [previewUrl, previewMeta, discardRecording]);

    const stopRecording = useCallback(() => {
        const recorder = mediaRecorderRef.current;
        if (!recorder || recorder.state === 'inactive') {
            console.warn('[Recording] Cannot stop - recorder not active');
            return;
        }

        console.log('[Recording] Stopping recording...');

        recorder.onstop = () => {
            try {
                console.log('[Recording] onstop triggered, chunks:', chunksRef.current.length);

                if (chunksRef.current.length === 0) {
                    console.error('[Recording] No data chunks recorded!');
                    return;
                }

                const blob = new Blob(chunksRef.current, { type: getSupportedMimeType() });
                const duration = Date.now() - startTimeRef.current;

                console.log('[Recording] Stopped successfully:', {
                    size: blob.size,
                    duration: duration,
                    chunks: chunksRef.current.length,
                    blobType: blob.type
                });

                if (blob.size === 0) {
                    console.error('[Recording] Blob is empty!');
                    return;
                }

                const url = URL.createObjectURL(blob);
                setPreviewUrl(url);
                setPreviewMeta({ size: blob.size, duration });

                console.log('[Recording] Preview URL created:', url);
            } catch (error) {
                console.error('[Recording] Failed to create preview:', error);
            }
        };

        recorder.stop();
        setIsRecording(false);

        // Cleanup recording stream
        if (recordingStreamRef.current) {
            recordingStreamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('[Recording] Stopped track:', track.kind, track.label);
            });
            recordingStreamRef.current = null;
        }
    }, []);

    const startRecording = useCallback(async (sourceStream?: MediaStream) => {
        const mimeType = getSupportedMimeType();
        if (!mimeType) {
            console.error('[Recording] No supported MIME type');
            return;
        }

        discardRecording();
        chunksRef.current = [];
        startTimeRef.current = Date.now();

        // ✅ If sourceStream is provided, use it for video but keep using the original stream for audio.
        const useScreenCapture = !sourceStream;
        console.log(useScreenCapture ? '[Recording] Requesting screen capture...' : '[Recording] Using provided source stream');

        // Logic: if sourceStream is provided (canvas), it might not have audio.
        // We pass the provided stream as first arg to createRecordingStream (which it uses as primary video/audio source).
        // BUT createRecordingStream also takes the "userMediaStream" (the mic).
        // Wait, current useSessionRecorder uses 'stream' as the source for createRecordingStream.

        const recordingStream = await createRecordingStream(
            stream, // microphone source
            useScreenCapture
        );

        if (!recordingStream) {
            console.error('[Recording] Failed to create recording stream');
            return;
        }

        if (sourceStream) {
            // If we have a custom video source (canvas), replace the video tracks in recordingStream
            const canvasVideoTrack = sourceStream.getVideoTracks()[0];
            if (canvasVideoTrack) {
                const currentVideoTracks = recordingStream.getVideoTracks();
                currentVideoTracks.forEach(t => recordingStream.removeTrack(t));
                recordingStream.addTrack(canvasVideoTrack);
                console.log('[Recording] Replaced video source with provided stream (canvas)');
            }
        }

        // ✅ Validate stream has video track
        const videoTracks = recordingStream.getVideoTracks();
        const audioTracks = recordingStream.getAudioTracks();

        if (videoTracks.length === 0) {
            console.error('[Recording] No video tracks in recording stream!');
            if (audioTracks.length === 0) {
                console.error('[Recording] No tracks at all! Cannot record.');
                return;
            }
        }

        recordingStreamRef.current = recordingStream;

        console.log('[Recording] Starting with config:', {
            mimeType,
            quality,
            bitrate: BITRATES[quality],
            videoTracks: videoTracks.length,
            audioTracks: audioTracks.length,
            videoTrackSettings: videoTracks[0]?.getSettings(),
            audioTrackSettings: audioTracks[0]?.getSettings()
        });

        try {
            const recorder = new MediaRecorder(recordingStream, {
                mimeType,
                videoBitsPerSecond: BITRATES[quality]
            });

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                    console.log('[Recording] Data chunk received:',
                        e.data.size, 'bytes',
                        '| Total chunks:', chunksRef.current.length,
                        '| Total size:', chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0), 'bytes'
                    );
                } else {
                    console.warn('[Recording] Empty data chunk received');
                }
            };

            recorder.onerror = (e) => {
                console.error('[Recording] MediaRecorder error:', e);
            };

            recorder.onstart = () => {
                console.log('[Recording] MediaRecorder started, state:', recorder.state);
            };

            recorder.start(1000); // Collect data every 1s
            mediaRecorderRef.current = recorder;
            setIsRecording(true);

            console.log('[Recording] Started successfully, initial state:', recorder.state);
        } catch (error) {
            console.error('[Recording] Failed to start MediaRecorder:', error);
        }
    }, [stream, quality, discardRecording]);

    useEffect(() => {
        return () => {
            discardRecording();
            if (recordingStreamRef.current) {
                recordingStreamRef.current.getTracks().forEach(track => track.stop());
                recordingStreamRef.current = null;
            }
        };
    }, [discardRecording]);

    const { duration, warning } = useRecordingTimer(isRecording, stopRecording);
    useBeforeUnload(isRecording);

    const recommendedQuality: RecordingQuality = (() => {
        try {
            const videoTracks = stream?.getVideoTracks() || [];
            const audioTracks = stream?.getAudioTracks() || [];

            const activeVideoTrack = videoTracks.find(t => t.enabled);

            if (!activeVideoTrack && audioTracks.length > 0) {
                return 'low';
            }

            if (!activeVideoTrack) return 'low';

            const settings = activeVideoTrack.getSettings() || {};
            const width = settings.width ?? 0;
            const height = settings.height ?? 0;

            if (width >= 1280 || height >= 720) return 'high';
            if (width >= 640 || height >= 480) return 'balanced';
            return 'low';
        } catch (error) {
            console.warn('[Recording] Failed to get video settings for recommendation', error);
            return 'balanced';
        }
    })();

    return {
        isRecording,
        duration,
        warning,
        quality,
        setQuality,
        recommendedQuality,
        startRecording,
        stopRecording,
        previewUrl,
        previewMeta,
        confirmDownload,
        discardRecording,
        isSupported: !!getSupportedMimeType(),
    };
};
