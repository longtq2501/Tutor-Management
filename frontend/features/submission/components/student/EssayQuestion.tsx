import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Question } from '@/features/exercise-import/types/exercise.types';
import Image from 'next/image';
import React from 'react';

interface EssayQuestionProps {
    question: Question;
    essayText?: string;
    onTextChange: (text: string) => void;
}

export const EssayQuestion: React.FC<EssayQuestionProps> = ({
    question,
    essayText = '',
    onTextChange,
}) => {
    const wordCount = essayText.trim() ? essayText.trim().split(/\s+/).length : 0;

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

            <div className="space-y-4">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-transparent rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200" />
                    <Textarea
                        id={`essay-${question.id}`}
                        placeholder="Nhập câu trả lời của bạn tại đây..."
                        className="relative min-h-[300px] md:min-h-[400px] w-full p-6 text-base md:text-lg bg-card border-border/40 rounded-2xl shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary transition-all duration-300 resize-none font-normal leading-relaxed"
                        value={essayText}
                        onChange={(e) => onTextChange(e.target.value)}
                    />
                </div>

                <div className="flex justify-between items-center px-2">
                    <div className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                        {wordCount} từ
                    </div>
                </div>
            </div>
        </div>
    );
};
