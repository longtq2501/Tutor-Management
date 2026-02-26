import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { useMemo } from 'react';
import type { SessionRecord } from '@/lib/types/finance';
import type { CalendarDay } from '../types';
import { DraggableSession } from './DraggableSession';
import { LessonCard } from './LessonCard';

interface WeekViewProps {
    days: CalendarDay[];
    onDayClick: (day: CalendarDay) => void;
    onAddSession: (dateStr: string) => void;
    onSessionClick?: (session: SessionRecord) => void;
    onSessionEdit?: (session: SessionRecord) => void;
    onUpdate?: (updated: SessionRecord) => void;
}

/**
 * WeekView Component
 * 
 * Displays a 7-day grid of sessions.
 */
export function WeekView({ days, onDayClick, onAddSession, onSessionClick, onSessionEdit, onUpdate }: WeekViewProps) {
    // Find current week (the one containing today, or just the first 7 if not found)
    const weekDays = useMemo(() => {
        const todayIdx = days.findIndex(d => d.isToday);
        if (todayIdx === -1) return days.slice(0, 7);

        // Find start of week (Sunday)
        const startOfWeekIdx = todayIdx - days[todayIdx].date.getDay();
        const safeStart = Math.max(0, startOfWeekIdx);
        return days.slice(safeStart, safeStart + 7);
    }, [days]);

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="grid grid-cols-7 border-b border-border bg-muted/20">
                {weekDays.map((day, i) => (
                    <div
                        key={i}
                        className={`
              p-3 text-center border-r last:border-r-0 border-border
              ${day.isToday ? 'bg-primary/5' : ''}
              ${i === 0 ? 'text-rose-500' : 'text-muted-foreground'}
            `}
                    >
                        <div className="text-[10px] uppercase font-bold tracking-widest mb-1">
                            {day.date.toLocaleDateString('vi-VN', { weekday: 'short' })}
                        </div>
                        <div className={`
              inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
              ${day.isToday ? 'bg-primary text-primary-foreground shadow-sm' : 'text-card-foreground'}
            `}>
                            {day.date.getDate()}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 divide-x divide-border bg-background/30 min-h-[400px]">
                {weekDays.map((day, i) => (
                    <WeekDroppableCell
                        key={day.dateStr}
                        day={day}
                        onAddSession={onAddSession}
                        onSessionClick={onSessionClick}
                        onSessionEdit={onSessionEdit}
                        onUpdate={onUpdate}
                    />
                ))}
            </div>
        </div>
    );
}

function WeekDroppableCell({
    day,
    onAddSession,
    onSessionClick,
    onSessionEdit,
    onUpdate
}: {
    day: CalendarDay;
    onAddSession: (dateStr: string) => void;
    onSessionClick?: (session: SessionRecord) => void;
    onSessionEdit?: (session: SessionRecord) => void;
    onUpdate?: (updated: SessionRecord) => void;
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: day.dateStr,
    });

    return (
        <div
            ref={setNodeRef}
            className={`
                p-2 space-y-2 relative group transition-colors duration-200
                ${day.isToday ? 'bg-primary/5' : ''}
                ${isOver ? 'bg-primary/20 ring-2 ring-primary inset-0 z-10' : ''}
            `}
        >
            {/* Add Session Button on Hover */}
            <button
                onClick={() => onAddSession(day.dateStr)}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-primary/10 rounded-full text-primary transition-all z-10"
            >
                <Plus size={14} />
            </button>

            {/* Sessions List */}
            <div className="space-y-1.5 h-full min-h-[100px]">
                {day.sessions.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground/30 italic text-center pt-10">
                        Trống
                    </div>
                ) : (
                    day.sessions.map((session, index) => (
                        <div key={session.id}>
                            {/* We can use DraggableSession wrapper around LessonCard if we want DnD in WeekView too */}
                            {/* For simplicity, let's use DraggableSession here but it might look different */}
                            {/* Actually, I should make LessonCard draggable as well */}
                            <DraggableLessonWrapper session={session}>
                                <LessonCard
                                    session={session}
                                    showNotes={true}
                                    onClick={() => onSessionClick?.(session)}
                                    onUpdate={onUpdate}
                                    onEdit={onSessionEdit}
                                />
                            </DraggableLessonWrapper>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

import { useDraggable } from '@dnd-kit/core';

function DraggableLessonWrapper({ session, children }: { session: SessionRecord; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `session-week-${session.id}`,
        data: session,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}`}
        >
            {children}
        </div>
    );
}
