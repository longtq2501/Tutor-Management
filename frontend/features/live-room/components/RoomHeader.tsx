'use client';

import React from 'react';
import { BillableTimer } from './BillableTimer';
import { ParticipantPresence } from './ParticipantPresence';
import { ModeToggle } from '@/components/shared/ModeToggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, Check, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface RoomHeaderProps {
    roomId: string;
    isConnected: boolean;
    isRecording: boolean;
}

/**
 * Header component for the Live Room display.
 * Displays room ID with tooltip/copy, billable timer, connection status, and recording indicator.
 */
export const RoomHeader: React.FC<RoomHeaderProps> = ({
    roomId,
    isConnected,
    isRecording
}) => {
    const [copied, setCopied] = React.useState(false);
    const router = useRouter();

    const handleCopy = () => {
        navigator.clipboard.writeText(roomId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLeaveRoom = () => {
        router.push('/dashboard?view=live-room');
    };

    return (
        <header className="h-14 border-b border-border flex items-center px-3 md:px-4 justify-between bg-card shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <h2 className="font-semibold truncate text-xs sm:text-sm md:text-base cursor-help flex items-center gap-1.5">
                                <span className="hidden sm:inline">Phòng: </span>
                                <span className="hidden sm:inline">{roomId}</span>
                                <span className="sm:hidden">{roomId.slice(0, 8)}...</span>
                            </h2>
                        </TooltipTrigger>
                        <TooltipContent className="flex flex-col gap-2 p-3">
                            <p className="text-xs font-mono">{roomId}</p>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-1.5 text-[10px] text-primary hover:underline font-medium"
                            >
                                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                {copied ? 'Đã sao chép' : 'Sao chép ID'}
                            </button>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <BillableTimer roomId={roomId} className="hidden md:flex" />

                <div className="hidden md:block">
                    <ParticipantPresence />
                </div>

                {isRecording && (
                    <span className="flex items-center gap-1 text-[10px] md:text-xs text-red-500 font-medium animate-pulse whitespace-nowrap">
                        ● <span className="hidden xs:inline">ĐANG GHI HÌNH</span>
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <span className="hidden md:inline text-xs text-muted-foreground">
                    {isConnected ? '● Đã kết nối' : '○ Đang kết nối...'}
                </span>
                <ModeToggle />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLeaveRoom}
                            className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                            aria-label="Rời phòng học"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rời phòng</TooltipContent>
                </Tooltip>
            </div>
        </header>
    );
};
