'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Monitor, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ScreenShareViewerProps {
    stream: MediaStream | null;
    isTutor: boolean;
    isScreenSharing?: boolean;
    /** Hint from useMediaStream about audio availability */
    screenShareAudioHint?: 'mac' | 'no-audio' | null;
}

/**
 * Mobile-optimized screen share viewer.
 *
 * Features:
 * - Pinch-to-zoom (touch) + scroll pan on mobile
 * - Zoom in/out buttons
 * - Reset zoom button
 * - Video fills available space, maintaining aspect ratio (object-contain)
 * - Scrollable container so landscape rotation works correctly
 * - "Mirroring" warning for Tutor
 */
export const ScreenShareViewer: React.FC<ScreenShareViewerProps> = ({
    stream,
    isTutor,
    isScreenSharing = false,
    screenShareAudioHint = null,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [scale, setScale] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Pinch-to-zoom state
    const lastDistRef = useRef<number | null>(null);
    const MIN_SCALE = 1;
    const MAX_SCALE = 4;

    // ---- Bind stream to video ----
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !stream) return;
        if (video.srcObject !== stream) {
            video.srcObject = stream;
        }
        video.play().catch(err => {
            if (err.name !== 'AbortError') console.warn('[ScreenShare] Play failed:', err);
        });
    }, [stream]);

    // ---- Pinch-to-zoom (touch events) ----
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 2) return;
            e.preventDefault(); // prevent page scroll during pinch

            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (lastDistRef.current !== null) {
                const delta = dist - lastDistRef.current;
                setScale(prev => Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev + delta * 0.01)));
            }
            lastDistRef.current = dist;
        };

        const onTouchEnd = () => { lastDistRef.current = null; };

        el.addEventListener('touchmove', onTouchMove, { passive: false });
        el.addEventListener('touchend', onTouchEnd);
        return () => {
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('touchend', onTouchEnd);
        };
    }, []);

    // ---- Fullscreen ----
    const toggleFullscreen = () => {
        const el = containerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen().catch(console.warn);
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const zoomIn = () => setScale(prev => Math.min(MAX_SCALE, prev + 0.25));
    const zoomOut = () => setScale(prev => Math.max(MIN_SCALE, prev - 0.25));
    const resetZoom = () => setScale(1);

    return (
        <div className="absolute inset-0 flex flex-col bg-slate-900">

            {/* ---- Tutor: Mirroring warning ---- */}
            {isTutor && isScreenSharing && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-4 py-2
                                bg-amber-500/90 backdrop-blur-md rounded-lg shadow-lg
                                border border-amber-600 animate-in fade-in zoom-in duration-300
                                pointer-events-none">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span className="text-white text-[11px] font-bold uppercase tracking-tight whitespace-nowrap">
                            Cảnh báo: Đang chia sẻ màn hình hiện tại (Mirroring)
                        </span>
                    </div>
                </div>
            )}

            {/* ---- Audio hint banner (macOS / no audio) — Tutor only ---- */}
            {isTutor && screenShareAudioHint && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 w-[90%] max-w-sm
                                px-3 py-2.5 bg-slate-800/95 backdrop-blur-md rounded-xl shadow-lg
                                border border-white/10 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-white/90 text-[11px] font-semibold mb-1">
                        {screenShareAudioHint === 'mac'
                            ? '🔇 macOS: Không thể capture âm thanh hệ thống'
                            : '🔇 Không có âm thanh trong màn hình chia sẻ'}
                    </p>
                    <p className="text-white/50 text-[10px] leading-relaxed">
                        {screenShareAudioHint === 'mac'
                            ? 'Để học sinh nghe được tiếng video/nhạc, hãy chọn chia sẻ một Tab Chrome cụ thể thay vì "Entire Screen" — Chrome tự động capture audio của tab đó.'
                            : 'Học sinh sẽ không nghe được âm thanh từ màn hình. Dừng chia sẻ và chọn lại, đánh dấu "Share audio" trong hộp thoại.'}
                    </p>
                </div>
            )}

            {/* ---- Scrollable + zoomable video area ---- */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto"
                style={{
                    // Enable momentum scrolling on iOS
                    WebkitOverflowScrolling: 'touch',
                }}
            >
                {/* Inner wrapper scales with zoom; min-size ensures scroll bars appear */}
                <div
                    style={{
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                        // When zoomed, expand the scrollable area so panning works
                        width: scale > 1 ? `${scale * 100}%` : '100%',
                        height: scale > 1 ? `${scale * 100}%` : '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100%',
                        transition: scale === 1 ? 'transform 0.2s ease' : 'none',
                    }}
                >
                    {stream ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted={isTutor}
                            style={{
                                // object-contain so the full screen content is always visible
                                objectFit: 'contain',
                                width: '100%',
                                height: '100%',
                                maxHeight: scale === 1 ? '100vh' : 'none',
                                display: 'block',
                                background: '#0f172a',
                            }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 text-white/30 p-8">
                            <Monitor className="w-12 h-12" />
                            <span className="text-sm">
                                {isTutor ? 'Đang khởi động chia sẻ màn hình...' : 'Đang chờ màn hình từ giáo viên...'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ---- Zoom controls + status bar ---- */}
            <div className="flex items-center justify-between px-4 py-2
                            bg-black/60 backdrop-blur-md border-t border-white/5">

                {/* Left: status */}
                <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-primary" />
                    <span className="text-white text-[10px] font-bold uppercase tracking-tight">
                        {isTutor ? 'Màn hình của bạn' : 'Màn hình Giáo viên'}
                    </span>
                </div>

                {/* Right: zoom controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={zoomOut}
                        disabled={scale <= MIN_SCALE}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30
                                   active:scale-95 transition-all"
                    >
                        <ZoomOut className="w-4 h-4 text-white" />
                    </button>

                    <button
                        onClick={resetZoom}
                        className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20
                                   text-white text-[10px] font-bold min-w-[40px] text-center
                                   active:scale-95 transition-all"
                    >
                        {Math.round(scale * 100)}%
                    </button>

                    <button
                        onClick={zoomIn}
                        disabled={scale >= MAX_SCALE}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30
                                   active:scale-95 transition-all"
                    >
                        <ZoomIn className="w-4 h-4 text-white" />
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20
                                   active:scale-95 transition-all ml-1"
                        title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
                    >
                        <Maximize2 className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>

            {/* ---- Mobile hint: pinch to zoom (shown briefly) ---- */}
            <PinchHint />
        </div>
    );
};

/**
 * Small toast hint shown once to tell mobile users about pinch-to-zoom.
 */
const PinchHint: React.FC = () => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const t = setTimeout(() => setVisible(false), 3000);
        return () => clearTimeout(t);
    }, []);

    if (!visible) return null;

    return (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40
                        px-3 py-1.5 bg-black/70 backdrop-blur-md rounded-full
                        text-white/60 text-[10px] pointer-events-none
                        animate-in fade-in duration-300 md:hidden">
            Chụm/banh 2 ngón để zoom · Kéo để di chuyển
        </div>
    );
};