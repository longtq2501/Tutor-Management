import React, { useState } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Clock, User, GraduationCap, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OnlineSessionResponse } from '@/lib/types/onlineSession';
import { useCountdown } from '../hooks/useCountdown';
import { RecordingPromptDialog } from './RecordingPromptDialog';
import { isMediaRecorderSupported } from '@/lib/utils/browserCompat';
import { useRouter } from 'next/navigation';

interface SessionCardProps {
    session: OnlineSessionResponse;
    onJoin: (roomId: string) => void;
    currentUserId: number;
    onRefetch?: () => void;
}

/**
 * Premium session card component for Live Teaching Lobby.
 * Displays session info, countdown timer, and role-based action button.
 * 
 * @param {SessionCardProps} props - Component props
 */
export const SessionCard: React.FC<SessionCardProps> = ({
    session,
    onJoin,
    currentUserId, 
    onRefetch
}) => {
    const isTutor = currentUserId === session.tutorId;
    const { formatted, isReady } = useCountdown(
    session.scheduledStart,
    15,
    onRefetch 
);
    const router = useRouter();
    const [showRecordingPrompt, setShowRecordingPrompt] = useState(false);
    const canRecord = isMediaRecorderSupported();

    const handleJoinClick = () => {
        // Show recording prompt for tutors only if browser supports recording
        if (isTutor && canRecord) {
            setShowRecordingPrompt(true);
        } else {
            // Students or unsupported browsers join directly
            onJoin(session.roomId);
        }
    };

    const handleRecordingConfirm = () => {
        setShowRecordingPrompt(false);
        router.push(`/live-teaching/${session.roomId}?record=true`);
    };

    const handleRecordingDecline = () => {
        setShowRecordingPrompt(false);
        router.push(`/live-teaching/${session.roomId}?record=false`);
    };

    return (
        <>
            <div className="group relative bg-gradient-to-br from-background to-muted/20 border-2 border-border/60 rounded-3xl p-6 shadow-lg hover:shadow-2xl hover:border-primary/40 transition-all duration-300">
                <SessionCardHeader session={session} isTutor={isTutor} />
                <SessionCardCountdown formatted={formatted} scheduledStart={session.scheduledStart} />
                <SessionCardActions
                    isReady={isReady}
                    canJoinNow={session.canJoinNow}
                    isTutor={isTutor}
                    roomStatus={session.roomStatus}
                    onJoinClick={handleJoinClick}
                />
            </div>

            <RecordingPromptDialog
                isOpen={showRecordingPrompt}
                onConfirm={handleRecordingConfirm}
                onDecline={handleRecordingDecline}
            />
        </>
    );
};

/**
 * Displays session metadata (participants, scheduled time).
 */
const SessionCardHeader: React.FC<{ session: OnlineSessionResponse; isTutor: boolean }> = ({
    session,
    isTutor
}) => (
    <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
            <Badge variant={session.roomStatus === 'ACTIVE' ? 'default' : 'secondary'} className="rounded-full px-3 py-1 text-xs font-black uppercase">
                {session.roomStatus === 'ACTIVE' ? '🔴 Đang diễn ra' : '⏳ Chờ bắt đầu'}
            </Badge>
        </div>
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span className="font-bold">GV:</span>
                <span className={isTutor ? 'font-black text-primary' : 'font-medium'}>{session.tutorName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-blue-500" />
                <span className="font-bold">HS:</span>
                <span className={!isTutor ? 'font-black text-blue-500' : 'font-medium'}>{session.studentName}</span>
            </div>
        </div>
    </div>
);

/**
 * Displays countdown timer and scheduled time.
 */
const SessionCardCountdown: React.FC<{ formatted: string; scheduledStart: string }> = ({
    formatted,
    scheduledStart
}) => (
    <div className="bg-muted/30 rounded-2xl p-4 mb-4 border border-border/40">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-bold text-muted-foreground uppercase">Bắt đầu</span>
            </div>
            <span className="text-sm font-black">{format(new Date(scheduledStart), 'HH:mm - dd/MM/yyyy', { locale: vi })}</span>
        </div>
        <div className="mt-2 text-center">
            <span className="text-2xl font-black text-primary tabular-nums">{formatted}</span>
        </div>
    </div>
);

/**
 * Renders action button based on role and session state.
 */
const SessionCardActions: React.FC<{
    isReady: boolean;
    canJoinNow: boolean;
    isTutor: boolean;
    roomStatus: string;
    onJoinClick: () => void;
}> = ({ isReady, canJoinNow, isTutor, roomStatus, onJoinClick }) => {
    const effectiveCanJoinNow = roomStatus === 'ACTIVE' || canJoinNow;
    const isDisabled = !effectiveCanJoinNow || roomStatus === 'ENDED';
    const buttonText = isTutor ? 'Bắt đầu dạy' : 'Tham gia học';
    const buttonVariant = effectiveCanJoinNow ? 'default' : 'outline';

    return (
        <Button
            onClick={onJoinClick}
            disabled={isDisabled}
            variant={buttonVariant}
            size="lg"
            className="w-full rounded-xl font-black gap-2 shadow-md hover:shadow-xl transition-all"
        >
            <Video className="w-4 h-4" />
            {buttonText}
        </Button>
    );
};