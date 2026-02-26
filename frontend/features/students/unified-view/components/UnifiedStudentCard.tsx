import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Student } from '@/lib/types';
import { cn, formatCurrency } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    Calendar,
    CalendarClock,
    ChevronDown,
    Edit2,
    Eye,
    Mail,
    Phone,
    Plus,
    UserCircle,
    Banknote
} from 'lucide-react';
import { memo, useState } from 'react';
import { OptimizedAvatar } from './OptimizedAvatar';

interface UnifiedStudentCardProps {
    student: Student;
    onViewSchedule: (student: Student) => void;
    onAddSession: (student: Student) => void;
    onEdit?: (student: Student) => void;
    onViewDetails?: (student: Student) => void;
}

export const UnifiedStudentCard = memo(function UnifiedStudentCard({
    student,
    onViewSchedule,
    onAddSession,
    onEdit,
    onViewDetails
}: UnifiedStudentCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            layout
            className={cn(
                "group relative overflow-hidden",
                "rounded-2xl border-2 shadow-lg",
                "transition-all duration-300",
                "will-change-transform contain-layout", // GPU Acceleration & Optimization
                student.active
                    ? "bg-gradient-to-br from-card via-card to-primary/5 dark:to-primary/10 border-primary/30 dark:border-primary/40 hover:border-primary/60 dark:hover:border-primary/70 hover:shadow-2xl hover:shadow-primary/20 dark:hover:shadow-primary/30"
                    : "bg-card border-border/40 dark:border-border/30 hover:border-border/60 hover:shadow-xl opacity-80 hover:opacity-90"
            )}
        >
            {/* Top Accent Bar */}
            {student.active && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 dark:from-primary/80 dark:via-primary dark:to-primary/80" />
            )}

            {/* Card Header */}
            <div className="p-4 sm:p-6 space-y-4">
                {/* Student Info Row */}
                <div className="flex items-start gap-3 sm:gap-4">
                    {/* Avatar with subtle glow */}
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="flex-shrink-0 relative"
                    >
                        {student.active && (
                            <div className="absolute inset-0 bg-primary/15 dark:bg-primary/25 blur-xl rounded-full" />
                        )}
                        <div className="relative">
                            <OptimizedAvatar name={student.name} isActive={student.active} />
                        </div>
                    </motion.div>

                    {/* Name & Status */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-col items-start gap-2">
                            <h3 className="font-bold text-lg sm:text-xl leading-tight">
                                {student.name}
                            </h3>

                            <div className="flex items-center gap-1.5 sm:gap-1 shrink-0 font-medium">
                                <Badge
                                    variant={student.active ? "default" : "secondary"}
                                    className={cn(
                                        "flex-shrink-0",
                                        student.active
                                            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/40 hover:bg-emerald-100 dark:hover:bg-emerald-500/25"
                                            : "bg-gray-100 dark:bg-gray-500/15 text-gray-600 dark:text-gray-400 border border-gray-500/20 dark:border-gray-500/30 hover:bg-gray-100 dark:hover:bg-gray-500/20"
                                    )}
                                >
                                    ● {student.active ? "Đang học" : "Đã nghỉ"}
                                </Badge>

                                {onEdit && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit(student); }}
                                        className="p-1.5 text-muted-foreground hover:text-primary bg-muted/50 dark:bg-muted/30 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-full transition-all shadow-sm border border-transparent hover:border-primary/30 dark:hover:border-primary/40"
                                        title="Chỉnh sửa thông tin"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                )}

                                {onViewDetails && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onViewDetails(student); }}
                                        className="p-1.5 text-muted-foreground hover:text-indigo-600 bg-muted/50 dark:bg-muted/30 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-full transition-all shadow-sm border border-transparent hover:border-indigo-300 dark:hover:border-indigo-800"
                                        title="Xem chi tiết hồ sơ"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Parent Info (Collapsible) */}
                        {student.parent && (
                            <motion.button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className={cn(
                                    "flex items-center gap-2 mt-2 text-sm text-muted-foreground",
                                    "hover:text-foreground transition-colors",
                                    "group/parent"
                                )}
                            >
                                <UserCircle className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{student.parent.name}</span>
                                <ChevronDown className={cn(
                                    "w-4 h-4 transition-transform flex-shrink-0",
                                    isExpanded && "rotate-180"
                                )} />
                            </motion.button>
                        )}
                    </div>
                </div>

                {/* Parent Details (Expandable) */}
                <AnimatePresence>
                    {isExpanded && student.parent && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="pt-3 border-t border-border/50 dark:border-border/30 space-y-2 text-sm">
                                {student.parent.email && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="w-4 h-4 flex-shrink-0 text-primary/70 dark:text-primary/80" />
                                        <span className="truncate">{student.parent.email}</span>
                                    </div>
                                )}
                                {student.parent.phone && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="w-4 h-4 flex-shrink-0 text-primary/70 dark:text-primary/80" />
                                        <span>{student.parent.phone}</span>
                                    </div>
                                )}
                                {student.parent.notes && (
                                    <p className="text-muted-foreground text-xs italic">
                                        {student.parent.notes}
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Schedule & Rate - Enhanced colors */}
                <div className="grid grid-cols-1 gap-2 pt-3 border-t border-border/50 dark:border-border/30">
                    {/* Hourly Rate */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/15 border border-primary/20 dark:border-primary/30">
                        <Banknote className="w-4 h-4 text-primary dark:text-primary" />
                        <span className="text-sm font-semibold">
                            {Intl.NumberFormat('vi-VN').format(student.pricePerHour || 0)}/giờ
                        </span>
                    </div>

                    {/* Schedule */}
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500/5 to-blue-500/10 dark:from-blue-500/10 dark:to-blue-500/15 border border-blue-500/20 dark:border-blue-500/30">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium truncate">
                            {student.schedule}
                        </span>
                    </div>
                </div>

                {/* Debt Display - More prominent colors */}
                {student.totalUnpaidTaught > 0 && (
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        className={cn(
                            "flex items-center justify-between",
                            "px-4 py-3 rounded-xl",
                            "bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20",
                            "border-2 border-red-200 dark:border-red-800/50",
                            "shadow-md shadow-red-500/10 dark:shadow-red-500/20"
                        )}
                    >
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-medium text-red-700 dark:text-red-400">
                                Đang nợ
                            </span>
                        </div>
                        <span className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums">
                            {Intl.NumberFormat('vi-VN').format(student.totalUnpaidTaught || 0)}
                        </span>
                    </motion.div>
                )}
            </div>

            {/* Action Buttons - Enhanced colors */}
            <div className="px-4 pb-4 sm:px-6 sm:pb-6 flex gap-2 sm:gap-3">
                <Button
                    variant="outline"
                    className="flex-1 gap-2 border-2 hover:border-primary/50 dark:hover:border-primary/60 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
                    onClick={() => onViewSchedule(student)}
                >
                    <CalendarClock className="w-4 h-4" />
                    Lịch
                </Button>

                <Button
                    className={cn(
                        "flex-1 gap-2",
                        "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80",
                        "shadow-lg shadow-primary/25 dark:shadow-primary/30",
                        "hover:shadow-xl hover:shadow-primary/30 dark:hover:shadow-primary/40",
                        "transition-all",
                        !student.active && "opacity-50 cursor-not-allowed hover:shadow-none"
                    )}
                    disabled={!student.active}
                    onClick={() => onAddSession(student)}
                >
                    <Plus className="w-4 h-4" />
                    Buổi Học
                </Button>
            </div>
        </motion.div>
    );
});