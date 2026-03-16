'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText } from 'lucide-react';
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
    const studentExerciseGroups = {
        pending: l.exercises.filter(ex => !ex.submissionStatus),
        submitted: l.exercises.filter(ex => ex.submissionStatus === 'SUBMITTED'),
        graded: l.exercises.filter(ex => ex.submissionStatus === 'GRADED')
    };

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
                                                                const action = (ex.submissionStatus === 'SUBMITTED' || ex.submissionStatus === 'GRADED') ? 'REVIEW' : 'PLAY';
                                                                onSelectExercise(ex, action);
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
        </Card>
    );
};
