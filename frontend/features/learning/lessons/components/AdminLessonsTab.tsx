'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  BookMarked,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Loader2,
  User,
  Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useMemo, useState } from 'react';
import {
  useAdminLessons
} from '../hooks/useAdminLessons';
import type { AdminLessonDTO } from '../types';
import { CategoryDashboard } from './CategoryDashboard';

const ITEMS_PER_PAGE = 10;

const AdminLessonRow = memo(({ lesson, onPreview }: { lesson: AdminLessonDTO; onPreview: (id: number) => void }) => (
  <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => onPreview(lesson.id)}>
    <TableCell className="font-medium">
      <div className="flex flex-col gap-1">
        <span className="line-clamp-1 text-base font-semibold">{lesson.title}</span>
        <div className="flex flex-wrap items-center gap-2">
          {lesson.category && (
            <Badge
              variant="outline"
              className="text-[10px] uppercase font-bold px-1.5 py-0 h-5 border-0"
              style={{
                backgroundColor: `${lesson.category.color}15`,
                color: lesson.category.color
              }}
            >
              {lesson.category.name}
            </Badge>
          )}
          <span className="md:hidden text-xs text-muted-foreground">
            {format(new Date(lesson.lessonDate), 'dd/MM/yyyy')}
          </span>
          {lesson.assignedStudentCount !== undefined && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" />
              {lesson.assignedStudentCount} <span className="hidden sm:inline">học sinh</span>
            </span>
          )}
        </div>
      </div>
    </TableCell>
    <TableCell className="hidden md:table-cell">
      <div className="flex items-center gap-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{lesson.tutorName}</span>
      </div>
    </TableCell>
    <TableCell className="hidden md:table-cell">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">
          {format(new Date(lesson.lessonDate), 'dd/MM/yyyy', {
            locale: vi,
          })}
        </span>
      </div>
    </TableCell>
    <TableCell className="hidden md:table-cell">
      <Badge
        variant={lesson.isPublished ? 'default' : 'secondary'}
      >
        {lesson.isPublished ? 'Đã xuất bản' : 'Nháp'}
      </Badge>
    </TableCell>
    <TableCell className="hidden md:table-cell">
      {lesson.isPublished ? (
        <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
          <Eye className="h-4 w-4" />
          Public
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <EyeOff className="h-4 w-4" />
          Private
        </div>
      )}
    </TableCell>
    <TableCell className="text-right">
      <Button variant="ghost" size="icon" onClick={(e) => {
        e.stopPropagation();
        onPreview(lesson.id);
      }}>
        <Eye className="h-4 w-4 text-primary" />
      </Button>
    </TableCell>
  </TableRow>
));

AdminLessonRow.displayName = 'AdminLessonRow';

export function AdminLessonsTab() {
  const router = useRouter();
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: lessonsData, isLoading } = useAdminLessons();
  const lessons = useMemo(() => {
    if (!lessonsData) return [];
    return Array.isArray(lessonsData) ? lessonsData : (lessonsData.content || []);
  }, [lessonsData]);

  // Calculate counts for dashboard
  const lessonCounts = useMemo(() => lessons.reduce((acc, lesson) => {
    // Total count (using -1 as key for "All")
    acc[-1] = (acc[-1] || 0) + 1;

    // Category count
    if (lesson.category?.id) {
      acc[lesson.category.id] = (acc[lesson.category.id] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>), [lessons]);

  const handlePreview = useCallback((lessonId: number) => {
    router.push(`/learning/lessons/${lessonId}?preview=true`);
  }, [router]);

  const filteredLessons = useMemo(() => selectedCategoryId
    ? lessons.filter(l => l.category?.id === selectedCategoryId)
    : lessons, [lessons, selectedCategoryId]);

  // Pagination Logic
  const { totalPages, paginatedLessons } = useMemo(() => {
    const total = Math.ceil(filteredLessons.length / ITEMS_PER_PAGE);
    const paginated = filteredLessons.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
    return { totalPages: total, paginatedLessons: paginated };
  }, [filteredLessons, currentPage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CategoryDashboard
        onSelectCategory={(id) => {
          setSelectedCategoryId(id);
          setCurrentPage(1);
        }}
        lessonCounts={lessonCounts}
      />

      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          {selectedCategoryId === null ? 'Tất cả bài giảng' : 'Danh sách bài giảng'}
          <Badge variant="secondary" className="ml-2">
            {filteredLessons.length}
          </Badge>
        </h2>
        {selectedCategoryId !== null && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCategoryId(null);
              setCurrentPage(1);
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            Xem tất cả
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {filteredLessons.length === 0 ? (
            <div className="text-center py-12">
              <BookMarked className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                Không tìm thấy bài giảng
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                Không có bài giảng nào trong danh mục này
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Tiêu đề</TableHead>
                      <TableHead className="w-[150px] hidden md:table-cell">Giáo viên</TableHead>
                      <TableHead className="w-[120px] hidden md:table-cell">Ngày học</TableHead>
                      <TableHead className="w-[100px] hidden md:table-cell">Trạng thái</TableHead>
                      <TableHead className="w-[120px] hidden md:table-cell">Xuất bản</TableHead>
                      <TableHead className="w-[70px] text-right">Xem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLessons.map((lesson: AdminLessonDTO) => (
                      <AdminLessonRow key={lesson.id} lesson={lesson} onPreview={handlePreview} />
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4 px-4 border-t">
                  <div className="flex-1 text-sm text-muted-foreground">
                    Trang {currentPage} / {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Tiếp
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
