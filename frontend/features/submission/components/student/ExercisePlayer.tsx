import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { exerciseService } from '@/features/exercise-import/services/exerciseService';
import { Exercise, QuestionType } from '@/features/exercise-import/types/exercise.types';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Save, Menu } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { submissionService } from '../../services/submissionService';
import { CreateSubmissionRequest, SubmissionResponse } from '../../types/submission.types';
import { EssayQuestion } from './EssayQuestion';
import { MCQQuestion } from './MCQQuestion';
import { QuestionNav } from './QuestionNav';
import { useAutoSave } from '../../hooks/useAutoSave';
import { GradingView } from '../teacher/GradingView';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn, formatExerciseTitle } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/hooks/useQueryKeys';

interface ExercisePlayerProps {
    exerciseId: string;
    studentId?: string;
    onExit?: () => void;
}

export const ExercisePlayer: React.FC<ExercisePlayerProps> = ({ exerciseId, studentId, onExit }) => {
    const queryClient = useQueryClient();
    const [exercise, setExercise] = useState<Exercise | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Map<string, { selectedOption?: string; essayText?: string }>>(new Map());
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null);
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);

    // Auto-save hook (Must be at top level, not conditional)
    const { isSaving, lastSaved } = useAutoSave(exerciseId, answers);

    // Fetch exercise and existing submission
    useEffect(() => {
        const fetchData = async () => {
            try {
                const exerciseData = await exerciseService.getById(exerciseId);
                setExercise(exerciseData);

                if (exerciseData.timeLimit) {
                    // TODO: Calculate remaining time based on start time if already started
                    // For now, simple reset
                    setTimeLeft(exerciseData.timeLimit * 60);
                }

                // Try load draft if studentId is present
                if (studentId) {
                    try {
                        const submission = await submissionService.getByExerciseAndStudent(exerciseId, studentId);
                        if (submission) {
                            // Rehydrate answers
                            const answerMap = new Map();
                            submission.answers.forEach(a => {
                                answerMap.set(a.questionId, {
                                    selectedOption: a.selectedOption,
                                    essayText: a.essayText
                                });
                            });
                            setAnswers(answerMap);
                            if (submission.status === 'SUBMITTED' || submission.status === 'GRADED') {
                                setSubmissionResult(submission);
                            }
                        }
                    } catch (e) {
                        // No submission found, ignore
                    }
                }
            } catch (err) {
                toast.error("Error", {
                    description: "Failed to load exercise"
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [exerciseId, studentId]);

    // Timer
    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0 || submissionResult) return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, submissionResult]);

    // Auto-submit on timeout
    useEffect(() => {
        if (timeLeft === 0 && !submissionResult && !isSubmitting) {
            handleSubmit();
            toast.warning("Hết giờ!", {
                description: "Bài làm của bạn đã được tự động nộp."
            });
        }
    }, [timeLeft, submissionResult, isSubmitting]);

    const handleAnswerChange = (questionId: string, value: { selectedOption?: string; essayText?: string }) => {
        const newAnswers = new Map(answers);
        const current = newAnswers.get(questionId) || {};
        newAnswers.set(questionId, { ...current, ...value });
        setAnswers(newAnswers);
    };

    const handleSaveDraft = async () => {
        if (!exercise) return;
        try {
            const request: CreateSubmissionRequest = {
                exerciseId: exercise.id,
                answers: Array.from(answers.entries()).map(([qId, val]) => ({
                    questionId: qId,
                    ...val
                }))
            };
            await submissionService.saveDraft(request);
            toast("Lưu nháp thành công", {
                description: "Tiến độ của bạn đã được lưu."
            });
        } catch (e) {
            toast.error("Lỗi", {
                description: "Không thể lưu nháp"
            });
        }
    };

    const handleSubmit = async () => {
        if (!exercise) return;
        setIsSubmitting(true);
        try {
            const request: CreateSubmissionRequest = {
                exerciseId: exercise.id,
                answers: Array.from(answers.entries()).map(([qId, val]) => ({
                    questionId: qId,
                    ...val
                }))
            };
            const result = await submissionService.submit(request);
            setSubmissionResult(result);
            await queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
            toast.success("Nộp bài thành công!", {
                description: result.status === 'GRADED'
                    ? `Bạn đạt ${result.totalScore} điểm.`
                    : `Bạn đạt ${result.mcqScore} điểm trắc nghiệm.`
            });
        } catch (e) {
            toast.error("Lỗi", {
                description: "Không thể nộp bài"
            });
            setIsSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) return (
        <div className="flex justify-center items-center h-screen bg-background">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );
    if (!exercise) return <div className="p-8 text-center text-muted-foreground">Không tìm thấy bài tập</div>;

    if (submissionResult) {
        if (isReviewing) {
            return (
                <div className="min-h-screen bg-background pt-8 px-4">
                    <GradingView
                        submissionId={submissionResult.id}
                        onBack={() => setIsReviewing(false)}
                        isReviewMode={true}
                    />
                </div>
            );
        }

        return (
            <div className="flex flex-col justify-center items-center min-h-screen relative bg-background overflow-y-auto py-8 px-4">
                {/* Background orbs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-green-500/10 blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-green-500/10 blur-[120px]" />
                </div>

                <Card className="max-w-2xl w-full shadow-2xl border-2 border-primary/20 bg-card/80 backdrop-blur-xl relative z-10 transition-all duration-700 animate-in zoom-in-95">
                    <CardContent className="pt-12 pb-10 text-center space-y-8">
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl animate-pulse" />
                            <div className="h-28 w-28 rounded-full bg-green-500 flex items-center justify-center relative z-10 shadow-lg shadow-green-500/20">
                                <CheckCircle className="h-16 w-16 text-white" />
                            </div>
                        </div>

                        <div>
                            <h2 className="text-4xl font-black tracking-tighter mb-3 bg-gradient-to-br from-foreground to-foreground/60 bg-clip-text text-transparent italic">HOÀN THÀNH!</h2>
                            <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-xs">Bài làm của bạn đã được hệ thống ghi nhận</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 px-4">
                            <div className="p-5 bg-card border rounded-3xl shadow-sm group hover:border-primary/40 transition-all duration-300">
                                <div className="text-[10px] uppercase font-black text-muted-foreground mb-2 tracking-widest">Trắc nghiệm</div>
                                <div className="text-4xl font-black text-primary">{submissionResult.mcqScore || 0}</div>
                            </div>
                            <div className="p-5 bg-card border rounded-3xl shadow-sm group hover:border-yellow-500/40 transition-all duration-300">
                                <div className="text-[10px] uppercase font-black text-muted-foreground mb-2 tracking-widest">Tự luận</div>
                                <div className="text-4xl font-black text-yellow-600 dark:text-yellow-500">
                                    {submissionResult.status === 'GRADED' ? (submissionResult.essayScore || 0) : '?'}
                                </div>
                            </div>
                            <div className="p-5 bg-card border rounded-3xl shadow-sm group hover:border-foreground/40 transition-all duration-300 border-primary/10">
                                <div className="text-[10px] uppercase font-black text-muted-foreground mb-2 tracking-widest italic font-serif">Tổng điểm</div>
                                <div className="text-4xl font-black text-foreground">
                                    {submissionResult.totalScore || submissionResult.mcqScore}
                                </div>
                            </div>
                        </div>

                        {submissionResult.status !== 'GRADED' && (
                            <div className="bg-primary/5 text-primary/80 p-4 rounded-2xl text-xs font-medium border border-primary/10 max-w-md mx-auto leading-relaxed">
                                Các câu hỏi tự luận sẽ được giáo viên chấm điểm sau. Bạn sẽ nhận được thông báo ngay khi có kết quả.
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button onClick={onExit} size="lg" variant="outline" className="flex-1 h-14 rounded-2xl font-bold border-border/60">
                                Quay về trang chủ
                            </Button>
                            <Button onClick={() => setIsReviewing(true)} size="lg" className="flex-1 h-14 rounded-2xl font-black bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                Xem chi tiết bài làm
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const currentQuestion = exercise.questions?.[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / (exercise.questions?.length || 1)) * 100;
    const answeredCount = answers.size;
    const totalCount = exercise.questions?.length || 0;

    return (
        <div className="flex h-screen overflow-hidden bg-background relative">
            {/* Background elements for premium feel */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b bg-card/80 backdrop-blur-md z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                    <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-80">
                            <div className="flex flex-col h-full bg-card">
                                <SidebarContent
                                    exercise={exercise}
                                    currentQuestionIndex={currentQuestionIndex}
                                    setCurrentQuestionIndex={(idx: number) => {
                                        setCurrentQuestionIndex(idx);
                                        setIsMobileNavOpen(false);
                                    }}
                                    timeLeft={timeLeft}
                                    isSaving={isSaving}
                                    onSaveDraft={() => { handleSaveDraft(); setIsMobileNavOpen(false); }}
                                    onSubmit={() => { handleSubmit(); setIsMobileNavOpen(false); }}
                                    isSubmitting={isSubmitting}
                                    answers={answers}
                                />
                            </div>
                        </SheetContent>
                    </Sheet>
                    <h2 className="font-bold text-base whitespace-pre-wrap line-clamp-1 max-w-[180px] leading-tight text-foreground">
                        {formatExerciseTitle(exercise.title)}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold border",
                        timeLeft && timeLeft < 300 ? "bg-red-500/10 text-red-600 border-red-500/20 animate-pulse shadow-sm shadow-red-500/10" : "bg-primary/5 text-primary border-primary/20 shadow-sm shadow-primary/5"
                    )}>
                        <Clock className="h-3.5 w-3.5" />
                        {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                    </div>
                </div>
            </div>

            {/* Desktop Sidebar (Left) */}
            <div className="hidden md:flex w-80 border-r bg-card/40 backdrop-blur-xl flex-col shrink-0 h-full relative z-20">
                <SidebarContent
                    exercise={exercise}
                    currentQuestionIndex={currentQuestionIndex}
                    setCurrentQuestionIndex={setCurrentQuestionIndex}
                    timeLeft={timeLeft}
                    isSaving={isSaving}
                    onSaveDraft={handleSaveDraft}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                    answers={answers}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 h-full md:pt-0 pt-16 relative z-10">
                <div data-testid="scroll-container" className="flex-1 min-h-0 overflow-y-auto px-4 py-8 md:px-12 md:py-16 custom-scrollbar">
                    <div className="max-w-4xl mx-auto flex flex-col min-h-0">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuestionIndex}
                                initial={{ opacity: 0, scale: 0.98, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.98, x: -20 }}
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                                className="flex-1 flex flex-col min-h-0"
                            >
                                {/* Question Header Overlay (Desktop) */}
                                <div className="hidden md:flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/20">
                                            {currentQuestionIndex + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Câu hỏi hiện tại</h4>
                                            <div className="text-xs text-muted-foreground/60">Phần {currentQuestion?.type === QuestionType.MCQ ? 'Trắc nghiệm' : 'Tự luận'}</div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="px-4 py-1.5 rounded-full border-primary/20 text-primary font-bold bg-primary/5">
                                        {currentQuestionIndex + 1} / {exercise.questions?.length || 0}
                                    </Badge>
                                </div>

                                <div className="flex-1 flex items-center justify-center -mt-8 md:-mt-0">
                                    <div className="w-full">
                                        {exercise?.questions?.[currentQuestionIndex]?.type === QuestionType.MCQ ? (
                                            <MCQQuestion
                                                question={exercise.questions[currentQuestionIndex]}
                                                selectedAnswer={answers.get(exercise.questions[currentQuestionIndex].id || '')?.selectedOption}
                                                onAnswerChange={(val) => handleAnswerChange(exercise.questions![currentQuestionIndex].id || '', { selectedOption: val })}
                                            />
                                        ) : exercise?.questions?.[currentQuestionIndex] ? (
                                            <EssayQuestion
                                                question={exercise.questions[currentQuestionIndex]}
                                                essayText={answers.get(exercise.questions[currentQuestionIndex].id || '')?.essayText || ''}
                                                onTextChange={(val) => handleAnswerChange(exercise.questions![currentQuestionIndex].id || '', { essayText: val })}
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Desktop Navigation Buttons */}
                        <div className="hidden md:flex justify-between items-center mt-12 mb-8 pt-8 border-t border-border/40">
                            <Button
                                variant="ghost"
                                size="lg"
                                disabled={currentQuestionIndex === 0}
                                onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                className="px-8 rounded-2xl hover:bg-accent hover:text-foreground transition-all flex items-center gap-3 font-bold group"
                            >
                                <div className="h-8 w-8 rounded-lg border flex items-center justify-center group-hover:border-primary/40 group-hover:text-primary transition-colors">
                                    <ArrowLeft className="h-4 w-4" />
                                </div>
                                Câu trước
                            </Button>

                            <div className="flex gap-4">
                                {currentQuestionIndex < (exercise.questions?.length || 0) - 1 ? (
                                    <Button
                                        size="lg"
                                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                        className="px-10 rounded-2xl bg-foreground text-background hover:bg-foreground/90 transition-all font-bold flex items-center gap-3 h-14"
                                    >
                                        Câu tiếp theo
                                        <div className="h-8 w-8 rounded-lg bg-background/10 flex items-center justify-center">
                                            <ArrowRight className="h-4 w-4" />
                                        </div>
                                    </Button>
                                ) : (
                                    <Button
                                        size="lg"
                                        className="px-10 rounded-2xl bg-green-600 hover:bg-green-700 text-white transition-all font-bold flex items-center gap-3 h-14 shadow-lg shadow-green-500/20"
                                        onClick={handleSubmit}
                                        disabled={isSubmitting}
                                    >
                                        Nộp bài thi
                                        <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                                            <CheckCircle className="h-4 w-4" />
                                        </div>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Navigation Footer (Mobile) */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t p-4 flex gap-3 z-30">
                    <Button
                        variant="outline"
                        className="flex-1 h-12 rounded-xl text-sm font-bold"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Trước
                    </Button>

                    {currentQuestionIndex < (exercise.questions?.length || 0) - 1 ? (
                        <Button
                            className="flex-1 h-12 rounded-xl text-sm font-bold bg-foreground text-background hover:bg-foreground/90"
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                        >
                            Tiếp theo <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            className="flex-1 h-12 rounded-xl text-sm font-bold bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            Nộp bài <CheckCircle className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

interface SidebarContentProps {
    exercise: Exercise;
    currentQuestionIndex: number;
    setCurrentQuestionIndex: (idx: number) => void;
    timeLeft: number | null;
    isSaving: boolean;
    onSaveDraft: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
    answers: Map<string, { selectedOption?: string; essayText?: string }>;
}

const SidebarContent = ({
    exercise,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    timeLeft,
    isSaving,
    onSaveDraft,
    onSubmit,
    isSubmitting,
    answers
}: SidebarContentProps) => {
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="p-8 border-b border-border/40 bg-card/10">
                <div className="flex flex-col gap-6">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black tracking-tight text-foreground">Làm bài tập</h2>
                        <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-widest italic">{isSaving ? "Tự động lưu..." : "Đã lưu bản nháp"}</p>
                    </div>

                    <div className={cn(
                        "flex items-center justify-center gap-3 px-4 py-4 rounded-2xl text-2xl font-mono font-black transition-all duration-500 border-2",
                        timeLeft && timeLeft < 300
                            ? "bg-red-500/10 text-red-600 border-red-500/20 animate-pulse shadow-lg shadow-red-500/10"
                            : "bg-primary/5 text-primary border-primary/10 shadow-lg shadow-primary/5"
                    )}>
                        <Clock className={cn("h-6 w-6", timeLeft && timeLeft < 300 ? "animate-bounce" : "")} />
                        {timeLeft !== null ? formatTimeHelper(timeLeft) : '--:--'}
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-muted-foreground uppercase">Tiến độ</span>
                            <span className="text-sm font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                                {Math.round((currentQuestionIndex + 1) / (exercise.questions?.length || 1) * 100)}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentQuestionIndex + 1) / (exercise.questions?.length || 1)) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="mb-4 flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Danh sách câu hỏi</span>
                    <span className="text-[10px] text-muted-foreground/40">{exercise.questions?.length} câu</span>
                </div>
                <QuestionNav
                    questions={exercise.questions || []}
                    currentIndex={currentQuestionIndex}
                    answers={answers}
                    onQuestionClick={setCurrentQuestionIndex}
                />
            </div>

            <div className="p-6 border-t border-border/40 bg-card/20 space-y-3 mt-auto flex-shrink-0">
                <Button
                    variant="outline"
                    className="w-full justify-center h-12 font-bold rounded-2xl border-border/60 hover:bg-accent hover:border-primary/20 transition-all"
                    onClick={onSaveDraft}
                >
                    <Save className="mr-2 h-4 w-4" /> Lưu nháp
                </Button>
                <Button
                    className="w-full bg-primary hover:bg-primary/90 h-14 font-black text-lg rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                >
                    <CheckCircle className="mr-2 h-6 w-6" /> NỘP BÀI THI
                </Button>
            </div>
        </div>
    );
};

const formatTimeHelper = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
