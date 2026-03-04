"use client";

import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
    stream: MediaStream | null;
    muted?: boolean;
    className?: string;
}

/**
 * Component to display a MediaStream in a video element.
 * Handles autoPlay, playsInline and safe cleanup.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    stream,
    muted = false,
    className = ''
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || !stream) return;

        const updateSrc = () => {
            if (videoElement.srcObject !== stream) {
                videoElement.srcObject = stream;
            }
            // ✅ BUG 4 FIX (PRO MAX): Force play after stream assignment
            // Ensures playback continues after replaceTrack/track updates
            videoElement.play().catch(err => {
                // Ignore AbortError which is common if stream is replaced rapidly
                if (err.name !== 'AbortError') {
                    console.warn('[VideoPlayer] Playback failed:', err);
                }
            });
        };

        updateSrc();

        // React to track changes within the stream (important for replaceTrack)
        stream.addEventListener('addtrack', updateSrc);
        stream.addEventListener('removetrack', updateSrc);

        return () => {
            stream.removeEventListener('addtrack', updateSrc);
            stream.removeEventListener('removetrack', updateSrc);
        };
    }, [stream]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                className="w-full h-full object-cover bg-slate-900 rounded-xl"
            />
            {!stream && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-800 text-white/40 text-sm">
                    Đang chờ tín hiệu video...
                </div>
            )}
        </div>
    );
};
