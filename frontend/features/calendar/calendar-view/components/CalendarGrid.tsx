import type { SessionRecord } from '@/lib/types/finance';
import { cn } from '@/lib/utils';
import { memo } from 'react';
import { DAYS } from '../constants';
import type { CalendarDay } from '../types';
import { CalendarCell } from './CalendarCell';

interface Props {
  days: CalendarDay[];
  onDayClick: (day: CalendarDay) => void;
  onAddSession: (dateStr: string) => void;
  onSessionClick?: (session: SessionRecord) => void;
  onSessionEdit?: (session: SessionRecord) => void;
  onUpdate?: (updated: SessionRecord) => void;
  onDelete?: (id: number) => void;
  onContextMenu?: (e: React.MouseEvent, session: SessionRecord) => void;
}

export const CalendarGrid = memo(({
  days,
  onDayClick,
  onAddSession,
  onSessionClick,
  onSessionEdit,
  onContextMenu
}: Props) => {
  return (
    <div className="bg-card rounded-2xl shadow-xl border border-border/40 overflow-hidden transition-all duration-500 hover:shadow-2xl will-change-transform contain-layout">
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b bg-muted/30 dark:bg-zinc-900/50">
        {DAYS.map((day, index) => (
          <div
            key={day}
            className={cn(
              "p-1 sm:p-4 text-center text-[8px] sm:text-xs font-black uppercase tracking-tighter sm:tracking-[0.2em]",
              index === 0 ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Cells */}
      <div className="grid grid-cols-7 auto-rows-fr bg-background">
        {days.map((day, idx) => (
          <CalendarCell
            key={idx}
            day={day}
            isToday={day.isToday}
            isCurrentMonth={day.isCurrentMonth}
            sessions={day.sessions}
            onDayClick={onDayClick}
            onSessionClick={(session) => onSessionClick?.(session)}
            onAddSession={onAddSession}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    </div>
  );
});
CalendarGrid.displayName = 'CalendarGrid';
