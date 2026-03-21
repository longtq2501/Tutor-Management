import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { SessionRecord } from '@/lib/types/finance';
import { cn } from '@/lib/utils';
import { BookOpen, X } from 'lucide-react';

interface ModalHeaderProps {
    session: SessionRecord;
    onClose: () => void;
}

export function ModalHeader({ session, onClose }: ModalHeaderProps) {
    const isPaid = session.paid;
    const isCancelled = session.status === 'CANCELLED_BY_STUDENT' || session.status === 'CANCELLED_BY_TUTOR';

    return (
        <div className={cn(
            "relative p-2.5 sm:p-6 transition-all duration-500 shrink-0",
            isPaid ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-blue-600 to-indigo-600",
            isCancelled ? "from-slate-600 to-slate-700" : ""
        )}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

            <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-sm shrink-0">
                        <BookOpen size={14} className="sm:hidden" />
                        <BookOpen size={24} className="hidden sm:block" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                            <h3 className="text-white font-black uppercase tracking-[0.2em] text-[9px] sm:text-[10px] opacity-90 whitespace-nowrap">Chi tiết buổi học</h3>
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 py-0 h-4 text-[8px] sm:text-[9px] font-bold">
                                #{session.sessionNumber ? session.sessionNumber : session.id}
                            </Badge>
                            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 py-0 h-4 text-[8px] sm:text-[9px] font-bold">
                                {session.sessionDate}
                            </Badge>
                            {session.isOnline && (
                                <Badge className="bg-blue-400 hover:bg-blue-500 text-white border-0 py-0 h-4 text-[8px] sm:text-[9px] font-bold animate-pulse-subtle">
                                    🌐 Dạy Online
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-[14px] sm:text-2xl font-black text-white tracking-tight leading-none">Thông tin lớp học</h1>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="rounded-full text-white hover:bg-white/20 h-6 w-6 sm:h-10 sm:w-10 shrink-0"
                >
                    <X size={14} className="sm:hidden" />
                    <X size={20} className="hidden sm:block" />
                </Button>
            </div>
        </div>
    );
}
