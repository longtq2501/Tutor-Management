'use client';

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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  LayoutGrid,
  List,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Tag,
  Trash2,
  Users
} from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useLessonCategories } from '../hooks/useLessonCategories';
import {
  useAssignLibraryLesson,
  useCreateLibraryLesson,
  useDeleteLibraryLesson,
  useLessonLibrary,
  useUnassignLibraryLesson,
  useUpdateLibraryLesson,
} from '../hooks/useLessonLibrary';
import { LessonFormData, LessonLibraryDTO } from '../types';
import { AssignStudentsDialog } from './AssignStudentsDialog';
import { CategoryManagerDialog } from './CategoryManagerDialog';
import { EditLessonDialog } from './EditLessonDialog';
import { LessonForm } from './LessonForm';
import { PremiumCategoryCard } from './PremiumCategoryCard';
import { PremiumLessonCard } from './PremiumLessonCard';

const ITEMS_PER_PAGE = 8; // Compact view: 8 items per page

const LessonLibraryRow = memo(({
  lesson,
  onPreview,
  onEdit,
  onDelete,
  onAssign
}: {
  lesson: LessonLibraryDTO;
  onPreview: (id: number) => void;
  onEdit: (lesson: LessonLibraryDTO) => void;
  onDelete: (lesson: LessonLibraryDTO) => void;
  onAssign: (lesson: LessonLibraryDTO) => void;
}) => (
  <TableRow
    className="group hover:bg-primary/5 transition-colors cursor-pointer"
    onClick={() => onPreview(lesson.id)}
  >
    <TableCell>
      <div className="flex flex-col gap-1.5 py-1">
        <span className="font-bold text-base leading-tight group-hover:text-primary transition-colors">{lesson.title}</span>
        <div className="flex flex-wrap items-center gap-2">
          {lesson.category && (
            <Badge
              className="border-0 text-[10px] font-bold px-2 py-0 h-5"
              style={{
                backgroundColor: `${lesson.category.color}15`,
                color: lesson.category.color
              }}
            >
              {lesson.category.name}
            </Badge>
          )}
          <span className="md:hidden text-xs text-muted-foreground flex items-center gap-1 font-medium">
            <Calendar className="w-3 h-3" />
            {lesson.lessonDate ? format(new Date(lesson.lessonDate), 'dd/MM/yyyy') : '-'}
          </span>
        </div>
      </div>
    </TableCell>
    <TableCell className="hidden md:table-cell">
      <div className="flex items-center gap-2 font-medium">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs uppercase">
          {lesson.tutorName.charAt(0)}
        </div>
        <span>{lesson.tutorName}</span>
      </div>
    </TableCell>
    <TableCell className="hidden md:table-cell text-muted-foreground font-medium">
      {lesson.lessonDate ? format(new Date(lesson.lessonDate), 'dd/MM/yyyy') : '-'}
    </TableCell>
    <TableCell className="hidden md:table-cell">
      {lesson.isPublished ? (
        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none px-2 font-semibold">
          Public
        </Badge>
      ) : (
        <Badge variant="secondary" className="px-2 font-semibold bg-muted/80">
          Private
        </Badge>
      )}
    </TableCell>
    <TableCell className="hidden md:table-cell text-center">
      {(lesson.assignedStudentCount || 0) > 0 ? (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
          <Users className="w-3 h-3" />
          {lesson.assignedStudentCount}
        </div>
      ) : (
        <span className="text-muted-foreground/40 font-bold">-</span>
      )}
    </TableCell>
    <TableCell>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="group-hover:bg-background rounded-lg shadow-none">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAssign(lesson); }} className="rounded-lg py-2">
            <Users className="mr-2.5 h-4 w-4 text-blue-500" />
            Giao cho học sinh
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(lesson); }} className="rounded-lg py-2">
            <Edit className="mr-2.5 h-4 w-4 text-emerald-500" />
            Chỉnh sửa
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-2" />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive rounded-lg py-2"
            onClick={(e) => { e.stopPropagation(); onDelete(lesson); }}
          >
            <Trash2 className="mr-2.5 h-4 w-4" />
            Xóa bài giảng
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  </TableRow>
));

LessonLibraryRow.displayName = 'LessonLibraryRow';

export function LessonLibraryTab() {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonLibraryDTO | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: lessonsData, isLoading } = useLessonLibrary();
  const lessons = useMemo(() => {
    if (!lessonsData) return [];
    return Array.isArray(lessonsData) ? lessonsData : (lessonsData.content || []);
  }, [lessonsData]);
  const { categories } = useLessonCategories();

  const createMutation = useCreateLibraryLesson();
  const updateMutation = useUpdateLibraryLesson();
  const assignMutation = useAssignLibraryLesson();
  const unassignMutation = useUnassignLibraryLesson();
  const deleteMutation = useDeleteLibraryLesson();

  // Memoize Filter Logic
  const filteredLessons = useMemo(() => {
    return lessons.filter(lesson => {
      // Category Filter
      const matchesCategory = selectedCategoryFilter === 'all'
        || (selectedCategoryFilter === 'none' && !lesson.category)
        || String(lesson.category?.id) === selectedCategoryFilter;

      if (!matchesCategory) return false;

      // Search Filter
      if (!debouncedSearchQuery) return true;
      const searchLower = debouncedSearchQuery.toLowerCase();
      return (
        lesson.title.toLowerCase().includes(searchLower) ||
        lesson.tutorName.toLowerCase().includes(searchLower) ||
        lesson.summary?.toLowerCase().includes(searchLower)
      );
    });
  }, [lessons, selectedCategoryFilter, debouncedSearchQuery]);

  // Memoize Pagination Logic
  const { totalPages, paginatedLessons } = useMemo(() => {
    const total = Math.ceil(filteredLessons.length / ITEMS_PER_PAGE);
    const paginated = filteredLessons.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
    return { totalPages: total, paginatedLessons: paginated };
  }, [filteredLessons, currentPage]);

  // Memoize Category Counts to avoid filtering in the render loop
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {
      all: lessons.length,
      none: lessons.filter(l => !l.category).length
    };

    categories.forEach(cat => {
      stats[cat.id] = lessons.filter(l => l.category?.id === cat.id).length;
    });

    return stats;
  }, [lessons, categories]);

  const handleCreate = useCallback((data: LessonFormData) => {
    createMutation.mutate(
      { ...data },
      { onSuccess: () => setIsFormOpen(false) }
    );
  }, [createMutation]);

  const handlePreviewClick = useCallback((lessonId: number) => {
    router.push(`/learning/lessons/${lessonId}?preview=true`);
  }, [router]);

  const handleEditSubmit = useCallback((data: LessonFormData) => {
    if (!selectedLesson) return;

    updateMutation.mutate(
      {
        id: selectedLesson.id,
        data: {
          ...data,
          tutorName: data.tutorName,
          title: data.title,
          content: data.content,
          lessonDate: data.lessonDate || new Date().toISOString().split('T')[0],
          isPublished: data.isPublished || false,
          categoryId: data.categoryId,
        },
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setSelectedLesson(null);
        },
      }
    );
  }, [selectedLesson, updateMutation]);

  const handleDelete = useCallback(() => {
    if (selectedLesson) {
      deleteMutation.mutate(selectedLesson.id, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedLesson(null);
        },
      });
    }
  }, [selectedLesson, deleteMutation]);

  const handleAssignClick = useCallback((lesson: LessonLibraryDTO) => {
    setSelectedLesson(lesson);
    setIsAssignDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((lesson: LessonLibraryDTO) => {
    setSelectedLesson(lesson);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleEditClick = useCallback((lesson: LessonLibraryDTO) => {
    setSelectedLesson(lesson);
    setIsEditDialogOpen(true);
  }, []);

  const handleAssign = useCallback((lessonId: number, studentIds: number[]) => {
    if (!selectedLesson) return;

    assignMutation.mutate(
      {
        lessonId,
        data: { studentIds },
      },
      {
        onSuccess: () => {
          setIsAssignDialogOpen(false);
          setSelectedLesson(null);
        },
      }
    );
  }, [selectedLesson, assignMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Đang tải kho học liệu...</p>
        </div>
      </div>
    );
  }

  const getCategoryGradient = (color?: string) => {
    if (!color) return "from-slate-500 to-slate-700";
    // Simplified: in a real app, you might map specific hex to gradients
    return `from-[${color}]/80 to-[${color}]`;
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Category Overview Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            Lọc theo danh mục
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCategoryDialogOpen(true)}
            className="rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary"
          >
            <Tag className="w-4 h-4 mr-2" />
            Quản lý danh mục
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <PremiumCategoryCard
            title="Tất cả bài giảng"
            count={lessons.length}
            icon={<BookOpen className="w-7 h-7" />}
            gradient="from-blue-600 to-indigo-600"
            isActive={selectedCategoryFilter === 'all'}
            onClick={() => {
              setSelectedCategoryFilter('all');
              setCurrentPage(1);
            }}
          />

          {categories.map((cat, idx) => {
            const lessonCount = categoryStats[cat.id] || 0;
            // Dynamic gradients based on index if color is generic
            const gradients = [
              "from-emerald-500 to-teal-600",
              "from-orange-500 to-amber-600",
              "from-pink-500 to-rose-600",
              "from-purple-500 to-violet-600"
            ];

            return (
              <PremiumCategoryCard
                key={cat.id}
                title={cat.name}
                count={lessonCount}
                gradient={gradients[idx % gradients.length]}
                isActive={selectedCategoryFilter === String(cat.id)}
                onClick={() => {
                  setSelectedCategoryFilter(String(cat.id));
                  setCurrentPage(1);
                }}
              />
            );
          })}

          <PremiumCategoryCard
            title="Chưa phân loại"
            count={categoryStats.none || 0}
            icon={<Tag className="w-7 h-7" />}
            gradient="from-slate-500 to-slate-700"
            isActive={selectedCategoryFilter === 'none'}
            onClick={() => {
              setSelectedCategoryFilter('none');
              setCurrentPage(1);
            }}
          />
        </div>
      </section>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Filters & Actions Bar */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between bg-card p-4 rounded-2xl border shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 items-center">
            <div className="relative w-full sm:max-w-md group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Tìm kiếm theo tiêu đề hoặc giáo viên..."
                className="pl-10 h-11 rounded-xl border-muted-foreground/20 focus:border-primary/50 focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto self-stretch">
              <ToggleGroup
                type="single"
                value={view}
                onValueChange={(v) => v && setView(v as 'grid' | 'list')}
                className="bg-muted/50 p-1 rounded-xl border shrink-0"
              >
                <ToggleGroupItem value="grid" className="rounded-lg h-9 w-9 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                  <LayoutGrid className="w-4 h-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" className="rounded-lg h-9 w-9 p-0 data-[state=on]:bg-background data-[state=on]:shadow-sm">
                  <List className="w-4 h-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => setIsFormOpen(true)}
            className="rounded-xl h-11 px-6 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="mr-2 h-5 w-5" />
            Thêm bài mới
          </Button>
        </div>

        {/* Lessons Display */}
        {filteredLessons.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed"
          >
            <div className="max-w-xs mx-auto space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                <BookOpen className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Không tìm thấy bài giảng</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {searchQuery
                    ? `Không có kết quả nào cho &quot;${searchQuery}&quot;. Thử tìm kiếm với từ khóa khác.`
                    : "Chưa có bài giảng nào trong danh mục này. Hãy bắt đầu bằng cách thêm bài giảng mới."}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={() => setIsFormOpen(true)} variant="outline" className="rounded-xl">
                  Thêm bài đầu tiên
                </Button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {view === 'grid' ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                  {paginatedLessons.map((lesson, idx) => (
                    <motion.div
                      key={lesson.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <PremiumLessonCard
                        lesson={lesson}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        onAssign={handleAssignClick}
                        onPreview={handlePreviewClick}
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
                  className="rounded-2xl border bg-card shadow-sm overflow-hidden"
                >
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow className="hover:bg-transparent border-b">
                        <TableHead className="w-[350px] font-bold">TIÊU ĐỀ BÀI GIẢNG</TableHead>
                        <TableHead className="hidden md:table-cell font-bold">GIÁO VIÊN</TableHead>
                        <TableHead className="hidden md:table-cell font-bold">NGÀY TẠO</TableHead>
                        <TableHead className="hidden md:table-cell font-bold">TRẠNG THÁI</TableHead>
                        <TableHead className="hidden md:table-cell font-bold text-center">ĐÃ GIAO</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLessons.map((lesson) => (
                        <LessonLibraryRow
                          key={lesson.id}
                          lesson={lesson}
                          onPreview={handlePreviewClick}
                          onEdit={handleEditClick}
                          onDelete={handleDeleteClick}
                          onAssign={handleAssignClick}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20 p-4 rounded-2xl border">
                <p className="text-sm font-semibold text-muted-foreground">
                  Hiển thị <span className="text-foreground">{paginatedLessons.length}</span> trên <span className="text-foreground">{filteredLessons.length}</span> bài giảng
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-10 px-4 font-bold border-muted-foreground/20"
                    onClick={() => {
                      setCurrentPage(p => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Trước
                  </Button>

                  <div className="flex items-center gap-1.5 px-4 h-10 rounded-xl bg-background border font-bold tabular-nums">
                    <span className="text-primary">{currentPage}</span>
                    <span className="text-muted-foreground/40">/</span>
                    <span>{totalPages}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl h-10 px-4 font-bold border-muted-foreground/20"
                    onClick={() => {
                      setCurrentPage(p => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                  >
                    Tiếp
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <LessonForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        mode="library"
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />

      {/* Edit Dialog */}
      {selectedLesson && (
        <EditLessonDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          lesson={selectedLesson as LessonLibraryDTO}
          onSubmit={handleEditSubmit}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Assign Dialog */}
      {selectedLesson && (
        <AssignStudentsDialog
          open={isAssignDialogOpen}
          onOpenChange={setIsAssignDialogOpen}
          lesson={selectedLesson as LessonLibraryDTO}
        />
      )}

      {/* Category Manager */}
      <CategoryManagerDialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="rounded-2xl border-2">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Bạn có chắc chắn muốn xóa bài giảng &quot;
              <span className="font-bold text-foreground">{selectedLesson?.title}</span>&quot;?
              <br /><br />
              <span className="text-destructive font-semibold">Cảnh báo:</span> Hành động này sẽ gỡ bài giảng khỏi
              <span className="font-bold"> toàn bộ buổi học và khóa học </span>
              có liên quan. Dữ liệu <span className="text-destructive font-semibold">không thể hoàn tác</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-0">
            <AlertDialogCancel className="rounded-xl font-bold border-2">Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold shadow-lg shadow-destructive/20"
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