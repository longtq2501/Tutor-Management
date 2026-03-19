'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ExerciseListItemResponse, ExerciseStatus } from '@/features/exercise-import/types/exercise.types';
import { format } from 'date-fns';
import { FileText, Play, Trash2, UserPlus, Clock, Calendar } from 'lucide-react';
import { cn, formatExerciseTitle } from '@/lib/utils';
import { ActionTooltip } from './ActionTooltip';

/**
 * Mobile-optimized card for individual exercises.
 */
interface ExerciseMobileCardProps {
    ex: ExerciseListItemResponse;
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    onSelectExercise: (exercise: ExerciseListItemResponse, action: 'PLAY' | 'GRADE' | 'EDIT' | 'REVIEW') => void;
    handleOpenAssign: (ex: ExerciseListItemResponse, e: React.MouseEvent) => void;
    handleDelete: (id: string, e: React.MouseEvent) => void;
}

export const ExerciseMobileCard: React.FC<ExerciseMobileCardProps> = ({
    ex,
    role,
    onSelectExercise,
    handleOpenAssign,
    handleDelete
}) => {
    const isStudent = role === 'STUDENT';

    return (
        <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-all active:scale-[0.98] bg-card/60 backdrop-blur-sm relative group" onClick={() => {
            if (isStudent) onSelectExercise(ex, 'PLAY');
            else onSelectExercise(ex, 'GRADE');
        }}>
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 opacity-50" />

            <div className="p-4 space-y-4">
                <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                        <h3 className="font-black text-sm leading-snug text-foreground whitespace-pre-wrap group-hover:text-primary transition-colors">
                            {formatExerciseTitle(ex.title)}
                        </h3>
                    </div>
                    <Badge
                        variant={
                            ex.submissionStatus === 'OVERDUE' ? 'destructive' :
                                ex.status === ExerciseStatus.PUBLISHED ? 'default' : 'secondary'
                        }
                        className={cn(
                            "text-[10px] px-2 py-0 h-5 shrink-0 font-black tracking-tighter uppercase",
                            ex.status === ExerciseStatus.PUBLISHED ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-muted text-muted-foreground border-muted-foreground/20"
                        )}
                    >
                        {ex.submissionStatus === 'OVERDUE' ? 'QUÁ HẠN' : ex.status === ExerciseStatus.PUBLISHED ? 'CÔNG KHAI' : 'BẢN NHÁP'}
                    </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest bg-muted/30 p-2.5 rounded-xl border border-muted/50">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] opacity-60">Thời lượng</span>
                        <div className="flex items-center gap-1.5 text-foreground/80">
                            <Clock className="h-3 w-3 text-primary/60" />
                            <span>{ex.timeLimit ? `${ex.timeLimit} phút` : '∞'}</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 border-l pl-3 border-muted/50">
                        <span className="text-[8px] opacity-60">Thang điểm</span>
                        <div className="flex items-center gap-1.5 text-foreground/80 font-black">
                            <FileText className="h-3 w-3 text-primary/60" />
                            <span>{ex.totalPoints}đ</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground/50 px-1">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {ex.createdAt ? format(new Date(ex.createdAt), 'dd/MM/yyyy') : '-'}
                    </div>
                    {!isStudent && <span className="opacity-0 group-hover:opacity-100 transition-opacity italic">Nhấn để thao tác</span>}
                </div>

                <div className="flex flex-col gap-2 pt-1">
                    {isStudent ? (
                        <div className="flex gap-2">
                            {ex.submissionId && (ex.submissionStatus === 'SUBMITTED' || ex.submissionStatus === 'GRADED') ? (
                                <ActionTooltip label="Xem kết quả">
                                    <Button variant="outline" size="sm" className="flex-1 text-xs h-9 font-bold rounded-xl border-2" onClick={(e) => { e.stopPropagation(); onSelectExercise({ ...ex, id: ex.submissionId! }, 'REVIEW'); }}>
                                        <FileText className="mr-2 h-4 w-4" /> Kết quả
                                    </Button>
                                </ActionTooltip>
                            ) : null}
                            <ActionTooltip label={ex.submissionId ? "Tiếp tục làm bài" : "Bắt đầu làm bài"}>
                                <Button size="sm" className="flex-1 text-xs h-9 font-bold shadow-md rounded-xl" onClick={(e) => { e.stopPropagation(); onSelectExercise(ex, 'PLAY'); }}>
                                    <Play className="mr-2 h-4 w-4 fill-current" /> {ex.submissionId ? 'Làm tiếp' : 'Làm bài'}
                                </Button>
                            </ActionTooltip>
                        </div>
                    ) : (
                        <div className="flex gap-2 w-full">
                            <ActionTooltip label="Giao bài tập cho học sinh" side="bottom">
                                <Button variant="outline" size="sm" className="flex-1 text-xs h-9 font-bold rounded-xl border-2" onClick={(e) => { e.stopPropagation(); handleOpenAssign(ex, e); }}>
                                    <UserPlus className="mr-2 h-4 w-4" /> Giao bài
                                </Button>
                            </ActionTooltip>
                            <ActionTooltip label="Chấm điểm bài tập" side="bottom">
                                <Button variant="outline" size="sm" className="flex-1 text-xs h-9 font-bold rounded-xl border-2" onClick={(e) => { e.stopPropagation(); onSelectExercise(ex, 'GRADE'); }}>
                                    <FileText className="mr-2 h-4 w-4" /> Chấm điểm
                                </Button>
                            </ActionTooltip>
                            <ActionTooltip label="Xóa vĩnh viễn bài tập và toàn bộ bài nộp liên quan" side="left">
                                <Button variant="ghost" size="sm" className="text-red-500 h-9 w-9 p-0 rounded-xl hover:bg-red-50 transition-colors" onClick={(e) => { e.stopPropagation(); handleDelete(ex.id, e); }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </ActionTooltip>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
