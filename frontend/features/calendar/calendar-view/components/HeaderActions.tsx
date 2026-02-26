"use client";

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Info, Sparkles } from 'lucide-react';
import { LESSON_STATUS_LABELS, type LessonStatus } from '@/lib/types/lesson-status';
import { getStatusColors } from '../utils/statusColors';
import { cn } from '@/lib/utils';

interface HeaderActionsProps {
    onAddSession: () => void;
    onGenerateInvoice: () => void;
    onAutoGenerate: () => void;
    onDeleteMonth: () => void;
    isGenerating: boolean;
    sessionsCount: number;
}
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

export function HeaderActions({
    onAddSession,
    onGenerateInvoice,
    onAutoGenerate,
    onDeleteMonth,
    isGenerating,
    sessionsCount,
}: HeaderActionsProps) {
    return (
        <div className="flex items-center gap-2">
            <Button size="sm" className="h-10 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-widest text-[10px] px-4 sm:px-6 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all" onClick={onAddSession}>
                <Plus className="w-4 h-4 sm:mr-2" strokeWidth={3} />
                <span className="hidden sm:inline">Tiết học mới</span>
                <span className="sm:hidden">Thêm</span>
            </Button>

            <TooltipProvider>
                <Tooltip delayDuration={300}>
                    <Popover>
                        <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl border-border/40 hover:bg-muted/50">
                                    <Info size={16} />
                                </Button>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Chú thích</p>
                        </TooltipContent>
                        <PopoverContent className="w-64 p-6 rounded-[2rem] border-border/60 shadow-2xl" align="end">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Chú thích màu sắc</p>
                                <div className="grid gap-3">
                                    {Object.entries(LESSON_STATUS_LABELS).map(([status, label]) => {
                                        const colors = getStatusColors(status as LessonStatus);
                                        return (
                                            <div key={status} className="flex items-center gap-3 group">
                                                <div className={cn("w-3 h-3 rounded-full transition-transform group-hover:scale-125", colors.dot)} />
                                                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="pt-4 mt-4 border-t border-border/40 space-y-2">
                                    <Button variant="ghost" size="sm" className="w-full justify-start h-10 rounded-xl px-3 font-black uppercase tracking-widest text-[10px] text-muted-foreground" onClick={onGenerateInvoice} disabled={isGenerating}>
                                        {isGenerating ? "Đang xử lý..." : "Chi tiết doanh thu"}
                                    </Button>

                                    {sessionsCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start h-10 rounded-xl px-3 font-black uppercase tracking-widest text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            onClick={onDeleteMonth}
                                            disabled={isGenerating}
                                        >
                                            Xóa tất cả buổi học
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </Tooltip>
            </TooltipProvider>

            {sessionsCount === 0 && (
                <Button size="sm" onClick={onAutoGenerate} disabled={isGenerating} className="h-10 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 font-bold text-[10px] px-4 hidden sm:flex">
                    <Sparkles size={14} className="mr-2" />
                    {isGenerating ? "Đang tạo..." : "Tạo lịch tự động"}
                </Button>
            )}
        </div>
    );
}
