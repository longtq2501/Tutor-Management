'use client';

import { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Loader2,
  Search,
  UserMinus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { lessonLibraryApi } from '@/lib/services';
import { studentsApi } from '@/lib/services';
import type { LessonLibraryDTO } from '../types';
import type { StudentAssignmentDTO } from '../types';
import { AnimatePresence, motion } from 'framer-motion';

interface UnassignStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: LessonLibraryDTO;
}

interface StudentWithAssignment {
  id: number;
  name: string;
  phone: string | null;
  isAssigned: boolean;
}

interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

/**
 * Sticky selection toolbar that remains visible during scroll.
 * Displays selection count and bulk action controls.
 * Animates in/out when selections change.
 */
function SelectionToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute bottom-20 left-4 right-4 z-10"
      >
        <div className="bg-primary text-primary-foreground p-3 rounded-lg shadow-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bold text-sm">
              {selectedCount}
            </div>
            <span className="text-sm font-medium">
              Đã chọn {selectedCount}/{totalCount}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClearSelection}
              className="h-8"
            >
              Bỏ chọn
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={onSelectAll}
              className="h-8"
            >
              {selectedCount === totalCount ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function UnassignStudentsDialog({
  open,
  onOpenChange,
  lesson,
}: UnassignStudentsDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch danh sách học sinh đã được giao bài
  const { data: assignedStudents = [], isLoading, error } = useQuery({
    queryKey: ['lesson-library-assigned-students', lesson.id],
    queryFn: async () => {
      try {
        const result = await lessonLibraryApi.getAssignedStudents(lesson.id);

        if (!result || result.length === 0) {
          return [];
        }

        const firstItem = result[0];

        // Nếu có studentId và studentName => StudentAssignmentDTO
        if ('studentId' in firstItem && 'studentName' in firstItem) {
          const allStudents = await studentsApi.getAll(0, 1000);
          const studentMap = new Map(allStudents.content.map(s => [s.id, s]));

          return (result as any[])
            .map(assignment => {
              const student = studentMap.get(assignment.studentId);
              if (!student) return null;

              return {
                id: student.id,
                name: student.name,
                phone: student.phone || null,
                isAssigned: true,
              } as StudentWithAssignment;
            })
            .filter((s): s is StudentWithAssignment => s !== null);
        }

        // Nếu có id và name => Student[] (API đã trả về students trực tiếp)
        if ('id' in firstItem && 'name' in firstItem) {
          return (result as unknown as { id: number; name: string; phone?: string | null }[]).map(student => ({
            id: student.id,
            name: student.name,
            phone: student.phone || null,
            isAssigned: true,
          } as StudentWithAssignment));
        }

        return [];
      } catch (err) {
        throw err;
      }
    },
    enabled: open,
    retry: 1,
  });

  // Mutation để thu hồi bài giảng
  const unassignMutation = useMutation({
    mutationFn: (studentIds: number[]) =>
      lessonLibraryApi.unassign(lesson.id, { studentIds }),
    onSuccess: () => {
      toast.success('Thu hồi bài giảng thành công', {
        description: `Đã thu hồi bài giảng từ ${selectedStudentIds.length} học sinh`,
      });
      queryClient.invalidateQueries({ queryKey: ['lesson-library'] });
      queryClient.invalidateQueries({
        queryKey: ['lesson-library-assigned-students', lesson.id]
      });
      setSelectedStudentIds([]);
      setShowConfirmDialog(false);
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      let errorMessage = 'Có lỗi xảy ra';
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || errorMessage;
      }
      toast.error('Thu hồi bài giảng thất bại', {
        description: errorMessage,
      });
    },
  });

  // Filter students based on search
  const filteredStudents = assignedStudents.filter((student) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.phone?.toLowerCase().includes(searchLower)
    );
  });

  const handleToggleStudent = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const handleUnassign = () => {
    if (selectedStudentIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một học sinh');
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmUnassign = () => {
    unassignMutation.mutate(selectedStudentIds);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !unassignMutation.isPending) {
      setSelectedStudentIds([]);
      setSearchQuery('');
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5 text-destructive" />
              Thu hồi bài giảng
            </DialogTitle>
            <DialogDescription>
              Thu hồi bài giảng &quot;<strong>{lesson.title}</strong>&quot; từ các học sinh
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <XCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-sm text-destructive">
                Có lỗi xảy ra khi tải danh sách học sinh
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 relative">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm học sinh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Student list */}
              {assignedStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Chưa có học sinh nào được giao bài giảng này
                  </p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <XCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Không tìm thấy học sinh nào
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[350px] rounded-md border">
                  <div className="p-4 space-y-2">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-accent transition-colors"
                      >
                        <Checkbox
                          checked={selectedStudentIds.includes(student.id)}
                          onCheckedChange={() => handleToggleStudent(student.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{student.name}</div>
                          {student.phone && (
                            <div className="text-sm text-muted-foreground">
                              {student.phone}
                            </div>
                          )}
                        </div>
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Đã giao
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Sticky selection toolbar */}
              <SelectionToolbar
                selectedCount={selectedStudentIds.length}
                totalCount={filteredStudents.length}
                onSelectAll={handleSelectAll}
                onClearSelection={() => setSelectedStudentIds([])}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={unassignMutation.isPending}
            >
              Đóng
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnassign}
              disabled={
                selectedStudentIds.length === 0 ||
                unassignMutation.isPending ||
                isLoading
              }
            >
              {unassignMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <UserMinus className="mr-2 h-4 w-4" />
              Thu hồi ({selectedStudentIds.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thu hồi bài giảng</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn thu hồi bài giảng &quot;
              <span className="font-semibold">{lesson.title}</span>&quot; từ{' '}
              <span className="font-semibold">{selectedStudentIds.length}</span> học
              sinh đã chọn?
              <br />
              <br />
              Học sinh sẽ không thể xem bài giảng này nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unassignMutation.isPending}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUnassign}
              disabled={unassignMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {unassignMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Thu hồi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}