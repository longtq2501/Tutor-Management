'use client';

import { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    GraduationCap,
    Layers,
    Clock,
    Users,
    MoreVertical,
    Edit3,
    Trash2,
    Play,
    Share2,
    Bookmark,
    ChevronRight,
    Sparkles,
    Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CourseDTO } from '../types';

interface EnhancedCourseCardProps {
    course: CourseDTO;
    onEdit?: (course: CourseDTO) => void;
    onDelete?: (course: CourseDTO) => void;
    onAssign?: (course: CourseDTO) => void;
    onPreview?: (course: CourseDTO) => void;
    onClick?: (course: CourseDTO) => void;
}

export const EnhancedCourseCard = memo(({
    course,
    onEdit,
    onDelete,
    onAssign,
    onPreview,
    onClick,
}: EnhancedCourseCardProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const getDifficultyColor = (level?: string) => {
        switch (level) {
            case 'BEGINNER': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'INTERMEDIATE': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
            case 'ADVANCED': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
        }
    };

    const getDifficultyLabel = (level?: string) => {
        switch (level) {
            case 'BEGINNER': return 'Cơ bản';
            case 'INTERMEDIATE': return 'Trung cấp';
            case 'ADVANCED': return 'Nâng cao';
            default: return level || 'Chưa xác định';
        }
    };

    // Mock gradient based on ID
    const gradients = [
        'from-indigo-600 via-blue-600 to-cyan-500',
        'from-purple-600 via-pink-600 to-rose-500',
        'from-emerald-600 via-teal-600 to-cyan-500',
        'from-amber-600 via-orange-600 to-rose-500',
    ];
    const gradient = gradients[course.id % gradients.length];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            whileHover={{ y: -8 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => onPreview?.(course)}
            className={cn(
                "group relative bg-card rounded-[2rem] border-2 border-border/50 overflow-hidden cursor-pointer",
                "transition-all duration-500 ease-out",
                "hover:border-primary/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
                "h-full flex flex-col"
            )}
        >
            {/* Top Section - Visual & Badges */}
            <div className="relative aspect-[16/10] overflow-hidden shrink-0 bg-slate-100">
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-br transition-opacity duration-700 z-10 opacity-60",
                    isHovered ? "opacity-40" : "opacity-60",
                    "from-slate-900 via-slate-900/40 to-transparent"
                )} />

                {/* Decorative Pattern */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] z-0">
                    <GraduationCap className="w-48 h-48 rotate-12" />
                </div>

                {/* Image or Placeholder */}
                <div className="absolute inset-0 z-0">
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center">
                        <motion.div
                            animate={isHovered ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                            transition={{ duration: 0.7 }}
                        >
                            <Sparkles className="w-16 h-16 text-primary/20" />
                        </motion.div>
                    </div>
                </div>

                {/* Badges Overlay */}
                <div className="absolute top-5 left-5 right-5 z-20 flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                        <Badge className={cn(
                            "w-fit px-3 py-1 rounded-full border-0 font-bold text-[10px] uppercase tracking-wider backdrop-blur-md",
                            getDifficultyColor(course.difficultyLevel)
                        )}>
                            {getDifficultyLabel(course.difficultyLevel)}
                        </Badge>
                        <Badge className="w-fit px-3 py-1 bg-white/10 backdrop-blur-md text-white border-white/20 font-bold text-[10px] uppercase tracking-wider rounded-full">
                            <Layers className="w-3 h-3 mr-1.5" />
                            {course.lessonCount || 0} bài học
                        </Badge>
                    </div>

                    <div className="flex flex-col gap-2 items-end">
                        <Button
                            size="icon"
                            variant="secondary"
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border-white/20 text-white shadow-xl transition-all"
                            onClick={(e) => {
                                e.stopPropagation();
                                onPreview?.(course);
                            }}
                        >
                            <Eye className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Action Indicator */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-5 left-5 z-20"
                        >
                            <div className="px-4 py-2 bg-white rounded-full flex items-center gap-2 shadow-2xl">
                                <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Chi tiết lộ trình</span>
                                <ChevronRight className="w-4 h-4 text-primary" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Content Section */}
            <div className="p-6 flex flex-col flex-1 space-y-4">
                <div className="space-y-2 flex-1">
                    <h3 className="text-xl font-black text-foreground leading-[1.1] tracking-tight group-hover:text-primary transition-colors duration-300">
                        {course.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-medium italic">
                        {course.description || "Khóa học chưa có mô tả chi tiết."}
                    </p>
                </div>

                {/* Info Bar */}
                <div className="flex items-center gap-4 py-3 border-y border-border/50">
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Thời lượng</span>
                        <div className="flex items-center gap-1.5 text-foreground font-black">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm">{course.estimatedHours}h</span>
                        </div>
                    </div>
                    <div className="w-px h-6 bg-border/50" />
                    <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Học viên</span>
                        <div className="flex items-center gap-1.5 text-foreground font-black">
                            <Users className="w-3.5 h-3.5 text-primary" />
                            <span className="text-sm">0</span>
                        </div>
                    </div>
                </div>

                {/* Hover Buttons Footer */}
                <div className="flex items-center justify-between gap-3 pt-2">
                    <Button
                        variant="outline"
                        className="flex-1 rounded-2xl border-2 font-bold hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAssign?.(course);
                        }}
                    >
                        Giao bài
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="secondary" size="icon" className="w-10 h-10 rounded-2xl shrink-0">
                                <MoreVertical className="w-5 h-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl border-2 shadow-2xl">
                            <DropdownMenuLabel className="font-black text-xs uppercase tracking-widest text-muted-foreground/60 px-3 py-2">Thao tác nhanh</DropdownMenuLabel>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPreview?.(course);
                                }}
                                className="rounded-xl px-3 py-2.5 cursor-pointer font-bold"
                            >
                                <Eye className="w-4 h-4 mr-3 text-blue-500" />
                                Xem bản học viên
                                <Sparkles className="w-3 h-3 ml-auto text-amber-500" />
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit?.(course);
                                }}
                                className="rounded-xl px-3 py-2.5 cursor-pointer font-bold"
                            >
                                <Edit3 className="w-4 h-4 mr-3 text-emerald-500" />
                                Chỉnh sửa lộ trình
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem
                                className="text-destructive rounded-xl px-3 py-2.5 cursor-pointer font-bold focus:bg-destructive/10 focus:text-destructive"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete?.(course);
                                }}
                            >
                                <Trash2 className="w-4 h-4 mr-3" />
                                Xóa khóa học
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Premium Decorative Orb */}
            <div className="absolute -right-8 -top-8 w-20 h-20 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500" />
        </motion.div>
    );
});
EnhancedCourseCard.displayName = 'EnhancedCourseCard';
