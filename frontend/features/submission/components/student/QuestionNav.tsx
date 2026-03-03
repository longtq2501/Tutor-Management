import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Question } from '@/features/exercise-import/types/exercise.types';
import { cn } from '@/lib/utils';
import React from 'react';

interface QuestionNavProps {
    questions: Question[];
    currentIndex: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    answers: Map<string, any>; // Using Map to detect if answered
    onQuestionClick: (index: number) => void;
}

export const QuestionNav: React.FC<QuestionNavProps> = ({
    questions,
    currentIndex,
    answers,
    onQuestionClick,
}) => {
    // Calculate stats
    const answeredCount = questions.filter(q => {
        // If it's a map (submission context) or object (local state) - need to handle both if generic
        // But here we receive a Map as per prompt request 4.2
        // Wait, prompt said "answers (Map<questionId, answer>)" for ExercisePlayer state.
        // So here I check if map has key.

        // Fallback if answers is not a map (just in case)
        if (answers instanceof Map) {
            return answers.has(q.id || `temp-${q.orderIndex}`);
        }
        return false;
    }).length;

    const progress = Math.round((answeredCount / questions.length) * 100);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Progress</span>
                <span className="text-muted-foreground">
                    {answeredCount}/{questions.length} ({progress}%)
                </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-300 ease-in-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <ScrollArea className="max-h-[300px]">
                <div className="grid grid-cols-5 gap-2 pr-2">
                    {questions.map((q, idx) => {
                        const isAnswered = answers instanceof Map && answers.has(q.id || `temp-${q.orderIndex}`);
                        const isCurrent = idx === currentIndex;

                        return (
                            <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "h-10 w-full p-0 font-medium transition-colors relative",
                                    isCurrent && "border-primary ring-1 ring-primary",
                                    isAnswered && !isCurrent && "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800",
                                )}
                                onClick={() => onQuestionClick(idx)}
                            >
                                {idx + 1}
                                {isAnswered && (
                                    <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-blue-500" />
                                )}
                            </Button>
                        );
                    })}
                </div>
            </ScrollArea>

            <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border rounded bg-white"></div>
                    <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-blue-200 bg-blue-50 rounded"></div>
                    <span>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border border-primary rounded ring-1 ring-primary bg-white"></div>
                    <span>Current</span>
                </div>
            </div>
        </div>
    );
};
