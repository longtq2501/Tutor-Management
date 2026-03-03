'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Check, AlertCircle } from 'lucide-react';
import {
  useAssignLibraryLesson,
  useUnassignLibraryLesson,
  useLessonAssignedStudents,
} from '../hooks/useLessonLibrary';
import { useStudents } from '../hooks/useStudents';
import type { LessonLibraryDTO } from '../types';

interface AssignStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: LessonLibraryDTO;
}

export function AssignStudentsDialog({
  open,
  onOpenChange,
  lesson,
}: AssignStudentsDialogProps) {
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Fetch students from API
  const { data: students = [], isLoading: isLoadingStudents } = useStudents();
  const { data: assignedStudents = [], isLoading: isLoadingAssigned } =
    useLessonAssignedStudents(lesson.id);
  const assignMutation = useAssignLibraryLesson();
  const unassignMutation = useUnassignLibraryLesson();

  const [prevOpen, setPrevOpen] = useState(open);

  // Sync state when dialog opens
  if (open && !prevOpen) {
    setPrevOpen(true);
    if (assignedStudents.length > 0) {
      setSelectedStudentIds(assignedStudents.map((s) => s.studentId));
    }
  } else if (!open && prevOpen) {
    setPrevOpen(false);
  }

  const handleToggleStudent = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSave = async () => {
    const currentAssignedIds = assignedStudents.map((s) => s.studentId);
    const toAssign = selectedStudentIds.filter(
      (id) => !currentAssignedIds.includes(id)
    );
    const toUnassign = currentAssignedIds.filter(
      (id) => !selectedStudentIds.includes(id)
    );

    try {
      if (toAssign.length > 0) {
        await assignMutation.mutateAsync({
          lessonId: lesson.id,
          data: { studentIds: toAssign },
        });
      }

      if (toUnassign.length > 0) {
        await unassignMutation.mutateAsync({
          lessonId: lesson.id,
          data: { studentIds: toUnassign },
        });
      }

      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const handleCancel = () => {
    // Reset to original state
    if (assignedStudents.length > 0) {
      setSelectedStudentIds(assignedStudents.map((s) => s.studentId));
    } else {
      setSelectedStudentIds([]);
    }
    onOpenChange(false);
  };

  const isLoading = assignMutation.isPending || unassignMutation.isPending;
  const hasChanges =
    JSON.stringify([...selectedStudentIds].sort()) !==
    JSON.stringify(assignedStudents.map((s) => s.studentId).sort());

  const isDataLoading = isLoadingStudents || isLoadingAssigned;

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Giao bài giảng
          </DialogTitle>
          <DialogDescription>
            Chọn học sinh để giao bài &quot;{lesson.title}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Đã chọn:{' '}
                <span className="font-semibold">{selectedStudentIds.length}</span> học sinh
              </span>
            </div>
            {assignedStudents.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3" />
                Đã giao: {assignedStudents.length}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Students List */}
          {isDataLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                Chưa có học sinh nào trong hệ thống
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-2">
                {students.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);
                  const wasAssignedBefore = assignedStudents.some(
                    (s) => s.studentId === student.id
                  );

                  return (
                    <div
                      key={student.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleToggleStudent(student.id)}
                        disabled={isLoading}
                      />
                      <Label
                        htmlFor={`student-${student.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex items-center justify-between min-w-0 gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{student.name}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {student.phone || student.parentPhone || 'Chưa có SĐT'}
                            </p>
                          </div>
                          {wasAssignedBefore && (
                            <Badge variant="outline" className="ml-2">
                              <Check className="h-3 w-3 mr-1" />
                              Đã giao
                            </Badge>
                          )}
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          {/* Warning for changes */}
          {hasChanges && !isLoading && (
            <>
              <Separator />
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Bạn có thay đổi chưa lưu. Nhấn &quot;Lưu thay đổi&quot; để áp dụng.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !hasChanges || students.length === 0}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}