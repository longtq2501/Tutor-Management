import { Badge } from '@/components/ui/badge';
import { Question } from '@/features/exercise-import/types/exercise.types';
import { cn } from '@/lib/utils';
import { CheckCircle2 } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

interface MCQQuestionProps {
    question: Question;
    selectedAnswer?: string;
    onAnswerChange: (answer: string) => void;
}

export const MCQQuestion: React.FC<MCQQuestionProps> = ({
    question,
    selectedAnswer,
    onAnswerChange,
}) => {
    return (
        <div className="w-full space-y-6">
            <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl md:text-2xl font-bold leading-tight tracking-tight text-foreground whitespace-pre-wrap break-words">
                        {question.questionText}
                    </h3>
                    <Badge variant="secondary" className="shrink-0 mt-1 px-3 py-1 text-sm font-bold bg-primary/10 text-primary border-primary/20">
                        {question.points} điểm
                    </Badge>
                </div>
                {question.imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-border/40 bg-muted/20">
                        <Image
                            src={question.imageUrl}
                            alt="Question illustration"
                            width={1200}
                            height={700}
                            className="w-full h-auto object-contain"
                        />
                    </div>
                )}
            </div>

            <div className="grid gap-3">
                {question.options?.map((option) => {
                    const isSelected = selectedAnswer === option.label;
                    return (
                        <div
                            key={option.label}
                            role="button"
                            tabIndex={0}
                            className={cn(
                                "group flex items-center p-5 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden",
                                isSelected
                                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                                    : "border-border/40 bg-card hover:border-primary/40 hover:bg-accent/50 hover:shadow-sm"
                            )}
                            onClick={() => onAnswerChange(option.label)}
                        >
                            {/* Selection indicator background */}
                            {isSelected && (
                                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                            )}

                            <div className={cn(
                                "flex-shrink-0 h-12 w-12 rounded-xl border flex items-center justify-center text-lg font-black mr-5 transition-colors",
                                isSelected
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted text-muted-foreground border-border group-hover:border-primary/30"
                            )}>
                                {option.label}
                            </div>

                            <div className="flex-grow">
                                <div className={cn(
                                    "text-base font-medium transition-colors",
                                    isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                )}>
                                    {option.optionText}
                                </div>
                            </div>

                            <div className="flex-shrink-0 ml-4">
                                {isSelected ? (
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center animate-in zoom-in duration-300">
                                        <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                ) : (
                                    <div className="h-6 w-6 rounded-full border-2 border-muted group-hover:border-primary/40 transition-colors" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
