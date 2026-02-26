'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, Trash2 } from 'lucide-react';
import { memo } from 'react';

interface SessionItemProps {
    session: {
        id: number;
        sessionDate: string;
        hours: number;
        subject?: string | null;
        paid: boolean;
        status?: string;
    };
    index: number;
    onDelete: (id: number) => void;
}

function SessionItemComponent({ session, index, onDelete }: SessionItemProps) {
    const isCancelled = session.status === 'CANCELLED_BY_STUDENT' || session.status === 'CANCELLED_BY_TUTOR';
    const isStudentCancelled = session.status === 'CANCELLED_BY_STUDENT';
    const isPaid = session.paid || session.status === 'PAID';

    // Determine Badge Config
    let badgeConfig = { text: 'Chưa TT', className: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' };

    if (isPaid) {
        badgeConfig = { text: 'Đã thanh toán', className: 'text-emerald-500 bg-emerald-100 border-emerald-200' };
    } else if (session.status === 'CANCELLED_BY_STUDENT') {
        badgeConfig = { text: 'Học sinh hủy', className: 'text-rose-500 bg-rose-100 border-rose-200' };
    } else if (session.status === 'CANCELLED_BY_TUTOR') {
        badgeConfig = { text: 'Tutor hủy', className: 'text-slate-600 bg-slate-200 border-slate-300' };
    } else if (session.status === 'SCHEDULED') {
        badgeConfig = { text: 'Đã hẹn', className: 'text-slate-500 bg-slate-100 border-slate-200' };
    } else if (session.status === 'CONFIRMED') {
        badgeConfig = { text: 'Đã xác nhận', className: 'text-blue-500 bg-blue-100 border-blue-200' };
    } else if (session.status === 'COMPLETED') {
        badgeConfig = { text: 'Đã dạy', className: 'text-orange-500 bg-orange-100 border-orange-200' }; // Taught but unpaid
    } else if (session.status === 'PENDING_PAYMENT') {
        badgeConfig = { text: 'Chờ xác nhận', className: 'text-amber-600 bg-amber-100 border-amber-200' };
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={cn(
                "flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-background border border-border/40 transition-colors shadow-sm group/item",
                !isCancelled ? "hover:border-primary/30" : "opacity-75 bg-muted/20"
            )}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn(
                    "w-1 h-8 rounded-full flex-shrink-0 transition-colors",
                    isPaid ? 'bg-emerald-500' :
                        isCancelled ? 'bg-slate-300' :
                            session.status === 'SCHEDULED' ? 'bg-slate-300' :
                                'bg-rose-500' // Default unpaid/completed
                )} />
                <div className="flex-1 min-w-0">
                    <div className={cn("font-black text-sm text-foreground truncate", isCancelled && "line-through text-muted-foreground font-bold")}>
                        {format(new Date(session.sessionDate), 'dd/MM/yyyy')}
                    </div>
                    <div className="text-xs text-foreground/90 flex items-center gap-1.5 mt-0.5 font-bold">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground/90 shrink-0" />
                        <span className="shrink-0">{session.hours}h</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
                        <span className="truncate min-w-0">{session.subject || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <div className={cn("flex items-center gap-2 shrink-0", !isStudentCancelled && "ml-auto")}>
                <Badge variant="outline" className={cn(
                    "text-[10px] h-5 px-1.5 font-bold border whitespace-nowrap shrink-0",
                    badgeConfig.className
                )}>
                    {badgeConfig.text}
                </Badge>

                {!isCancelled && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover/item:opacity-100 transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(session.id);
                        }}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                )}
            </div>
        </motion.div>
    );
}

// Memoize with custom comparison to prevent unnecessary re-renders
export const SessionItem = memo(SessionItemComponent, (prevProps, nextProps) => {
    // Only re-render if session data or index changes
    return (
        prevProps.session.id === nextProps.session.id &&
        prevProps.session.paid === nextProps.session.paid &&
        prevProps.session.status === nextProps.session.status &&
        prevProps.index === nextProps.index
    );
});

SessionItem.displayName = 'SessionItem';
