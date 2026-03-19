'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ExerciseListItemResponse, ExerciseStatus } from '@/features/exercise-import/types/exercise.types';
import { format } from 'date-fns';
import { FileText, Play, Trash2, UserPlus, Clock } from 'lucide-react';
import { cn, formatExerciseTitle } from '@/lib/utils';
import { ActionTooltip } from './ActionTooltip';

/**
 * Desktop table view for displaying exercises.
 */
interface ExerciseTableProps {
    exercises: ExerciseListItemResponse[];
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    onSelectExercise: (exercise: ExerciseListItemResponse, action: 'PLAY' | 'GRADE' | 'EDIT' | 'REVIEW') => void;
    handleOpenAssign: (ex: ExerciseListItemResponse, e: React.MouseEvent) => void;
    handleDelete: (id: string, e: React.MouseEvent) => void;
}

export const ExerciseTable: React.FC<ExerciseTableProps> = ({
    exercises,
    role,
    onSelectExercise,
    handleOpenAssign,
    handleDelete
}) => {
    const isStudent = role === 'STUDENT';

    return (
        <div className="relative overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            <Table>
                <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-md z-20 shadow-sm border-b">
                    <TableRow className="hover:bg-transparent border-none">
                        <TableHead className="py-1.5 px-6 font-bold text-[10px] md:text-[11px] uppercase tracking-widest text-muted-foreground/70">Tiêu đề bài tập</TableHead>
                        <TableHead className="py-1.5 px-4 font-bold text-[10px] md:text-[11px] uppercase tracking-widest text-muted-foreground/70 text-center">Trạng thái</TableHead>
                        <TableHead className="py-1.5 px-4 font-bold text-[10px] md:text-[11px] uppercase tracking-widest text-muted-foreground/70 text-center">Thời lượng</TableHead>
                        <TableHead className="py-1.5 px-4 font-bold text-[10px] md:text-[11px] uppercase tracking-widest text-muted-foreground/70 text-center">Thang điểm</TableHead>
                        <TableHead className="py-1.5 px-4 font-bold text-[10px] md:text-[11px] uppercase tracking-widest text-muted-foreground/70">Ngày tạo</TableHead>
                        <TableHead className="py-1.5 px-6 font-bold text-[10px] md:text-[11px] uppercase tracking-widest text-muted-foreground/70 text-right">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {exercises.map((ex: ExerciseListItemResponse) => (
                        <TableRow
                            key={ex.id}
                            className="group transition-all hover:bg-primary/[0.03] border-b border-muted/30"
                            onClick={() => {
                                if (isStudent) onSelectExercise(ex, 'PLAY');
                                else onSelectExercise(ex, 'GRADE');
                            }}
                        >
                            <TableCell className="py-2.5 px-6 font-bold max-w-[400px]">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 p-1 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                                        <FileText className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                    <div className="whitespace-pre-wrap leading-snug text-[12px] md:text-[13px] group-hover:text-primary transition-colors">
                                        {formatExerciseTitle(ex.title)}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="py-2.5 px-4 text-center">
                                <Badge
                                    variant={
                                        ex.submissionStatus === 'OVERDUE' ? 'destructive' :
                                            ex.status === ExerciseStatus.PUBLISHED ? 'default' : 'secondary'
                                    }
                                    className={cn(
                                        "px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter rounded-md",
                                        ex.status === ExerciseStatus.PUBLISHED ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20" : "bg-muted text-muted-foreground border-muted-foreground/20"
                                    )}
                                >
                                    {ex.submissionStatus === 'OVERDUE' ? 'QUÁ HẠN' : ex.status === ExerciseStatus.PUBLISHED ? 'CÔNG KHAI' : 'BẢN NHÁP'}
                                </Badge>
                            </TableCell>
                            <TableCell className="py-1 px-4 text-center">
                                <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 text-xs font-bold text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {ex.timeLimit ? `${ex.timeLimit}'` : '∞'}
                                </span>
                            </TableCell>
                            <TableCell className="py-1 px-4 text-center">
                                <span className="text-[12px] md:text-[13px] font-black text-foreground/80">{ex.totalPoints}</span>
                            </TableCell>
                            <TableCell className="py-1 px-4 text-[11px] font-semibold text-muted-foreground/60 tabular-nums">
                                {ex.createdAt ? format(new Date(ex.createdAt), 'dd/MM/yyyy') : '-'}
                            </TableCell>
                            <TableCell className="py-1 px-6 text-right">
                                <div className="flex justify-end gap-1.5 lg:opacity-0 group-hover:opacity-100 transition-all">
                                    {isStudent ? (
                                        <div className="flex gap-2">
                                            {ex.submissionId && (ex.submissionStatus === 'SUBMITTED' || ex.submissionStatus === 'GRADED') ? (
                                                <ActionTooltip label="Xem kết quả">
                                                    <Button size="sm" variant="outline" className="h-8 font-bold border-2 rounded-lg" onClick={(e) => { e.stopPropagation(); onSelectExercise({ ...ex, id: ex.submissionId! }, 'REVIEW'); }}>
                                                        <FileText className="mr-2 h-4 w-4" /> Kết quả
                                                    </Button>
                                                </ActionTooltip>
                                            ) : null}
                                            <ActionTooltip label={ex.submissionId ? "Tiếp tục làm bài" : "Bắt đầu làm bài"}>
                                                <Button size="sm" className="h-8 font-bold shadow-md rounded-lg" onClick={(e) => { e.stopPropagation(); onSelectExercise(ex, 'PLAY'); }}>
                                                    <Play className="mr-2 h-4 w-4 fill-current" /> {ex.submissionId ? 'Làm tiếp' : 'Làm bài'}
                                                </Button>
                                            </ActionTooltip>
                                        </div>
                                    ) : (
                                        <>
                                            <ActionTooltip label="Giao bài tập cho học sinh">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); handleOpenAssign(ex, e); }}>
                                                    <UserPlus className="h-4 w-4" />
                                                </Button>
                                            </ActionTooltip>
                                            <ActionTooltip label="Chấm điểm bài tập">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); onSelectExercise(ex, 'GRADE'); }}>
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            </ActionTooltip>
                                            <ActionTooltip label="Xóa vĩnh viễn bài tập và toàn bộ bài nộp liên quan">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors" onClick={(e) => { e.stopPropagation(); handleDelete(ex.id, e); }}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </ActionTooltip>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};
