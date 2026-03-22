'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { ExerciseListItemResponse } from '@/features/exercise-import/types/exercise.types';
import { ExerciseFilterBar } from './ExerciseFilterBar';
import { ExerciseTable } from './ExerciseTable';
import { ExerciseMobileCard } from './ExerciseMobileCard';
import { ActionTooltip } from './ActionTooltip';
import { AssignExerciseDialog } from './AssignExerciseDialog';
import { ExerciseListSkeleton } from './ExerciseListSkeleton';
import { useExerciseListLogic } from '../hooks/useExerciseListLogic';
import { ExercisePagination } from './ExercisePagination';
import { StudentExerciseCard } from './StudentExerciseCard';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExerciseListProps {
    role: 'STUDENT' | 'TEACHER' | 'ADMIN';
    onSelectExercise: (exercise: ExerciseListItemResponse, action: 'PLAY' | 'GRADE' | 'EDIT' | 'REVIEW') => void;
    onCreateNew?: () => void;
}

/**
 * Empty state component shown when no exercises are found.
 */
const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 space-y-3 min-h-[200px]">
        <div className="bg-muted p-4 rounded-full">
            <FileText className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <p className="text-muted-foreground font-medium">Chưa có bài tập nào.</p>
    </div>
);

/**
 * Main assessment library component.
 * Orchestrates filtering, pagination, and multi-role views.
 */
export const ExerciseList: React.FC<ExerciseListProps> = ({ role, onSelectExercise, onCreateNew }) => {
    const l = useExerciseListLogic(role);
    const WEEK_DAYS = ['CN', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'];
    const getSubmissionStatus = (submissionStatus?: string) => (submissionStatus || '').toUpperCase();
    const hasCompletedSubmission = (submissionStatus?: string) => {
        const status = getSubmissionStatus(submissionStatus);
        return status === 'SUBMITTED' || status === 'GRADED';
    };
    const formatDeadline = (value?: string) => {
        if (!value) return 'N/A';

        // Prefer preserving backend local date-time strings as-is to avoid timezone drift.
        const localDateTimeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
        if (localDateTimeMatch) {
            const [, year, month, day, hour, minute] = localDateTimeMatch;
            return `${hour}:${minute} ${day}/${month}/${year}`;
        }

        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleString('vi-VN', {
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const parseDeadline = (value?: string) => {
        if (!value) return null;

        const localDateTimeMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
        if (localDateTimeMatch) {
            const [, year, month, day, hour, minute, second = '00'] = localDateTimeMatch;
            const date = new Date(
                Number(year),
                Number(month) - 1,
                Number(day),
                Number(hour),
                Number(minute),
                Number(second)
            );
            return Number.isNaN(date.getTime()) ? null : date;
        }

        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
    };
    const toDateKey = (value: Date) => {
        const year = value.getFullYear();
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const day = String(value.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const getStudentAction = (exercise: ExerciseListItemResponse): 'PLAY' | 'REVIEW' => {
        const status = getSubmissionStatus(exercise.submissionStatus);
        return status === 'SUBMITTED' || status === 'GRADED' ? 'REVIEW' : 'PLAY';
    };

    const studentExerciseGroups = {
        // Any status that is not explicitly submitted/graded should remain visible in pending.
        pending: l.exercises.filter(ex => {
            const status = getSubmissionStatus(ex.submissionStatus);
            return !status || (status !== 'SUBMITTED' && status !== 'GRADED');
        }),
        submitted: l.exercises.filter(ex => getSubmissionStatus(ex.submissionStatus) === 'SUBMITTED'),
        graded: l.exercises.filter(ex => getSubmissionStatus(ex.submissionStatus) === 'GRADED')
    };

    const studentExercisesByDeadline = React.useMemo(() => {
        return l.exercises
            .map(exercise => {
                const deadlineDate = parseDeadline(exercise.deadline);
                if (!deadlineDate) return null;

                const status = getSubmissionStatus(exercise.submissionStatus);
                const isCompleted = hasCompletedSubmission(exercise.submissionStatus);
                const isOverdue = !isCompleted && deadlineDate.getTime() < Date.now();
                const tone: 'graded' | 'submitted' | 'overdue' | 'pending' =
                    status === 'GRADED' ? 'graded'
                        : status === 'SUBMITTED' ? 'submitted'
                            : isOverdue ? 'overdue'
                                : 'pending';

                return {
                    exercise,
                    deadlineDate,
                    tone,
                };
            })
            .filter((entry): entry is { exercise: ExerciseListItemResponse; deadlineDate: Date; tone: 'graded' | 'submitted' | 'overdue' | 'pending' } => entry !== null)
            .sort((a, b) => a.deadlineDate.getTime() - b.deadlineDate.getTime());
    }, [l.exercises]);

    const [selectedDeadlineDate, setSelectedDeadlineDate] = React.useState<Date | undefined>(undefined);
    const [deadlineCalendarMonth, setDeadlineCalendarMonth] = React.useState<Date>(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });

    React.useEffect(() => {
        if (role !== 'STUDENT') {
            return;
        }
        if (studentExercisesByDeadline.length === 0) {
            setSelectedDeadlineDate(undefined);
            return;
        }
        setSelectedDeadlineDate(prev => prev ?? studentExercisesByDeadline[0].deadlineDate);
    }, [role, studentExercisesByDeadline]);

    React.useEffect(() => {
        if (!selectedDeadlineDate) return;
        setDeadlineCalendarMonth(new Date(selectedDeadlineDate.getFullYear(), selectedDeadlineDate.getMonth(), 1));
    }, [selectedDeadlineDate]);

    const exercisesByDateMap = React.useMemo(() => {
        const map = new Map<string, { exercise: ExerciseListItemResponse; deadlineDate: Date; tone: 'graded' | 'submitted' | 'overdue' | 'pending' }[]>();
        studentExercisesByDeadline.forEach(entry => {
            const key = toDateKey(entry.deadlineDate);
            const list = map.get(key) || [];
            list.push(entry);
            map.set(key, list);
        });
        return map;
    }, [studentExercisesByDeadline]);

    const selectedDayAssignments = React.useMemo(() => {
        if (!selectedDeadlineDate) return [];
        return exercisesByDateMap.get(toDateKey(selectedDeadlineDate)) || [];
    }, [selectedDeadlineDate, exercisesByDateMap]);

    const deadlineCalendarDays = React.useMemo(() => {
        const year = deadlineCalendarMonth.getFullYear();
        const month = deadlineCalendarMonth.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const firstDayWeekIndex = firstDayOfMonth.getDay();
        const firstGridDate = new Date(year, month, 1 - firstDayWeekIndex);
        const today = new Date();
        const todayKey = toDateKey(today);
        const selectedKey = selectedDeadlineDate ? toDateKey(selectedDeadlineDate) : '';

        return Array.from({ length: 42 }, (_, index) => {
            const date = new Date(firstGridDate);
            date.setDate(firstGridDate.getDate() + index);
            const dateKey = toDateKey(date);
            const assignments = exercisesByDateMap.get(dateKey) || [];

            return {
                date,
                dateKey,
                assignments,
                isCurrentMonth: date.getMonth() === month,
                isToday: dateKey === todayKey,
                isSelected: selectedKey === dateKey,
            };
        });
    }, [deadlineCalendarMonth, exercisesByDateMap, selectedDeadlineDate]);

    const handleSelectDeadlineDay = React.useCallback((day: Date) => {
        const dayAssignments = exercisesByDateMap.get(toDateKey(day)) || [];
        setSelectedDeadlineDate(day);
        setDeadlineCalendarMonth(new Date(day.getFullYear(), day.getMonth(), 1));

        if (dayAssignments.length === 1) {
            const target = dayAssignments[0].exercise;
            onSelectExercise(target, getStudentAction(target));
        }
    }, [exercisesByDateMap, onSelectExercise]);

    if (l.isExercisesLoading) {
        return (
            <div className="w-full h-auto max-h-full">
                <ExerciseListSkeleton />
            </div>
        );
    }

    return (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-400 flex flex-col h-auto max-h-full overflow-hidden border-none shadow-xl bg-gradient-to-br from-card to-muted/20">
            <CardHeader className="py-1.5 md:py-2 px-4 md:px-6 flex flex-row items-center justify-between border-b shrink-0 bg-background/50 backdrop-blur-sm z-10">
                <CardTitle className="text-lg md:text-xl font-black flex items-center gap-2 tracking-tight shrink min-w-0">
                    <FileText className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                    <span className="whitespace-nowrap truncate">Danh sách bài tập</span>
                    <Badge variant="secondary" className="font-black text-[10px] md:text-xs h-5 md:h-6 shrink-0">{l.totalElements}</Badge>
                </CardTitle>
                {(role !== 'STUDENT') && (
                    <ActionTooltip label="Tạo bài tập mới bằng AI hoặc Thủ công" side="left">
                        <Button onClick={onCreateNew} size="sm" className="h-9 shadow-lg rounded-xl font-bold px-3 sm:px-4 shrink-0 transition-all active:scale-95">
                            <Plus className="sm:mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Tạo bài tập mới</span>
                            <span className="sm:hidden">Tạo mới</span>
                        </Button>
                    </ActionTooltip>
                )}
            </CardHeader>

            <div className="flex flex-col flex-1 min-h-0">
                {role !== 'STUDENT' && (
                    <div className="shrink-0 bg-background/30 backdrop-blur-xs">
                        <ExerciseFilterBar
                            searchTerm={l.searchTerm} setSearchTerm={l.setSearchTerm}
                            selectedCategory={l.selectedCategory} setSelectedCategory={l.setSelectedCategory}
                            categories={l.categories}
                        />
                    </div>
                )}

                <CardContent className="p-0 flex-1 overflow-y-auto md:overflow-visible min-h-0 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                    {l.exercises.length === 0 ? <EmptyState /> : (
                        role === 'STUDENT' ? (
                            <div className="p-4 md:p-6 space-y-8">
                                <div className="rounded-2xl border border-border/70 bg-background/80 backdrop-blur-sm p-4 md:p-5">
                                    <div className="flex items-center justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4 text-primary" />
                                            <p className="text-sm md:text-base font-black tracking-tight">Lịch hạn nộp bài</p>
                                        </div>
                                        <Badge variant="secondary" className="h-6 px-2.5 text-xs font-black">
                                            {studentExercisesByDeadline.length}
                                        </Badge>
                                    </div>

                                    {studentExercisesByDeadline.length === 0 ? (
                                        <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
                                            Chưa có bài tập có hạn nộp
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div className="rounded-xl border border-border/70 bg-muted/10 p-2 md:p-3">
                                                <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
                                                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/30">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-lg"
                                                            onClick={() => setDeadlineCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                                                        >
                                                            <ChevronLeft className="h-4 w-4" />
                                                        </Button>
                                                        <p className="text-sm font-black tracking-tight capitalize">
                                                            {deadlineCalendarMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                                                        </p>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-lg"
                                                            onClick={() => setDeadlineCalendarMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                                                        >
                                                            <ChevronRight className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="grid grid-cols-7 border-b border-border/60 bg-background">
                                                        {WEEK_DAYS.map((dayLabel, index) => (
                                                            <div
                                                                key={dayLabel}
                                                                className={cn(
                                                                    'py-2 text-center text-[10px] font-black uppercase tracking-[0.14em]',
                                                                    index === 0 ? 'text-red-500' : 'text-muted-foreground'
                                                                )}
                                                            >
                                                                {dayLabel}
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <div className="grid grid-cols-7">
                                                        {deadlineCalendarDays.map((day) => {
                                                            const hasOverdue = day.assignments.some(item => item.tone === 'overdue');
                                                            const hasPending = day.assignments.some(item => item.tone === 'pending');
                                                            const hasSubmitted = day.assignments.some(item => item.tone === 'submitted');
                                                            const hasGraded = day.assignments.some(item => item.tone === 'graded');

                                                            return (
                                                            <button
                                                                key={day.dateKey}
                                                                type="button"
                                                                onClick={() => handleSelectDeadlineDay(day.date)}
                                                                className={cn(
                                                                    'h-[64px] border-r border-b border-border/40 px-1.5 py-1.5 text-left transition-colors hover:bg-primary/5',
                                                                    !day.isCurrentMonth && 'bg-muted/15 text-muted-foreground/60',
                                                                    hasOverdue && !day.isSelected && 'bg-rose-500/10 hover:bg-rose-500/15',
                                                                    !hasOverdue && hasPending && !day.isSelected && 'bg-amber-500/10 hover:bg-amber-500/15',
                                                                    !hasOverdue && !hasPending && (hasSubmitted || hasGraded) && !day.isSelected && 'bg-emerald-500/10 hover:bg-emerald-500/15',
                                                                    day.isSelected && 'bg-primary/10',
                                                                    day.isToday && 'ring-1 ring-inset ring-primary/40'
                                                                )}
                                                            >
                                                                <div className="flex items-start justify-between">
                                                                    <span
                                                                        className={cn(
                                                                            'h-6 w-6 rounded-full text-xs font-bold flex items-center justify-center',
                                                                            day.isToday
                                                                                ? 'bg-primary text-primary-foreground'
                                                                                : day.isSelected
                                                                                    ? 'bg-primary/15 text-primary'
                                                                                    : 'text-foreground'
                                                                        )}
                                                                    >
                                                                        {day.date.getDate()}
                                                                    </span>
                                                                    {day.assignments.length > 0 && (
                                                                        <span className="text-[10px] font-black text-primary">
                                                                            {day.assignments.length}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {day.assignments.length > 0 && (
                                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                                        {day.assignments.slice(0, 3).map((item) => (
                                                                            <span
                                                                                key={`${day.dateKey}-${item.exercise.id}`}
                                                                                className={cn(
                                                                                    'h-1.5 w-1.5 rounded-full',
                                                                                    item.tone === 'graded' && 'bg-emerald-500',
                                                                                    item.tone === 'submitted' && 'bg-blue-500',
                                                                                    item.tone === 'overdue' && 'bg-rose-500',
                                                                                    item.tone === 'pending' && 'bg-amber-500',
                                                                                )}
                                                                            />
                                                                        ))}
                                                                        {day.assignments.length > 3 && (
                                                                            <span className="text-[10px] leading-none text-muted-foreground">+{day.assignments.length - 3}</span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="rounded-xl border border-border/70 bg-background/70 p-3 md:p-4 space-y-3">
                                                <p className="text-xs uppercase tracking-[0.14em] font-black text-muted-foreground">
                                                    {selectedDeadlineDate
                                                        ? `Bài tập ngày ${selectedDeadlineDate.toLocaleDateString('vi-VN')}`
                                                        : 'Chọn ngày để xem bài tập'}
                                                </p>
                                                {selectedDayAssignments.length === 0 ? (
                                                    <div className="rounded-lg border border-dashed border-border px-3 py-6 text-xs text-muted-foreground text-center">
                                                        Không có bài tập trong ngày này
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2.5">
                                                        {selectedDayAssignments.map(({ exercise, tone }) => (
                                                            <button
                                                                key={exercise.id}
                                                                type="button"
                                                                onClick={() => onSelectExercise(exercise, getStudentAction(exercise))}
                                                                className="w-full text-left rounded-xl border border-border/70 bg-muted/10 hover:bg-primary/5 transition-colors px-3 py-2.5"
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <p className="text-sm font-bold leading-tight line-clamp-2">{exercise.title}</p>
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className={cn(
                                                                            'h-5 px-1.5 text-[10px] font-black whitespace-nowrap',
                                                                            tone === 'graded' && 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30',
                                                                            tone === 'submitted' && 'bg-blue-500/15 text-blue-700 border border-blue-500/30',
                                                                            tone === 'overdue' && 'bg-rose-500/15 text-rose-700 border border-rose-500/30',
                                                                            tone === 'pending' && 'bg-amber-500/15 text-amber-700 border border-amber-500/30',
                                                                        )}
                                                                    >
                                                                        {tone === 'graded' && 'Đã chấm'}
                                                                        {tone === 'submitted' && 'Đã nộp'}
                                                                        {tone === 'overdue' && 'Trễ hạn'}
                                                                        {tone === 'pending' && 'Chưa làm'}
                                                                    </Badge>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    Hạn nộp: {formatDeadline(exercise.deadline)}
                                                                </p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
                                    {[
                                        {
                                            key: 'pending',
                                            title: 'Chưa làm',
                                            items: studentExerciseGroups.pending,
                                            accent: 'border-orange-400/40 bg-orange-500/5'
                                        },
                                        {
                                            key: 'submitted',
                                            title: 'Đã nộp',
                                            items: studentExerciseGroups.submitted,
                                            accent: 'border-blue-400/40 bg-blue-500/5'
                                        },
                                        {
                                            key: 'graded',
                                            title: 'Đã chấm',
                                            items: studentExerciseGroups.graded,
                                            accent: 'border-green-400/40 bg-green-500/5'
                                        }
                                    ].map((group) => (
                                        <div key={group.key} className="rounded-2xl border border-border/70 bg-background/70 backdrop-blur-sm p-3 md:p-4">
                                            <div className={cn("rounded-xl border px-3 py-2 mb-3 flex items-center justify-between", group.accent)}>
                                                <p className="text-sm font-black tracking-tight">{group.title}</p>
                                                <Badge variant="secondary" className="h-6 px-2.5 text-xs font-black">
                                                    {group.items.length}
                                                </Badge>
                                            </div>

                                            {group.items.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-foreground">
                                                    Chưa có bài tập
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {group.items.map(ex => (
                                                        <StudentExerciseCard
                                                            key={ex.id}
                                                            exercise={ex}
                                                            onClick={() => {
                                                                onSelectExercise(ex, getStudentAction(ex));
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                {l.hasNextPage && (
                                    <div className="flex justify-center pb-8">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="h-12 px-8 rounded-2xl font-black border-2 hover:bg-primary hover:text-primary-foreground transition-all shadow-lg active:scale-95"
                                            onClick={() => l.fetchNextPage()}
                                            disabled={l.isFetchingNextPage}
                                        >
                                            {l.isFetchingNextPage ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Đang tải...
                                                </>
                                            ) : 'Tải thêm bài tập'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="hidden md:block">
                                    <ExerciseTable exercises={l.exercises} role={role} onSelectExercise={onSelectExercise} handleOpenAssign={l.handleOpenAssign} handleDelete={l.handleDelete} />
                                </div>
                                <div className="md:hidden space-y-3 p-4">
                                    {l.exercises.map(ex => <ExerciseMobileCard key={ex.id} ex={ex} role={role} onSelectExercise={onSelectExercise} handleOpenAssign={l.handleOpenAssign} handleDelete={l.handleDelete} />)}
                                </div>
                            </>
                        )
                    )}
                </CardContent>

                {role !== 'STUDENT' && (
                    <div className="shrink-0 p-4 border-t bg-background/50 backdrop-blur-sm">
                        <ExercisePagination page={l.page} totalPages={l.totalPages} setPage={l.setPage} isLoading={l.isExercisesLoading} />
                    </div>
                )}
            </div>

            <AssignExerciseDialog
                isOpen={l.isAssignDialogOpen} onOpenChange={l.setIsAssignDialogOpen}
                selectedExercise={l.selectedExercise} students={l.students} isStudentsLoading={l.isStudentsLoading}
                assignStudentId={l.assignStudentId} setAssignStudentId={l.setAssignStudentId}
                assignDeadline={l.assignDeadline} setAssignDeadline={l.setAssignDeadline}
                isAssigning={l.isAssigning} handleAssign={l.handleAssign}
            />

            <l.ConfirmationDialog />
        </Card>
    );
};
