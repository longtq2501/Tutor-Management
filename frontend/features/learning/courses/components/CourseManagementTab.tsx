'use client';

import { useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import {
    GraduationCap,
    MoreVertical,
    Plus,
    Trash2,
    Edit,
    Loader2,
    Users,
    Layers,
    Clock,
    Search,
    LayoutGrid,
    List,
    Filter,
    ArrowRight,
    Sparkles,
    BookOpen
} from 'lucide-react';
import { useAdminCourses, useDeleteCourse } from '../hooks/useAdminCourses';
import type { CourseDTO } from '../types';
import { CourseBuilderDialog } from './CourseBuilderDialog';
import { AssignCourseDialog } from './AssignCourseDialog';
import { AdminCoursePreviewModal } from './AdminCoursePreviewModal';
import { EnhancedCourseCard } from './EnhancedCourseCard';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

export function CourseManagementTab() {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [builderMode, setBuilderMode] = useState<'create' | 'edit'>('create');
    const [selectedCourse, setSelectedCourse] = useState<CourseDTO | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);

    // Course Preview State
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const { data: courses = [], isLoading } = useAdminCourses();
    const deleteMutation = useDeleteCourse();

    const filteredCourses = useMemo(() => {
        return courses.filter(course => {
            if (!searchQuery) return true;
            const searchLower = searchQuery.toLowerCase();
            return (
                course.title.toLowerCase().includes(searchLower) ||
                course.description?.toLowerCase().includes(searchLower)
            );
        });
    }, [courses, searchQuery]);

    const handleCreate = useCallback(() => {
        setBuilderMode('create');
        setSelectedCourse(null);
        setIsBuilderOpen(true);
    }, []);

    const handleEdit = useCallback((course: CourseDTO) => {
        setBuilderMode('edit');
        setSelectedCourse(course);
        setIsBuilderOpen(true);
    }, []);

    const handlePreview = useCallback((course: CourseDTO) => {
        setSelectedCourse(course);
        setIsPreviewOpen(true);
    }, []);

    const router = useRouter();

    const handleLessonPreview = useCallback((lessonId: number) => {
        router.push(`/learning/lessons/${lessonId}?preview=true`);
    }, [router]);

    const handleAssign = useCallback((course: CourseDTO) => {
        setSelectedCourse(course);
        setIsAssignOpen(true);
    }, []);

    const handleDelete = useCallback(() => {
        if (selectedCourse) {
            deleteMutation.mutate(selectedCourse.id, {
                onSuccess: () => {
                    setIsDeleteDialogOpen(false);
                    setSelectedCourse(null);
                },
            });
        }
    }, [selectedCourse, deleteMutation]);

    const handleDeleteClick = useCallback((course: CourseDTO) => {
        setSelectedCourse(course);
        setIsDeleteDialogOpen(true);
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 gap-4">
                <div className="relative">
                    <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
                    <GraduationCap className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-sm text-muted-foreground font-medium animate-pulse">Đang tải danh sách khóa học...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Action Bar */}
            <div className="flex flex-col lg:row gap-4 lg:items-center justify-between bg-card p-5 rounded-3xl border shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 flex-1 items-center">
                    <div className="relative w-full sm:max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Tìm kiếm khóa học..."
                            className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <ToggleGroup
                        type="single"
                        value={view}
                        onValueChange={(v) => v && setView(v as 'grid' | 'list')}
                        className="bg-muted/50 p-1.5 rounded-2xl border shrink-0"
                    >
                        <ToggleGroupItem value="grid" className="rounded-xl h-9 w-9 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                            <LayoutGrid className="w-4 h-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="list" className="rounded-xl h-9 w-9 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                            <List className="w-4 h-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <Button
                    size="lg"
                    onClick={handleCreate}
                    className="rounded-2xl h-12 px-8 shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all font-bold"
                >
                    <Plus className="mr-2 h-5 w-5" />
                    Tạo khóa học mới
                </Button>
            </div>

            {/* Content Display */}
            {filteredCourses.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-24 bg-muted/20 rounded-[40px] border-2 border-dashed border-muted-foreground/20"
                >
                    <div className="max-w-md mx-auto space-y-6 px-6">
                        <div className="w-24 h-24 rounded-[32px] bg-background flex items-center justify-center mx-auto shadow-xl ring-1 ring-black/5">
                            <GraduationCap className="h-12 w-12 text-primary/40" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold tracking-tight">Không tìm thấy khóa học</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {searchQuery
                                    ? `Không có kết quả nào cho &quot;${searchQuery}&quot;. Hãy thử tìm kiếm với từ khóa khác.`
                                    : "Bạn chưa tạo khóa học nào. Hãy bắt đầu xây dựng lộ trình học tập đầu tiên!"}
                            </p>
                        </div>
                        {!searchQuery && (
                            <Button size="lg" onClick={handleCreate} className="rounded-2xl h-12 px-8 font-bold">
                                Bắt đầu ngay
                            </Button>
                        )}
                    </div>
                </motion.div>
            ) : (
                <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                        {view === 'grid' ? (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
                            >
                                {filteredCourses.map((course, idx) => (
                                    <motion.div
                                        key={course.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <EnhancedCourseCard
                                            course={course}
                                            onEdit={handleEdit}
                                            onDelete={handleDeleteClick}
                                            onAssign={handleAssign}
                                            onPreview={handlePreview}
                                            onClick={handlePreview}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="rounded-[32px] border border-border/40 bg-card shadow-sm overflow-hidden"
                            >
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow className="hover:bg-transparent border-b-border/40">
                                            <TableHead className="w-[400px] h-14 px-8 font-bold">KHÓA HỌC</TableHead>
                                            <TableHead className="hidden md:table-cell font-bold">ĐỘ KHÓ</TableHead>
                                            <TableHead className="hidden md:table-cell font-bold text-center">BÀI HỌC</TableHead>
                                            <TableHead className="hidden md:table-cell font-bold text-center">T.LƯỢNG</TableHead>
                                            <TableHead className="hidden md:table-cell font-bold">TRẠNG THÁI</TableHead>
                                            <TableHead className="w-[80px] pr-8"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredCourses.map((course) => (
                                            <TableRow key={course.id} className="group hover:bg-primary/5 transition-colors border-b-border/40 last:border-0 h-20">
                                                <TableCell className="px-8">
                                                    <div className="flex flex-col gap-1 py-1">
                                                        <span className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{course.title}</span>
                                                        <span className="text-sm text-muted-foreground line-clamp-1 font-medium">
                                                            {course.description || 'Chưa có mô tả'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <Badge variant="outline" className={cn(
                                                        "h-7 rounded-lg border-0 font-bold",
                                                        course.difficultyLevel === 'BEGINNER' ? 'bg-emerald-500/10 text-emerald-600' :
                                                            course.difficultyLevel === 'INTERMEDIATE' ? 'bg-blue-500/10 text-blue-600' : 'bg-rose-500/10 text-rose-600'
                                                    )}>
                                                        {course.difficultyLevel === 'BEGINNER' ? 'Cơ bản' :
                                                            course.difficultyLevel === 'INTERMEDIATE' ? 'Trung cấp' : 'Nâng cao'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-center">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-sm font-bold">
                                                        <Layers className="h-4 w-4 text-primary/60" />
                                                        {course.lessonCount}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-center">
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-sm font-bold">
                                                        <Clock className="h-4 w-4 text-primary/60" />
                                                        {course.estimatedHours || 0}h
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <Badge className={cn(
                                                        "h-7 rounded-lg shadow-none px-3 font-bold uppercase text-[10px]",
                                                        course.isPublished ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' : 'bg-muted/80 text-muted-foreground border-transparent'
                                                    )}>
                                                        {course.isPublished ? 'Public' : 'Nháp'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="pr-8">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="group-hover:bg-background rounded-xl shadow-none w-10 h-10">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-52 p-2 rounded-2xl border-2">
                                                            <DropdownMenuItem onClick={() => handleEdit(course)} className="rounded-xl py-2.5 font-medium">
                                                                <Edit className="mr-3 h-4 w-4 text-emerald-500" />
                                                                Chỉnh sửa
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleAssign(course)} className="rounded-xl py-2.5 font-medium">
                                                                <Users className="mr-3 h-4 w-4 text-blue-500" />
                                                                Giao khóa học
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="my-2" />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive rounded-xl py-2.5 font-medium"
                                                                onClick={() => handleDeleteClick(course)}
                                                            >
                                                                <Trash2 className="mr-3 h-4 w-4" />
                                                                Xóa khóa học
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Course Builder Dialog */}
            <CourseBuilderDialog
                open={isBuilderOpen}
                onOpenChange={setIsBuilderOpen}
                course={selectedCourse}
                mode={builderMode}
            />

            {/* Assign Dialog */}
            {selectedCourse && (
                <AssignCourseDialog
                    open={isAssignOpen}
                    onOpenChange={setIsAssignOpen}
                    course={selectedCourse}
                />
            )}

            <AdminCoursePreviewModal
                open={isPreviewOpen}
                onOpenChange={setIsPreviewOpen}
                courseId={selectedCourse?.id || null}
                onLessonPreview={handleLessonPreview}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-3xl border-2">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold">Xác nhận xóa lộ trình</AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            Bạn có chắc chắn muốn xóa lộ trình học tập &quot;
                            <span className="font-bold text-foreground">{selectedCourse?.title}</span>&quot;?
                            Hành động này <span className="text-destructive font-bold">không thể hoàn tác</span>.
                            <br /><br />
                            <span className="text-sm italic text-muted-foreground">* Các bài giảng bên trong lộ trình sẽ không bị xóa.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 sm:gap-0">
                        <AlertDialogCancel className="rounded-2xl font-bold border-2">Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-2xl font-bold shadow-xl shadow-destructive/20"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Xác nhận xóa
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
