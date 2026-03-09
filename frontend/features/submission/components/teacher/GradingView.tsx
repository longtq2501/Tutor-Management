import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { exerciseService } from '@/features/exercise-import/services/exerciseService';
import { Exercise, Question, QuestionType } from '@/features/exercise-import/types/exercise.types';
import { ArrowLeft, Check, CheckCircle2, Save, XCircle, AlertCircle } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { submissionService } from '../../services/submissionService';
import { GradeSubmissionRequest, SubmissionResponse } from '../../types/submission.types';
import { cn, formatExerciseTitle } from '@/lib/utils';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { Skeleton } from '@/components/ui/skeleton';

interface GradingViewProps {
    submissionId: string;
    onBack: () => void;
    isReviewMode?: boolean;
}

export const GradingView: React.FC<GradingViewProps> = ({ submissionId, onBack, isReviewMode = false }) => {
    const [submission, setSubmission] = useState<SubmissionResponse | null>(null);
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Grading state
    const [essayGrades, setEssayGrades] = useState<Map<string, { points: number; feedback: string }>>(new Map());
    const [teacherComment, setTeacherComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const subData = await submissionService.getById(submissionId);
                setSubmission(subData);
                setTeacherComment(subData.teacherComment || '');

                const exData = await exerciseService.getById(subData.exerciseId);
                setExercise(exData);

                // Initialize grades - ONLY for essay questions
                const grades = new Map();
                subData.answers.forEach(a => {
                    const question = exData.questions?.find(q => q.id === a.questionId);
                    if (question?.type === QuestionType.ESSAY) {
                        if (a.points !== undefined || a.feedback) {
                            grades.set(a.questionId, { points: a.points || 0, feedback: a.feedback || '' });
                        }
                    }
                });
                setEssayGrades(grades);
            } catch (err) {
                toast.error("Error", { description: "Failed to load grading data" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [submissionId]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleGradeChange = (questionId: string, field: 'points' | 'feedback', value: any) => {
        const newGrades = new Map(essayGrades);
        const current = newGrades.get(questionId) || { points: 0, feedback: '' };

        if (field === 'points') {
            current.points = parseInt(value) || 0;
        } else {
            current.feedback = value;
        }

        newGrades.set(questionId, current);
        setEssayGrades(newGrades);
    };

    const calculateEssayScore = () => {
        return Array.from(essayGrades.values()).reduce((sum, g) => sum + (g.points || 0), 0);
    };

    const totalCalculated = useMemo(() => {
        const mcq = submission?.mcqScore || 0;
        const essay = calculateEssayScore();
        return mcq + essay;
    }, [submission, essayGrades]);

    const finalTotal = useMemo(() => {
        if (!exercise) return 0;
        return Math.min(totalCalculated, exercise.totalPoints);
    }, [totalCalculated, exercise]);

    const handleSaveGrade = async () => {
        if (!submission) return;
        setIsSubmitting(true);
        try {
            const request: GradeSubmissionRequest = {
                essayGrades: Array.from(essayGrades.entries()).map(([qId, val]) => ({
                    questionId: qId,
                    points: val.points,
                    feedback: val.feedback
                })),
                teacherComment
            };

            console.log("Saving grades payload:", request);
            await submissionService.gradeSubmission(submissionId, request);
            toast.success("Đã lưu điểm!", { description: "Điểm số đã được cập nhật chính xác." });
            onBack();
        } catch (e) {
            toast.error("Error", { description: "Failed to save grades" });
            setIsSubmitting(false);
        }
    };

    if (isLoading || !submission || !exercise) {
        return (
            <div className="max-w-5xl mx-auto pb-24 space-y-6">
                <Card className="shadow-sm">
                    <CardHeader className="py-4">
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-64" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <div className="flex gap-2">
                                <Skeleton className="h-10 w-20" />
                                <Skeleton className="h-10 w-20" />
                            </div>
                        </div>
                    </CardHeader>
                </Card>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i}>
                            <CardHeader className="bg-muted/30">
                                <Skeleton className="h-5 w-full" />
                            </CardHeader>
                            <CardContent className="py-6 space-y-4">
                                <Skeleton className="h-24 w-full" />
                                <div className="flex gap-4">
                                    <Skeleton className="h-10 w-32" />
                                    <Skeleton className="h-10 flex-1" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
            {/* Sticky Header with Title and Scores */}
            <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b -mx-1 px-1 pb-3 mb-6">
                <Card className="border-l-4 border-l-primary shadow-sm bg-card mt-2">
                    <CardHeader className="py-2 px-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-8 w-8 -ml-1">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                                <div>
                                    <CardTitle className="text-base md:text-lg font-bold whitespace-pre-wrap leading-tight">{formatExerciseTitle(exercise.title).split('\n')[0]}</CardTitle>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-muted-foreground">
                                        <span className="font-bold text-foreground">{submission.studentName || submission.studentId}</span>
                                        <span className="opacity-50">|</span>
                                        <span>Nộp: {submission.submittedAt ? format(new Date(submission.submittedAt), 'HH:mm dd/MM') : 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 shrink-0 self-end md:self-center">
                                <div className="flex flex-col items-center bg-secondary/30 px-2 py-0.5 rounded border border-border min-w-[60px]">
                                    <span className="text-[8px] text-muted-foreground uppercase font-semibold">MCQ</span>
                                    <span className="text-xs font-bold text-primary">{submission.mcqScore || 0}</span>
                                </div>
                                <div className="flex flex-col items-center bg-secondary/30 px-2 py-0.5 rounded border border-border min-w-[60px]">
                                    <span className="text-[8px] text-muted-foreground uppercase font-semibold">Tự luận</span>
                                    <span className="text-xs font-bold text-yellow-600 dark:text-yellow-500">{calculateEssayScore()}</span>
                                </div>
                                <div className="flex flex-col items-center bg-primary/10 px-3 py-0.5 rounded border border-primary/20 min-w-[70px]">
                                    <span className="text-[8px] text-primary/70 uppercase font-semibold">Tổng</span>
                                    <span className="text-sm font-black text-primary">{finalTotal}/{exercise.totalPoints}</span>
                                </div>
                            </div>
                        </div>
                        {totalCalculated > exercise.totalPoints && (
                            <div className="mt-1.5 flex items-center gap-2 text-[9px] text-red-600 bg-red-500/10 p-1 rounded border border-red-500/20">
                                <AlertCircle className="h-3 w-3" />
                                <span>Giới hạn điểm tối đa {exercise.totalPoints}</span>
                            </div>
                        )}
                    </CardHeader>
                </Card>
            </div>

            <div className="mt-4 px-1 space-y-6">
                <div className="pr-4 -mr-4">
                    <div className="space-y-6 pr-4">
                        {exercise.questions?.map((q, idx) => {
                            const answer = submission.answers.find(a => a.questionId === q.id);
                            const grade = essayGrades.get(q.id!) || { points: 0, feedback: '' };

                            // Derive the correct answer label properly from options
                            const correctOption = q.options?.find(o => o.isCorrect)?.label;
                            const correctOptionText = q.options?.find(o => o.isCorrect)?.optionText;
                            const selectedOptionText = q.options?.find(o => o.label === answer?.selectedOption)?.optionText;

                            // Determine status
                            // Fallback: Check correctness by comparing strings directly (ignoring Backend isCorrect flag if needed)
                            const isCorrect = answer?.isCorrect === true ||
                                ((answer?.points || 0) > 0 && q.type === QuestionType.MCQ) ||
                                (answer?.selectedOption && correctOption && answer.selectedOption.trim() === correctOption.trim());

                            const hasAnswer = !!answer?.selectedOption || !!answer?.essayText;

                            return (
                                <Card key={q.id} className={cn(
                                    "border transition-all duration-200",
                                    !hasAnswer ? "opacity-90 bg-muted/30" : "bg-card shadow-sm hover:shadow-md"
                                )}>
                                    <CardHeader className="bg-muted/30 border-b pb-3 pt-3">
                                        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                                            <div className="flex gap-3 min-w-0">
                                                <Badge variant="outline" className="h-6 w-6 rounded-full flex items-center justify-center p-0 shrink-0 bg-background">
                                                    {idx + 1}
                                                </Badge>
                                                <div className="min-w-0">
                                                    <div className="font-medium leading-normal text-base text-foreground break-words">
                                                        {q.questionText}
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        <Badge variant="secondary" className="text-xs font-normal">
                                                            {q.type === QuestionType.MCQ ? 'Trắc nghiệm' : 'Tự luận'}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs font-normal">
                                                            {q.points} điểm
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4 space-y-4">
                                        {q.type === QuestionType.MCQ ? (
                                            <div className="space-y-3">
                                                <div className={cn(
                                                    "p-4 rounded-lg border flex flex-col gap-3 transition-colors",
                                                    isCorrect === true ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400" :
                                                        (hasAnswer ? "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400" : "bg-muted border-dashed")
                                                )}>
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                        <div className="flex items-start gap-2">
                                                            <span className="font-semibold text-sm uppercase opacity-70 shrink-0">Câu trả lời:</span>
                                                            <div className="flex flex-col gap-1 min-w-0">
                                                                <span className="text-lg font-bold">{answer?.selectedOption || '(Chưa làm)'}</span>
                                                                {selectedOptionText && (
                                                                    <span className="text-sm opacity-90 break-words">{selectedOptionText}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {hasAnswer && (
                                                            <div className="flex items-center gap-1 font-bold shrink-0">
                                                                {isCorrect ? (
                                                                    <>
                                                                        <CheckCircle2 className="h-5 w-5 shrink-0" /> Chính xác
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <XCircle className="h-5 w-5 shrink-0" /> Sai
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Always show correct answer for teacher */}
                                                <div className="text-sm bg-muted/50 p-3 rounded-md border border-border space-y-1">
                                                    <div className="flex flex-col sm:flex-row sm:items-start gap-1">
                                                        <span className="text-muted-foreground font-semibold">Đáp án đúng:</span>
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-bold text-foreground">{correctOption || 'N/A'}</span>
                                                            {correctOptionText && (
                                                                <span className="text-xs opacity-90">{correctOptionText}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            // Essay Section
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label className="text-muted-foreground text-xs uppercase font-bold">Bài làm của học sinh</Label>
                                                    <div className="p-4 bg-muted/30 rounded-lg border min-h-[100px] whitespace-pre-wrap font-serif text-foreground/90 leading-relaxed">
                                                        {answer?.essayText || '(Chưa làm bài)'}
                                                    </div>
                                                </div>

                                                {q.rubric && (
                                                    <div className="text-sm bg-blue-500/10 text-blue-700 dark:text-blue-300 p-3 rounded border border-blue-500/20">
                                                        <strong>Gợi ý chấm điểm (Rubric):</strong> {q.rubric}
                                                    </div>
                                                )}

                                                <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-dashed">
                                                    <div className="w-full md:w-32 space-y-1.5 shrink-0">
                                                        <Label className="text-xs">Điểm số</Label>
                                                        {isReviewMode ? (
                                                            <div className="h-10 px-3 py-2 border rounded-md bg-muted/30 font-bold flex items-center">
                                                                {grade.points} <span className="text-muted-foreground ml-1 font-normal">/ {q.points}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <Input
                                                                    type="number"
                                                                    min={0}
                                                                    max={q.points}
                                                                    className="pr-12"
                                                                    value={grade.points}
                                                                    onChange={(e) => handleGradeChange(q.id!, 'points', e.target.value)}
                                                                />
                                                                <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">/ {q.points}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="w-full space-y-1.5">
                                                        <Label className="text-xs">Nhận xét</Label>
                                                        {isReviewMode ? (
                                                            <div className="min-h-[80px] p-3 border rounded-md bg-muted/30 text-sm italic">
                                                                {grade.feedback || 'Không có nhận xét'}
                                                            </div>
                                                        ) : (
                                                            <Textarea
                                                                placeholder="Nhập nhận xét cho câu trả lời này..."
                                                                className="min-h-[80px] resize-none"
                                                                value={grade.feedback}
                                                                onChange={(e) => handleGradeChange(q.id!, 'feedback', e.target.value)}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}

                        <Card className="mt-8 border-primary/20 bg-primary/5 shadow-inner">
                            <CardHeader>
                                <CardTitle className="text-lg">Nhận xét chung</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isReviewMode ? (
                                    <div className="p-4 bg-background border rounded-lg italic text-muted-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">
                                        {teacherComment || 'Giáo viên chưa để lại nhận xét chung.'}
                                    </div>
                                ) : (
                                    <Textarea
                                        placeholder="Nhập nhận xét chung cho toàn bộ bài làm..."
                                        value={teacherComment}
                                        onChange={(e) => setTeacherComment(e.target.value)}
                                        rows={6}
                                        className="bg-background border-2 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex justify-end gap-3 z-50">
                    <div className="container mx-auto max-w-5xl flex justify-end gap-3">
                        <Button variant="outline" onClick={onBack} className="min-w-[100px]">
                            {isReviewMode ? "Quay lại" : "Hủy bỏ"}
                        </Button>
                        {!isReviewMode && (
                            <Button onClick={handleSaveGrade} disabled={isSubmitting} className="min-w-[150px]">
                                <Save className="mr-2 h-4 w-4" /> Lưu điểm
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
