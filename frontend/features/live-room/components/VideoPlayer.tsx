"use client";

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CameraOff, ShieldOff, MonitorOff } from 'lucide-react';

interface VideoPlayerProps {
    stream: MediaStream | null;
    muted?: boolean;
    className?: string;
    /**
     * Pass the MediaErrorType from useMediaStream to show a contextual error banner.
     * Only used for the LOCAL video player (self-view).
     */
    mediaError?: string | null;
    /**
     * Label shown when there is no stream and no error.
     * Defaults to "Đang chờ tín hiệu video..."
     */
    emptyLabel?: string;
}

/**
 * Maps a MediaErrorType string to a user-friendly Vietnamese message + icon.
 */
const getErrorInfo = (error: string): { icon: React.ReactNode; title: string; description: string } => {
    switch (error) {
        case 'NotReadableError':
            return {
                icon: <CameraOff className="w-6 h-6 text-amber-400" />,
                title: 'Camera đang bị chiếm',
                description: 'Vui lòng đóng Teams, Zoom, OBS hoặc các ứng dụng khác đang dùng camera, sau đó thử lại.',
            };
        case 'NotAllowedError':
            return {
                icon: <ShieldOff className="w-6 h-6 text-red-400" />,
                title: 'Chưa cấp quyền camera',
                description: 'Vui lòng cho phép trình duyệt truy cập camera và microphone, sau đó tải lại trang.',
            };
        case 'NotFoundError':
            return {
                icon: <MonitorOff className="w-6 h-6 text-slate-400" />,
                title: 'Không tìm thấy camera',
                description: 'Thiết bị này không có camera hoặc camera chưa được kết nối.',
            };
        default:
            return {
                icon: <AlertTriangle className="w-6 h-6 text-red-400" />,
                title: 'Không thể mở camera',
                description: 'Đã xảy ra lỗi khi truy cập camera. Vui lòng thử tải lại trang.',
            };
    }
};

/**
 * Component to display a MediaStream in a video element.
 * Handles autoPlay, playsInline, safe cleanup, and media error states.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    stream,
    muted = false,
    className = '',
    mediaError = null,
    emptyLabel = 'Đang chờ tín hiệu video...',
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement || !stream) return;

        const updateSrc = () => {
            if (videoElement.srcObject !== stream) {
                videoElement.srcObject = stream;
            }
            // Bug 4 Fix: Force play after stream assignment (important for replaceTrack)
            videoElement.play().catch(err => {
                if (err.name !== 'AbortError') {
                    console.warn('[VideoPlayer] Playback failed:', err);
                }
            });
        };

        updateSrc();

        stream.addEventListener('addtrack', updateSrc);
        stream.addEventListener('removetrack', updateSrc);

        return () => {
            stream.removeEventListener('addtrack', updateSrc);
            stream.removeEventListener('removetrack', updateSrc);
        };
    }, [stream]);

    // ---- Render: Media Error State ----
    if (mediaError) {
        const { icon, title, description } = getErrorInfo(mediaError);
        return (
            <div className={`relative overflow-hidden ${className}`}>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-4 text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                        {icon}
                    </div>
                    <div>
                        <p className="text-white/80 text-xs font-semibold">{title}</p>
                        <p className="text-white/40 text-[10px] mt-1 leading-relaxed max-w-[200px]">
                            {description}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ---- Render: No Stream (waiting for remote) ----
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
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800 gap-2">
                    <CameraOff className="w-5 h-5 text-white/20" />
                    <span className="text-white/40 text-xs">{emptyLabel}</span>
                </div>
            )}
        </div>
    );
};