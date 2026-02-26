'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { exerciseService } from '@/features/exercise-import/services/exerciseService';
import { ExerciseListItemResponse, TutorStudentSummaryResponse } from '@/features/exercise-import/types/exercise.types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Clock,
    FileText,
    BookOpen,
    Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { PageResponse } from '@/lib/types';
import { ExerciseRowCard } from './ExerciseRowCard';
import { PerformanceSection } from './PerformanceSection';

interface StudentDetailViewProps {
    studentSummary: TutorStudentSummaryResponse;
    onBack: () => void;
    onViewExercise: (exercise: ExerciseListItemResponse, action: 'GRADE' | 'REVIEW') => void;
}

/**
 * View showing detailed performance and exercises for a specific student.
 */
export const StudentDetailView: React.FC<StudentDetailViewProps> = ({
    studentSummary,
    onBack,
    onViewExercise
}) => {
    const { data: exercisesData, isLoading } = useQuery({
        queryKey: ['exercises', 'student', studentSummary.studentId],
        queryFn: () => exerciseService.getAssignedByStudentId(studentSummary.studentId, 0, 100),
    });

    const exercises: ExerciseListItemResponse[] = (exercisesData as PageResponse<ExerciseListItemResponse>)?.content || [];

    // Categorization
    const pending = exercises.filter(ex => !ex.submissionStatus || ex.submissionStatus === 'PENDING' || ex.submissionStatus === 'OVERDUE');
    const inProgress = exercises.filter(ex => ['DRAFT', 'SUBMITTED', 'STARTED'].includes(ex.submissionStatus || ''));
    const graded = exercises.filter(ex => ex.submissionStatus === 'GRADED');

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="space-y-8 pb-24 w-full">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={onBack} size="sm" className="h-9 hover:bg-muted/80 group rounded-xl px-4">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="font-semibold">Quay lại danh sách</span>
                </Button>
            </div>

            <StudentProfileHeader studentSummary={studentSummary} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-0 mt-8">
                <div className="lg:pr-8 lg:border-r lg:border-dashed lg:border-muted-foreground/20">
                    <PerformanceSection title="Chờ làm" icon={<Clock className="h-5 w-5 text-orange-500" />} count={pending.length} isLoading={isLoading}>
                        {pending.map(ex => <ExerciseRowCard key={ex.id} exercise={ex} disabled onClick={() => { }} />)}
                    </PerformanceSection>
                </div>

                <div className="lg:px-8 lg:border-r lg:border-dashed lg:border-muted-foreground/20">
                    <PerformanceSection title="Đang làm" icon={<FileText className="h-5 w-5 text-sky-500" />} count={inProgress.length} isLoading={isLoading}>
                        {inProgress.map(ex => (
                            <ExerciseRowCard key={ex.id} exercise={ex} label={ex.submissionStatus === 'SUBMITTED' ? 'Đã nộp bài' : 'Đang thực hiện'} onClick={() => onViewExercise(ex, 'GRADE')} />
                        ))}
                    </PerformanceSection>
                </div>

                <div className="lg:pl-8">
                    <PerformanceSection title="Đã nộp & chấm điểm" icon={<Trophy className="h-5 w-5 text-green-500" />} count={graded.length} isLoading={isLoading}>
                        {graded.map(ex => <ExerciseRowCard key={ex.id} exercise={ex} showScore onClick={() => onViewExercise(ex, 'REVIEW')} />)}
                    </PerformanceSection>
                </div>
            </div>
        </motion.div>
    );
};

const StudentProfileHeader = ({ studentSummary }: { studentSummary: TutorStudentSummaryResponse }) => {
    const completionRate = studentSummary.totalAssigned > 0
        ? Math.round((studentSummary.gradedCount / studentSummary.totalAssigned) * 100)
        : 0;

    return (
        <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-card via-card to-muted/20 relative group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                <BookOpen className="h-32 w-32 -rotate-12" />
            </div>
            <CardContent className="p-8 md:p-10">
                <div className="flex flex-col lg:flex-row items-center gap-10">
                    <div className="flex items-center gap-8 flex-1 w-full">
                        <div className="h-24 w-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary text-4xl font-black shadow-2xl border-4 border-background ring-2 ring-primary/20">
                            {studentSummary.studentName.charAt(0)}
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                                {studentSummary.studentName}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4 text-muted-foreground font-semibold">
                                <Badge variant="secondary" className="px-3 py-1 bg-primary/5 text-primary border-primary/20 text-xs rounded-lg">
                                    Lớp: {studentSummary.grade || 'N/A'}
                                </Badge>
                                <span className="text-sm flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-lg">
                                    <FileText className="h-4 w-4 text-primary/60" /> {studentSummary.totalAssigned} Tài liệu & Bài tập
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-12 w-full lg:w-auto overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
                        <StatItem iconColor="bg-orange-500" value={studentSummary.pendingCount} label="Chờ làm" />
                        <StatItem iconColor="bg-sky-500" value={studentSummary.submittedCount} label="Đang làm" />
                        <StatItem iconColor="bg-green-500" value={studentSummary.gradedCount} label="Đã chấm" />
                        <ProgressRing percentage={completionRate} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const StatItem = ({ iconColor, value, label }: { iconColor: string; value: number; label: string }) => (
    <div className="text-center space-y-2 min-w-[70px]">
        <div className="flex items-center gap-2 justify-center">
            <div className={cn("h-2.5 w-2.5 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]", iconColor)} />
            <span className="text-3xl font-black tabular-nums">{value}</span>
        </div>
        <p className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground/60">{label}</p>
    </div>
);

const ProgressRing = ({ percentage }: { percentage: number }) => (
    <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
        <svg className="h-full w-full -rotate-90 transform">
            <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-muted/10" />
            <motion.circle
                cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="6" fill="transparent"
                strokeDasharray={2 * Math.PI * 34}
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - percentage / 100) }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="text-primary drop-shadow-[0_0_8px_rgba(var(--primary),0.4)]"
                strokeLinecap="round"
            />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-black leading-none">{percentage}%</span>
            <span className="text-[7px] text-muted-foreground font-black uppercase tracking-tighter mt-1">Đã học</span>
        </div>
    </div>
);
