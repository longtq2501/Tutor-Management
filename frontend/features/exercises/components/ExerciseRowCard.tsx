'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar, Clock, Trophy, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ExerciseListItemResponse } from '@/features/exercise-import/types/exercise.types';

interface ExerciseRowCardProps {
    exercise: ExerciseListItemResponse;
    onClick: () => void;
    label?: string;
    showScore?: boolean;
    disabled?: boolean;
    action?: {
        label: string;
        onClick: () => void;
        disabled?: boolean;
        tooltip?: string;
    };
}

/**
 * A horizontal row-style card representing an individual exercise assignment.
 * Displays title, metadata, and status in a balanced row layout.
 */
export const ExerciseRowCard: React.FC<ExerciseRowCardProps> = ({
    exercise,
    onClick,
    label,
    showScore,
    disabled,
    action
}) => {
    const isOverdue = exercise.deadline && new Date(exercise.deadline) < new Date() && !exercise.submissionStatus;

    return (
        <motion.div
            whileHover={disabled ? {} : { x: 4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn("w-full group", !disabled && "cursor-pointer")}
            onClick={disabled ? undefined : onClick}
        >
            <Card className="border-muted/50 hover:border-primary/30 transition-all hover:shadow-md bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row sm:items-center min-h-[80px]">
                        {/* Left accent */}
                        <div className={cn(
                            "hidden sm:block w-1 self-stretch",
                            exercise.submissionStatus === 'GRADED' ? "bg-green-500" :
                                exercise.submissionStatus === 'SUBMITTED' ? "bg-blue-500" :
                                    exercise.submissionStatus === 'DRAFT' ? "bg-sky-400" : "bg-orange-400"
                        )} />

                        <div className="p-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            {/* Title and Metadata */}
                            <div className="flex-1 space-y-2">
                                <h4 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
                                    {exercise.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-medium">
                                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Hạn: {exercise.deadline ? format(new Date(exercise.deadline), 'dd/MM/yyyy') : 'N/A'}
                                    </span>
                                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded">
                                        <Clock className="h-3.5 w-3.5" />
                                        {exercise.timeLimit} phút
                                    </span>
                                </div>
                            </div>

                            {/* Status and Points/Actions */}
                            <div className="flex items-center justify-between md:justify-end gap-6 min-w-[140px]">
                                {showScore && exercise.studentTotalScore !== undefined ? (
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-green-600 leading-none">
                                                {exercise.studentTotalScore}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-semibold">
                                                /{exercise.totalPoints}
                                            </span>
                                            <Trophy className="h-4 w-4 text-yellow-500" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1">Trạng thái</p>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] font-bold h-6 px-2 shrink-0 border-2",
                                            isOverdue ? "border-red-500/50 text-red-600 bg-red-50/50" :
                                                exercise.submissionStatus === 'GRADED' ? "border-green-500/50 text-green-600 bg-green-50/50" :
                                                    exercise.submissionStatus === 'SUBMITTED' ? "border-blue-500/50 text-blue-600 bg-blue-50/50" :
                                                        "border-orange-500/50 text-orange-600 bg-orange-50/50"
                                        )}>
                                            {isOverdue ? 'Quá hạn' : label || (exercise.submissionStatus === 'GRADED' ? 'Đã chấm' : 'Chờ làm')}
                                        </Badge>
                                    </div>
                                )}

                                {!disabled && (
                                    <div className="hidden sm:flex h-8 w-8 rounded-full items-center justify-center bg-muted group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                        <ChevronRight className="h-4 w-4" />
                                    </div>
                                )}

                                {action && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={action.disabled}
                                                    className="h-8 text-xs font-semibold"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        action.onClick();
                                                    }}
                                                >
                                                    {action.label}
                                                </Button>
                                            </TooltipTrigger>
                                            {action.tooltip && (
                                                <TooltipContent side="top" variant="destructive">
                                                    {action.tooltip}
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                )}

                                {disabled && (
                                    <span className="text-[10px] text-muted-foreground italic sm:min-w-[80px] text-right">
                                        Chưa làm
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
};
