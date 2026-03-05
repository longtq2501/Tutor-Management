'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Monitor, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react';

interface ScreenShareViewerProps {
    stream: MediaStream | null;
    isTutor: boolean;
    isScreenSharing?: boolean;
    screenShareAudioHint?: 'mac' | 'no-audio' | null;
}

export const ScreenShareViewer: React.FC<ScreenShareViewerProps> = ({
    stream,
    isTutor,
    isScreenSharing = false,
    screenShareAudioHint = null,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null); // scrollable container
    const innerRef = useRef<HTMLDivElement>(null); // scaled inner div

    const [scale, setScale] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const MIN_SCALE = 1;
    const MAX_SCALE = 5;

    // ---- Pinch state (refs so event handlers don't recreate) ----
    const lastDistRef = useRef<number | null>(null);
    const lastScaleRef = useRef(1); // mirrors scale state for use inside event handlers
    useEffect(() => { lastScaleRef.current = scale; }, [scale]);

    // ---- Bind stream ----
    useEffect(() => {
        const v = videoRef.current;
        if (!v || !stream) return;
        if (v.srcObject !== stream) v.srcObject = stream;
        v.play().catch(e => { if (e.name !== 'AbortError') console.warn('[ScreenShare] play failed', e); });
    }, [stream]);

    // ---- Pinch-to-zoom ----
    // Fix: use ratio of consecutive distances, not raw delta pixels
    // This makes zoom speed consistent regardless of finger spread distance
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;

        const getDist = (touches: TouchList) => {
            const dx = touches[0].clientX - touches[1].clientX;
            const dy = touches[0].clientY - touches[1].clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                lastDistRef.current = getDist(e.touches);
            }
        };

        const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 2) return;
            e.preventDefault();

            const newDist = getDist(e.touches);
            if (lastDistRef.current === null) {
                lastDistRef.current = newDist;
                return;
            }

            // Use RATIO instead of delta — consistent sensitivity at all zoom levels
            const ratio = newDist / lastDistRef.current;
            lastDistRef.current = newDist;

            setScale(prev => {
                const next = prev * ratio;
                return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
            });
        };

        const onTouchEnd = () => { lastDistRef.current = null; };

        el.addEventListener('touchstart', onTouchStart, { passive: true });
        el.addEventListener('touchmove', onTouchMove, { passive: false });
        el.addEventListener('touchend', onTouchEnd);
        return () => {
            el.removeEventListener('touchstart', onTouchStart);
            el.removeEventListener('touchmove', onTouchMove);
            el.removeEventListener('touchend', onTouchEnd);
        };
    }, []);

    // ---- Fullscreen ----
    const toggleFullscreen = useCallback(() => {
        const el = wrapperRef.current?.closest('.screen-share-root') as HTMLElement | null;
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen().catch(console.warn);
        } else {
            document.exitFullscreen();
        }
    }, []);

    useEffect(() => {
        const h = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', h);
        return () => document.removeEventListener('fullscreenchange', h);
    }, []);

    const zoomIn = () => setScale(p => Math.min(MAX_SCALE, parseFloat((p + 0.25).toFixed(2))));
    const zoomOut = () => setScale(p => Math.max(MIN_SCALE, parseFloat((p - 0.25).toFixed(2))));
    const resetZoom = () => setScale(1);

    return (
        <div className="screen-share-root absolute inset-0 flex flex-col bg-slate-900 overflow-hidden">

            {/* ---- Warnings (Tutor only) ---- */}
            {isTutor && isScreenSharing && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30
                                px-3 py-1.5 bg-amber-500/90 backdrop-blur-md rounded-lg
                                border border-amber-600 pointer-events-none
                                animate-in fade-in duration-300 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
                    <span className="text-white text-[10px] font-bold uppercase tracking-tight whitespace-nowrap">
                        Đang chia sẻ màn hình (Mirroring)
                    </span>
                </div>
            )}

            {isTutor && screenShareAudioHint && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 w-[88%] max-w-sm
                                px-3 py-2 bg-slate-800/95 backdrop-blur-md rounded-xl
                                border border-white/10 animate-in fade-in duration-300">
                    <p className="text-white/90 text-[11px] font-semibold mb-0.5">
                        {screenShareAudioHint === 'mac' ? '🔇 macOS: Không capture được âm thanh' : '🔇 Không có âm thanh'}
                    </p>
                    <p className="text-white/50 text-[10px] leading-relaxed">
                        {screenShareAudioHint === 'mac'
                            ? 'Chọn "Tab Chrome" thay vì "Entire Screen" để học sinh nghe được tiếng.'
                            : 'Dừng chia sẻ, chọn lại và tick "Share audio" trong hộp thoại.'}
                    </p>
                </div>
            )}

            {/* ---- Scrollable + zoomable area ---- */}
            {/* overflow-auto + scaled inner → pinch-pan works via native scroll */}
            <div
                ref={wrapperRef}
                style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch' as never }}
            >
                <div
                    ref={innerRef}
                    style={{
                        // Scale from top-left so scrolling to pan works naturally
                        transformOrigin: 'top left',
                        transform: `scale(${scale})`,
                        // Expand scrollable area proportionally so pan is possible
                        width: `${scale * 100}%`,
                        height: `${scale * 100}%`,
                        minWidth: '100%',
                        minHeight: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        // Smooth snap-back to 1x only, not during active pinch
                        transition: scale === 1 ? 'transform 0.25s ease' : 'none',
                    }}
                >
                    {stream ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted={isTutor}
                            style={{
                                display: 'block',
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                background: '#0f172a',
                            }}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-3 text-white/30 p-8">
                            <Monitor className="w-10 h-10" />
                            <span className="text-xs text-center">
                                {isTutor ? 'Đang khởi động chia sẻ màn hình...' : 'Đang chờ màn hình từ giáo viên...'}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* ---- Bottom controls bar ---- */}
            <div className="flex items-center justify-between px-3 py-2
                            bg-black/70 backdrop-blur-md border-t border-white/5 shrink-0">
                {/* Status */}
                <div className="flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-white/70 text-[10px] font-semibold uppercase tracking-tight">
                        {isTutor ? 'Màn hình của bạn' : 'Màn hình Giáo viên'}
                    </span>
                </div>

                {/* Zoom controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={zoomOut}
                        disabled={scale <= MIN_SCALE}
                        className="w-8 h-8 flex items-center justify-center rounded-lg
                                   bg-white/10 active:bg-white/20 disabled:opacity-30 transition-colors"
                    >
                        <ZoomOut className="w-4 h-4 text-white" />
                    </button>

                    <button
                        onClick={resetZoom}
                        className="px-2 h-8 rounded-lg bg-white/10 active:bg-white/20
                                   text-white text-[10px] font-bold min-w-[42px] text-center transition-colors"
                    >
                        {Math.round(scale * 100)}%
                    </button>

                    <button
                        onClick={zoomIn}
                        disabled={scale >= MAX_SCALE}
                        className="w-8 h-8 flex items-center justify-center rounded-lg
                                   bg-white/10 active:bg-white/20 disabled:opacity-30 transition-colors"
                    >
                        <ZoomIn className="w-4 h-4 text-white" />
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="w-8 h-8 flex items-center justify-center rounded-lg
                                   bg-white/10 active:bg-white/20 transition-colors ml-0.5"
                    >
                        {isFullscreen
                            ? <Minimize2 className="w-4 h-4 text-white" />
                            : <Maximize2 className="w-4 h-4 text-white" />}
                    </button>
                </div>
            </div>

            {/* ---- One-time pinch hint (mobile only) ---- */}
            <PinchHint />
        </div>
    );
};

const PinchHint: React.FC = () => {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        const t = setTimeout(() => setVisible(false), 3500);
        return () => clearTimeout(t);
    }, []);

    if (!visible) return null;
    return (
        <div
            className="absolute bottom-14 left-1/2 -translate-x-1/2 z-40
                       px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md
                       text-white/50 text-[10px] pointer-events-none whitespace-nowrap
                       animate-in fade-in duration-500 md:hidden"
        >
            Chụm/banh 2 ngón để zoom • Kéo để di chuyển
        </div>
    );
};