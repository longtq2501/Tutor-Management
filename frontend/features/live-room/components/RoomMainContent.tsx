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
import { Monitor, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RoomMainContentProps {
    roomId: string;
    currentUserId: number;
    activeTab: RoomTab;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    media: any; // Using any for large combined hook result
    sendMessage: (destination: string, body: unknown) => void;
    onTabChange: (tab: RoomTab) => void;
}

/**
 * Main content area for the Live Room.
 * Handles the layout of Whiteboard, Video, and Chat based on the active tab and screen size.
 * Includes swipe gestures for mobile tab switching.
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
            if (currentIndex < tabs.length - 1) {
                onTabChange(tabs[currentIndex + 1]);
            }
        },
        onSwipedRight: () => {
            const currentIndex = tabs.indexOf(activeTab);
            if (currentIndex > 0) {
                onTabChange(tabs[currentIndex - 1]);
            }
        },
        preventScrollOnSwipe: true,
        trackMouse: false,
        delta: 50,
    });

    const [isTransitioning, setIsTransitioning] = React.useState(false);
    const transitionTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Handle Screen Share Trigger
    React.useEffect(() => {
        if (state.contentMode === 'screen' && isTutor && !media.isScreenSharing) {
            media.startScreenShare().then((stream: any) => {
                if (!stream) {
                    // Fallback to whiteboard if screen share fails or is cancelled
                    actions.setContentMode('whiteboard');
                }
            });
        } else if (state.contentMode === 'whiteboard' && media.isScreenSharing) {
            media.stopScreenShare();
        }
    }, [state.contentMode, isTutor, media, actions]);

    React.useEffect(() => {
        if (!isMobile) return; // Skip transition on desktop

        if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current);
        }

        setIsTransitioning(true);
        transitionTimerRef.current = setTimeout(() => setIsTransitioning(false), 200);

        return () => {
            if (transitionTimerRef.current) {
                clearTimeout(transitionTimerRef.current);
            }
        };
    }, [activeTab, isMobile]);

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

            {/* Board Section */}
            <div className={cn(
                "flex-1 relative flex flex-col min-h-0",
                activeTab !== 'board' && "hidden md:flex",
                activeTab === 'board' && "md:border-t-2 md:border-t-primary"
            )}>
                {/* Header for Content Mode Toggle (Tutor Only) */}
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
                            roomId={roomId}
                            currentUserId={currentUserId}
                            sendMessage={sendMessage}
                            className="h-full border-none rounded-none"
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900 overflow-hidden">
                            <VideoPlayer
                                stream={isTutor ? media.screenStream : state.remoteStream}
                                className="w-full h-full max-w-5xl mx-auto rounded-xl shadow-2xl overflow-hidden border border-white/5"
                            />
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center gap-2 whitespace-nowrap">
                                <Monitor className="w-4 h-4 text-primary" />
                                <span className="text-white text-[10px] font-bold uppercase tracking-tight">Đang xem: Màn hình của {isTutor ? 'bạn' : 'Giáo viên'}</span>
                            </div>
                        </div>
                    )}
                </div>

                <MediaControls
                    {...media}
                    onToggleMic={media.toggleMic}
                    onToggleCamera={media.toggleCamera}
                    onToggleRecording={media.isRecording ? media.stopRecording : media.startRecording}
                    onQualityChange={media.setQuality}
                    isRecordingSupported={media.isSupported}
                    className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 scale-90 md:scale-100 origin-bottom"
                />
            </div>

            {/* Video Side Area */}
            <div className={cn(
                "w-full md:w-80 p-3 flex-col gap-3 bg-background md:bg-card border-l border-border",
                activeTab === 'video' ? "flex flex-1 min-h-0" : "hidden md:flex min-h-0",
                activeTab === 'video' && "md:border-t-2 md:border-t-primary"
            )}>
                <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                            {state.contentMode === 'screen' ? 'Camera (Bạn)' : 'Bạn (Local)'}
                        </span>
                        <VideoPlayer
                            stream={media.stream}
                            muted
                            className="aspect-video w-full rounded-xl border border-border bg-slate-900 shadow-lg"
                        />
                    </div>

                    <div className="space-y-1">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground ml-1">
                            {state.contentMode === 'screen' ? 'Camera (Đối phương)' : 'Đối phương (Remote)'}
                        </span>
                        <VideoPlayer
                            stream={state.remoteStream}
                            className="aspect-video w-full rounded-xl border border-border bg-slate-900 shadow-lg"
                        />
                    </div>

                    {/* Chat Section integrated into sidebar */}
                    <div className="mt-2 flex-1 flex flex-col min-h-0 border-t border-border pt-3 overflow-hidden">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground ml-1 mb-2">Trò chuyện</span>
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
