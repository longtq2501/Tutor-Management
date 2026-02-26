'use client';

import React from 'react';
import { useTutorStudentSummaries } from '../hooks/useExercises';
import { TutorStudentSummaryResponse } from '@/features/exercise-import/types/exercise.types';
import { PageResponse } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { TutorStudentGridSkeleton } from './TutorStudentGridSkeleton';
import { TutorStudentGridEmptyState } from './TutorStudentGridEmptyState';
import { TutorStudentCard } from './TutorStudentCard';

interface TutorStudentGridProps {
    onSelectStudent: (student: TutorStudentSummaryResponse) => void;
}

export const TutorStudentGrid: React.FC<TutorStudentGridProps> = ({ onSelectStudent }) => {
    const [page, setPage] = React.useState(0);
    const { data: summariesData, isLoading } = useTutorStudentSummaries(page, 9);

    const summaries: TutorStudentSummaryResponse[] = (summariesData as PageResponse<TutorStudentSummaryResponse>)?.content || [];
    const totalPages = (summariesData as PageResponse<TutorStudentSummaryResponse>)?.totalPages || 1;

    if (isLoading) return <TutorStudentGridSkeleton />;
    if (summaries.length === 0) return <TutorStudentGridEmptyState />;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-500">
                {summaries.map((student) => (
                    <TutorStudentCard
                        key={student.studentId}
                        student={student}
                        onClick={onSelectStudent}
                    />
                ))}
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center pt-2">
                    <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-lg border">
                        <Button
                            variant="ghost" size="sm" className="h-8 w-8 p-0"
                            disabled={page === 0} onClick={() => setPage(p => p - 1)}
                        >
                            &lt;
                        </Button>
                        <span className="text-xs font-medium px-2">Trang {page + 1} / {totalPages}</span>
                        <Button
                            variant="ghost" size="sm" className="h-8 w-8 p-0"
                            disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                        >
                            &gt;
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
