'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Loader2,
    GraduationCap,
    Layers,
    ArrowRight,
    ArrowLeft,
    Check,
    Search,
    AlertCircle,
    MoreVertical,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    GripVertical,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useLessonLibrary } from '../../lessons/hooks/useLessonLibrary';
import { useCreateCourse, useUpdateCourse, useAdminCourseById } from '../hooks/useAdminCourses';
import type { CourseDTO, CourseDetailDTO, CourseRequest, CourseLessonDTO } from '../types';
import type { LessonLibraryDTO } from '../../lessons/types';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import React from 'react';

const courseSchema = z.object({
    title: z.string().min(1, 'Tiêu đề không được để trống').max(200),
    description: z.string().max(1000),
    difficultyLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
    estimatedHours: z.number().min(0).max(1000),
    isPublished: z.boolean(),
    lessonIds: z.array(z.number()),
});

type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseBuilderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    course?: CourseDetailDTO | CourseDTO | null;
    mode: 'create' | 'edit';
}

export function CourseBuilderDialog({
    open,
    onOpenChange,
    course,
    mode,
}: CourseBuilderDialogProps) {
    const [step, setStep] = useState<'info' | 'lessons' | 'sort'>('info');
    const [searchQuery, setSearchQuery] = useState('');

    const { data: libraryLessons = [], isLoading: isLoadingLibrary } = useLessonLibrary();
    const { data: courseDetail, isLoading: isLoadingDetail } = useAdminCourseById(
        mode === 'edit' && course ? course.id : 0
    );
    const createMutation = useCreateCourse();
    const updateMutation = useUpdateCourse();

    const defaultValues = useMemo(() => {
        const targetCourse = courseDetail || course;

        if (targetCourse) {
            const lessonIds = 'lessons' in targetCourse
                ? (targetCourse.lessons as CourseLessonDTO[]).map((l) => l.lessonId)
                : [];

            return {
                title: targetCourse.title,
                description: targetCourse.description || '',
                difficultyLevel: targetCourse.difficultyLevel,
                estimatedHours: targetCourse.estimatedHours || 0,
                isPublished: targetCourse.isPublished,
                lessonIds: lessonIds,
            };
        }

        return {
            title: '',
            description: '',
            difficultyLevel: 'BEGINNER' as const,
            estimatedHours: 0,
            isPublished: false,
            lessonIds: [],
        };
    }, [course, courseDetail]);

    const form = useForm<CourseFormValues>({
        resolver: zodResolver(courseSchema),
        defaultValues,
    });

    const { watch, reset, setValue, getValues } = form;
    const selectedLessonIds = watch('lessonIds') || [];

    const lessons = useMemo(() => {
        if (!libraryLessons) return [];
        return Array.isArray(libraryLessons) ? libraryLessons : (libraryLessons.content || []);
    }, [libraryLessons]);

    const sortedSelectedLessons = useMemo(() => {
        return selectedLessonIds.map(id => lessons.find(l => l.id === id)).filter((l): l is LessonLibraryDTO => !!l);
    }, [selectedLessonIds, lessons]);

    const handleReorder = (newSortedLessons: LessonLibraryDTO[]) => {
        const newIds = newSortedLessons.map(l => l.id);
        setValue('lessonIds', newIds, { shouldValidate: true, shouldDirty: true });
    };

    useEffect(() => {
        if (open) {
            reset(defaultValues);
            if (mode === 'create') {
                setStep('info');
            }
            setSearchQuery('');
        }
    }, [open, defaultValues, reset, mode]);

    const onSubmit: SubmitHandler<CourseFormValues> = (values) => {
        if (step === 'info') {
            setStep('lessons');
            return;
        }

        if (step === 'lessons') {
            if (values.lessonIds.length === 0) {
                setStep('sort'); // Allow skip if no lessons? Or require at least one?
                // Let's allow but maybe show a message.
            }
            setStep('sort');
            return;
        }

        const payload: CourseRequest = values;

        if (mode === 'create') {
            createMutation.mutate(payload, {
                onSuccess: () => onOpenChange(false),
            });
        } else if (course && mode === 'edit') {
            updateMutation.mutate(
                { id: course.id, data: payload },
                { onSuccess: () => onOpenChange(false) }
            );
        }
    };

    const toggleLesson = useCallback((lessonId: number) => {
        const currentIds = form.getValues('lessonIds') || [];
        const newIds = currentIds.includes(lessonId)
            ? currentIds.filter((id) => id !== lessonId)
            : [...currentIds, lessonId];

        form.setValue('lessonIds', newIds, { shouldValidate: true, shouldDirty: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredLessons = useMemo(() =>
        lessons.filter((lesson) =>
            lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [lessons, searchQuery]
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[calc(100%-1rem)] max-w-[calc(100vw-1rem)] sm:max-w-[700px] md:max-w-[750px] max-h-[95vh] sm:max-h-[85vh] flex flex-col p-0 overflow-hidden gap-0 rounded-2xl sm:rounded-lg">
                <DialogHeader className="px-4 py-4 sm:px-6 sm:py-5 border-b bg-card shrink-0 relative">
                    <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl font-black tracking-tight pr-8">
                        <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary shrink-0" />
                        <span className="truncate">
                            {mode === 'create' ? 'Tạo lộ trình học tập' : 'Chỉnh sửa lộ trình'}
                        </span>
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm font-medium text-muted-foreground/70 mt-1">
                        {step === 'info'
                            ? 'Xác định tiêu đề, độ khó và các thông tin cơ bản cho lộ trình học tập.'
                            : step === 'lessons'
                                ? 'Duyệt và chọn các bài giảng chất lượng từ thư viện học liệu của bạn.'
                                : 'Thiết lập trình tự học tập logic bằng cách kéo thả vị trí các bài giảng.'}
                    </DialogDescription>
                </DialogHeader>

                {/* Progress Indicators - Moved here to avoid conflict with Close button */}
                <div className="px-4 py-3 sm:px-6 border-b bg-muted/30 flex items-center justify-center gap-3 sm:gap-6 shrink-0">
                    {[
                        { id: 'info', label: 'Thông tin' },
                        { id: 'lessons', label: 'Bài học' },
                        { id: 'sort', label: 'Sắp xếp' }
                    ].map((s, idx) => (
                        <React.Fragment key={s.id}>
                            <div className={cn(
                                "flex items-center gap-2 transition-all duration-300",
                                step === s.id ? "text-primary scale-105" : "text-muted-foreground/70"
                            )}>
                                <div className={cn(
                                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all",
                                    step === s.id ? "bg-primary border-primary text-white" : "border-muted-foreground/40 text-muted-foreground"
                                )}>
                                    {idx + 1}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest hidden xs:block">{s.label}</span>
                            </div>
                            {idx < 2 && <ChevronRight className="w-3 h-3 text-muted-foreground/10" />}
                        </React.Fragment>
                    ))}
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className={cn(
                        "flex flex-col overflow-hidden min-h-0",
                        step === 'lessons' ? "flex-1" : "h-auto"
                    )}>
                        <div className={cn(
                            "overflow-y-auto px-4 py-3 sm:p-6 sm:pt-4 min-h-0",
                            step === 'lessons' ? "flex-1" : "h-auto"
                        )}>
                            {isLoadingDetail ? (
                                <div className="flex items-center justify-center h-64">
                                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
                                </div>
                            ) : step === 'info' ? (
                                <div className="space-y-3 sm:space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs sm:text-sm">Tiêu đề khóa học</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Ví dụ: Luyện thi IELTS Speaking cấp tốc"
                                                        className="h-9 sm:h-10 text-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-xs" />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs sm:text-sm">Mô tả ngắn gọn</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Mô tả mục tiêu và nội dung chính của khóa học..."
                                                        className="min-h-[80px] sm:min-h-[100px] resize-none text-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-xs" />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <FormField
                                            control={form.control}
                                            name="difficultyLevel"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs sm:text-sm">Độ khó</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-9 sm:h-10 text-sm">
                                                                <SelectValue placeholder="Chọn độ khó" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="BEGINNER" className="text-sm">Cơ bản (Beginner)</SelectItem>
                                                            <SelectItem value="INTERMEDIATE" className="text-sm">Trung cấp (Intermediate)</SelectItem>
                                                            <SelectItem value="ADVANCED" className="text-sm">Nâng cao (Advanced)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="estimatedHours"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs sm:text-sm">Thời lượng dự kiến (giờ)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            className="h-9 sm:h-10 text-sm"
                                                            {...field}
                                                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                        />
                                                    </FormControl>
                                                    <FormMessage className="text-xs" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            ) : step === 'lessons' ? (
                                <div className="space-y-3 sm:space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 sm:left-3 top-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm kiếm bài giảng..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-8 sm:pl-9 h-9 sm:h-10 text-sm"
                                        />
                                    </div>

                                    <div className="bg-muted/50 rounded-xl sm:rounded-lg p-2.5 sm:p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                                            <span className="text-xs sm:text-sm font-medium">
                                                Đã chọn <span className="text-primary font-bold">{selectedLessonIds.length}</span> bài giảng
                                            </span>
                                        </div>
                                    </div>

                                    <ScrollArea className="h-[250px] sm:h-[300px] border rounded-xl sm:rounded-md p-1.5 sm:p-2">
                                        {isLoadingLibrary ? (
                                            <div className="flex items-center justify-center h-full">
                                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : filteredLessons.length === 0 ? (
                                            <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">
                                                Không tìm thấy bài giảng nào
                                            </div>
                                        ) : (
                                            <div className="space-y-1.5 sm:space-y-2">
                                                {filteredLessons.map((lesson) => (
                                                    <LessonItem
                                                        key={lesson.id}
                                                        lesson={lesson}
                                                        isSelected={selectedLessonIds.includes(lesson.id)}
                                                        onToggle={toggleLesson}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Layers className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm">Sắp xếp thứ tự bài học</h4>
                                            <p className="text-xs text-muted-foreground leading-relaxed">
                                                Kéo và thả để sắp xếp trình tự học tập cho học sinh. Thứ tự này sẽ được hiển thị trên lộ trình của học viên.
                                            </p>
                                        </div>
                                    </div>

                                    {selectedLessonIds.length === 0 ? (
                                        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted-foreground/10">
                                            <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground">Chưa có bài giảng nào được chọn để sắp xếp</p>
                                            <Button variant="link" onClick={() => setStep('lessons')}>Quay lại bước chọn bài</Button>
                                        </div>
                                    ) : (
                                        <ScrollArea className="h-[400px] pr-4">
                                            <Reorder.Group
                                                axis="y"
                                                values={sortedSelectedLessons}
                                                onReorder={handleReorder}
                                                className="space-y-3"
                                            >
                                                {sortedSelectedLessons.map((lesson, index: number) => (
                                                    <Reorder.Item
                                                        key={lesson.id}
                                                        value={lesson}
                                                        className="relative"
                                                        layout
                                                    >
                                                        <div className="flex items-center gap-4 bg-card p-4 rounded-2xl border-2 border-transparent hover:border-primary/20 shadow-sm cursor-grab active:cursor-grabbing group transition-all">
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <GripVertical className="w-4 h-4 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                                                                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                    {index + 1}
                                                                </div>
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <h5 className="font-bold text-sm truncate">{lesson.title}</h5>
                                                                <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider font-medium">{(lesson as any).difficultyLevel || 'Cơ bản'}</p>
                                                            </div>

                                                            {/* Manual movement buttons for long lists */}
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    disabled={index === 0}
                                                                    className="h-8 w-8 rounded-lg opacity-40 hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const newLessons = [...sortedSelectedLessons];
                                                                        [newLessons[index - 1], newLessons[index]] = [newLessons[index], newLessons[index - 1]];
                                                                        handleReorder(newLessons);
                                                                    }}
                                                                >
                                                                    <ArrowUp className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    disabled={index === sortedSelectedLessons.length - 1}
                                                                    className="h-8 w-8 rounded-lg opacity-40 hover:opacity-100 hover:bg-primary/10 hover:text-primary transition-all"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const newLessons = [...sortedSelectedLessons];
                                                                        [newLessons[index + 1], newLessons[index]] = [newLessons[index], newLessons[index + 1]];
                                                                        handleReorder(newLessons);
                                                                    }}
                                                                >
                                                                    <ArrowDown className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </Reorder.Item>
                                                ))}
                                            </Reorder.Group>
                                        </ScrollArea>
                                    )}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="px-4 py-3 sm:p-6 sm:pt-3 bg-muted/20 border-t shrink-0">
                            <div className="flex w-full justify-between items-center gap-3">
                                <div className="flex gap-1.5 sm:gap-2">
                                    <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full", step === 'info' ? "bg-primary" : "bg-primary/30")} />
                                    <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full", step === 'lessons' ? "bg-primary" : "bg-primary/30")} />
                                    <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full", step === 'sort' ? "bg-primary" : "bg-primary/30")} />
                                </div>

                                <div className="flex gap-2 sm:gap-3">
                                    {step !== 'info' && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setStep(step === 'sort' ? 'lessons' : 'info')}
                                            disabled={createMutation.isPending || updateMutation.isPending}
                                            className="h-8 sm:h-9 text-xs sm:text-sm px-3"
                                        >
                                            <ArrowLeft className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="hidden xs:inline">Quay lại</span>
                                            <span className="xs:hidden">Lại</span>
                                        </Button>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={createMutation.isPending || updateMutation.isPending}
                                        className="h-8 sm:h-9 text-xs sm:text-sm px-3"
                                    >
                                        {createMutation.isPending || updateMutation.isPending ? (
                                            <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                        ) : step !== 'sort' ? (
                                            <>
                                                <span className="hidden xs:inline">Tiếp theo</span>
                                                <span className="xs:hidden">Tiếp</span>
                                                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                                            </>
                                        ) : (
                                            <>
                                                <span className="hidden sm:inline">Hoàn tất & Lưu</span>
                                                <span className="sm:hidden">Lưu</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

interface LessonItemProps {
    lesson: LessonLibraryDTO;
    isSelected: boolean;
    onToggle: (id: number) => void;
}

const LessonItem = memo(({ lesson, isSelected, onToggle }: LessonItemProps) => {
    return (
        <div
            role="button"
            tabIndex={0}
            className={cn(
                "w-full flex items-center space-x-2.5 sm:space-x-3 p-2.5 sm:p-3 rounded-xl sm:rounded-lg border transition-all cursor-pointer hover:bg-accent focus:outline-none focus:ring-1 focus:ring-primary/20 active:scale-[0.98]",
                isSelected && "bg-primary/5 border-primary/30"
            )}
            onClick={() => onToggle(lesson.id)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onToggle(lesson.id);
                }
            }}
        >
            <div className="flex items-center space-x-2.5 sm:space-x-3 w-full">
                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <Checkbox checked={isSelected} className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs sm:text-sm font-medium leading-none mb-0.5 sm:mb-1 truncate">
                        {lesson.title}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                        {lesson.summary || 'Không có tóm tắt'}
                    </p>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />}
            </div>
        </div>
    );
});

LessonItem.displayName = 'LessonItem';