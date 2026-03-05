'use client';

import React from 'react';
import { Whiteboard } from './Whiteboard';
import { MediaControls } from './MediaControls';
import { VideoPlayer } from './VideoPlayer';
import { ChatPanel } from './ChatPanel';
import { RoomTab } from './MobileNavigation';
import { cn } from '@/lib/utils';

import { useSwipeable } from 'react-swipeable';
import { AnimatePresence, motion } from 'framer-motion';
import { useIsMobile } from '../hooks/useIsMobile';
import { useRoomState } from '../context/RoomStateContext';
import { Monitor, Layout, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScreenShareViewer } from './ScreenShareViewer';

interface RoomMainContentProps {
    roomId: string;
    currentUserId: number;
    activeTab: RoomTab;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    media: any;
    sendMessage: (destination: string, body: unknown) => void;
    onTabChange: (tab: RoomTab) => void;
}

/**
 * Maps a MediaErrorType to a short Vietnamese description.
 */
const getMediaErrorText = (error: string): string => {
    switch (error) {
        case 'NotReadableError':
            return 'Camera đang bị chiếm bởi ứng dụng khác (Teams, Zoom, OBS...). Đóng các ứng dụng đó rồi thử lại.';
        case 'NotAllowedError':
            return 'Trình duyệt chưa được cấp quyền camera. Vui lòng cho phép truy cập camera.';
        case 'NotFoundError':
            return 'Không tìm thấy camera trên thiết bị này.';
        default:
            return 'Không thể truy cập camera. Vui lòng tải lại trang.';
    }
};

/**
 * Main content area for the Live Room.
 */
export const RoomMainContent: React.FC<RoomMainContentProps> = ({
    roomId,
    currentUserId,
    activeTab,
    media,
    sendMessage,
    onTabChange
}) => {
    const tabs: RoomTab[] = ['board', 'video', 'chat'];
    const isMobile = useIsMobile();
    const { state, actions } = useRoomState();
    const isTutor = state.participants.find(p => Number(p.id) === currentUserId)?.role === 'TUTOR';

    const handlers = useSwipeable({
        onSwipedLeft: () => {
            const currentIndex = tabs.indexOf(activeTab);
            if (currentIndex < tabs.length - 1) onTabChange(tabs[currentIndex + 1]);
        },
        onSwipedRight: () => {
            const currentIndex = tabs.indexOf(activeTab);
            if (currentIndex > 0) onTabChange(tabs[currentIndex - 1]);
        },
        preventScrollOnSwipe: true,
        trackMouse: false,
        delta: 50,
    });

    const whiteboardCanvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isTransitioning, setIsTransitioning] = React.useState(false);
    const transitionTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Handle Screen Share Trigger
    React.useEffect(() => {
        if (state.contentMode === 'screen' && isTutor && !media.isScreenSharing) {
            media.startScreenShare().then((stream: MediaStream | null) => {
                if (!stream) {
                    actions.setContentMode('whiteboard');
                }
            });
        } else if (state.contentMode === 'whiteboard' && media.isScreenSharing) {
            media.stopScreenShare();
        }
    }, [state.contentMode, isTutor, media, actions]);

    React.useEffect(() => {
        if (!isMobile) return;
        if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
        setIsTransitioning(true);
        transitionTimerRef.current = setTimeout(() => setIsTransitioning(false), 200);
        return () => { if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current); };
    }, [activeTab, isMobile]);

    const handleToggleRecording = async () => {
        if (media.isRecording) {
            media.stopRecording();
        } else {
            let sourceStream: MediaStream | undefined = undefined;
            if (state.contentMode === 'screen' && media.screenStream) {
                sourceStream = media.screenStream;
            } else if (state.contentMode === 'whiteboard' && whiteboardCanvasRef.current) {
                sourceStream = whiteboardCanvasRef.current.captureStream(10);
            }
            await media.startRecording(sourceStream);
        }
    };

    // ---- Camera error banner: shown to BOTH sides ----
    // Tutor sees their own error directly.
    // Student sees a generic "giáo viên gặp sự cố" when connected but remoteStream is null.
    const showTutorCameraError = isTutor && !!media.error;
    const showRemoteCameraWarning =
        !isTutor &&
        state.connectionState === 'CONNECTED' &&
        !state.remoteStream;

    return (
        <main
            {...handlers}
            className="flex-1 relative overflow-hidden bg-muted/30 flex flex-col md:flex-row touch-pan-y"
        >
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center z-50 md:hidden"
                    >
                        <div className="h-1 w-24 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 0.2 }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ---- Board Section ---- */}
            <div className={cn(
                "flex-1 relative flex flex-col min-h-0 min-w-0 transition-all duration-300 ease-in-out",
                activeTab !== 'board' && "hidden md:flex",
                activeTab === 'board' && "md:border-t-2 md:border-t-primary"
            )}>
                {/* Content Mode Toggle (Tutor Only) */}
                {isTutor && (
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
                        <div className="flex items-center gap-2">
                            <Button
                                variant={state.contentMode === 'whiteboard' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => actions.setContentMode('whiteboard')}
                                className="h-8 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            >
                                <Layout className="w-3 h-3 mr-1.5" />
                                Bảng trắng
                            </Button>
                            <Button
                                variant={state.contentMode === 'screen' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => actions.setContentMode('screen')}
                                className="h-8 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            >
                                <Monitor className="w-3 h-3 mr-1.5" />
                                Chia sẻ màn hình
                            </Button>
                        </div>
                    </div>
                )}

                <div className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
                    {state.contentMode === 'whiteboard' ? (
                        <Whiteboard
                            ref={isTutor ? whiteboardCanvasRef : null}
                            roomId={roomId}
                            currentUserId={currentUserId}
                            sendMessage={sendMessage}
                            isReadOnly={!isTutor}
                            className="h-full border-none rounded-none"
                        />
                    ) : (
                        <ScreenShareViewer
                            stream={isTutor ? media.screenStream : state.remoteStream}
                            isTutor={isTutor}
                            isScreenSharing={media.isScreenSharing}
                            screenShareAudioHint={isTutor ? media.screenShareAudioHint : null}
                        />
                    )}
                </div>

                <MediaControls
                    {...media}
                    onToggleMic={media.toggleMic}
                    onToggleCamera={media.toggleCamera}
                    onToggleRecording={handleToggleRecording}
                    onQualityChange={media.setQuality}
                    isRecordingSupported={media.isSupported && isTutor}
                    className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 scale-90 md:scale-100 origin-bottom"
                />
            </div>

            {/* ---- Video Side Area ---- */}
            <div className={cn(
                "w-full md:w-80 p-3 flex-col gap-3 bg-background md:bg-card border-t md:border-t-0 md:border-l border-border",
                activeTab === 'video' ? "flex flex-1 min-h-0" : "hidden md:flex min-h-0",
                activeTab === 'video' && "md:border-t-2 md:border-t-primary"
            )}>
                <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">

                    {/* ✅ Banner: Tutor thấy lỗi camera của chính mình */}
                    {showTutorCameraError && (
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                                    Camera không hoạt động
                                </p>
                                <p className="text-amber-600/70 dark:text-amber-400/70 text-[10px] mt-0.5 leading-relaxed">
                                    {getMediaErrorText(media.error)}
                                </p>
                                {/* Retry button */}
                                <button
                                    onClick={() => media.retry()}
                                    className="mt-1.5 flex items-center gap-1 text-[10px] text-amber-500 hover:text-amber-400 font-semibold transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Thử lại
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ✅ Banner: Student thấy cảnh báo khi Tutor không có camera */}
                    {showRemoteCameraWarning && (
                        <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-slate-500/10 border border-slate-500/20 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-slate-400 text-[10px] leading-relaxed">
                                Camera của giáo viên hiện không khả dụng.
                            </p>
                        </div>
                    )}

                    {/* Camera BAN (local) */}
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                            {state.contentMode === 'screen' ? 'Camera (Bạn)' : 'Bạn (Local)'}
                        </span>
                        <VideoPlayer
                            stream={media.stream}
                            muted
                            // ✅ Truyền mediaError để VideoPlayer hiện UI lỗi thay vì màn đen
                            mediaError={media.error}
                            className="aspect-video w-full rounded-xl border border-border bg-slate-900 shadow-lg"
                        />
                    </div>

                    {/* Camera ĐỐI PHƯƠNG (remote) */}
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                            {state.contentMode === 'screen' ? 'Camera (Đối phương)' : 'Đối phương (Remote)'}
                        </span>
                        <VideoPlayer
                            stream={state.remoteStream}
                            // ✅ Label thông minh: sau khi connected mà vẫn không có stream
                            //    → khả năng cao đối phương không có camera
                            emptyLabel={
                                state.connectionState === 'CONNECTED'
                                    ? 'Đối phương không có camera'
                                    : 'Đang chờ tín hiệu video...'
                            }
                            className="aspect-video w-full rounded-xl border border-border bg-slate-900 shadow-lg"
                        />
                    </div>

                    {/* Chat */}
                    <div className="mt-2 flex-1 flex flex-col min-h-0 border-t border-border pt-3 overflow-hidden">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-2">
                            Trò chuyện
                        </span>
                        <div className="flex-1 min-h-0 h-full">
                            <ChatPanel roomId={roomId} currentUserId={currentUserId} />
                        </div>
                    </div>
                </div>

                {media.warning && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] rounded-lg animate-in fade-in slide-in-from-top-2">
                        {media.warning}
                    </div>
                )}
            </div>
        </main>
    );
};