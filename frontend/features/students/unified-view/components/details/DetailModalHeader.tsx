"use client";

import { Badge } from '@/components/ui/badge';
import { DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CalendarClock, Clock } from 'lucide-react';
import { OptimizedAvatar } from '../OptimizedAvatar';
import type { Student } from '@/lib/types';

interface DetailModalHeaderProps {
    student: Student;
}

export function DetailModalHeader({ student }: DetailModalHeaderProps) {
    return (
        <div className="relative p-8 pb-12 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background z-0" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <OptimizedAvatar name={student.name} isActive={student.active} className="w-24 h-24 text-4xl" />

                <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-center sm:justify-start gap-3">
                        <DialogTitle className="text-3xl font-bold tracking-tight">
                            {student.name}
                        </DialogTitle>
                        <Badge
                            variant={student.active ? "default" : "secondary"}
                            className={cn(
                                "text-xs px-2.5 py-0.5 rounded-full border shadow-sm",
                                student.active
                                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                    : "bg-gray-100 dark:bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/20"
                            )}
                        >
                            {student.active ? "Đang học" : "Đã nghỉ"}
                        </Badge>
                    </div>

                    <p className="text-muted-foreground font-medium flex items-center justify-center sm:justify-start gap-2 italic">
                        &quot;{student.notes || 'Không có ghi chú'}&quot;
                    </p>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                            <Clock className="w-4 h-4" />
                            <span>Học từ {student.startMonth || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                            <CalendarClock className="w-4 h-4" />
                            <span>{student.monthsLearned} tháng theo học</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
