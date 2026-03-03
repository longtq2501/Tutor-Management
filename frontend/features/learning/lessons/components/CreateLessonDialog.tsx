'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, Users } from 'lucide-react';
import { useCreateAdminLesson } from '../hooks/useAdminLessons';
import { useStudents } from '../hooks/useStudents';
import { LessonForm } from './LessonForm';
import type { LessonFormData } from '../types';

interface CreateLessonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateLessonDialog({
  open,
  onOpenChange,
}: CreateLessonDialogProps) {
  const [step, setStep] = useState<'form' | 'students'>('form');
  const [formData, setFormData] = useState<LessonFormData | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);

  // Fetch students from API
  const { data: students = [], isLoading: isLoadingStudents } = useStudents();
  const createMutation = useCreateAdminLesson();

  const handleFormSubmit = (data: LessonFormData) => {
    setFormData(data);
    setStep('students');
  };

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleFinalSubmit = () => {
    if (!formData) return;

    createMutation.mutate(
      {
        tutorName: formData.tutorName,
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        lessonDate: formData.lessonDate!,
        videoUrl: formData.videoUrl,
        thumbnailUrl: formData.thumbnailUrl,
        images: formData.images || [],
        resources: formData.resources || [],
        isPublished: formData.isPublished || false,
        categoryId: formData.categoryId,
        studentIds: selectedStudentIds,
      },
      {
        onSuccess: () => {
          handleReset();
          onOpenChange(false);
        },
      }
    );
  };

  const handleReset = () => {
    setStep('form');
    setFormData(null);
    setSelectedStudentIds([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  const handleBack = () => {
    setStep('form');
  };

  if (step === 'form') {
    return (
      <LessonForm
        open={open}
        onOpenChange={handleOpenChange}
        mode="create"
        onSubmit={handleFormSubmit}
        isLoading={false}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Chọn học sinh
          </DialogTitle>
          <DialogDescription>
            Chọn học sinh để giao bài giảng &quot;{formData?.title}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Đã chọn:{' '}
                <span className="font-semibold">{selectedStudentIds.length}</span>{' '}
                học sinh
              </span>
            </div>
          </div>

          <Separator />

          {isLoadingStudents ? (
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
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {students.map((student) => {
                  const isSelected = selectedStudentIds.includes(student.id);

                  return (
                    <div
                      key={student.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={isSelected}
                        onCheckedChange={() => handleStudentToggle(student.id)}
                        disabled={createMutation.isPending}
                      />
                      <Label
                        htmlFor={`student-${student.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.phone || student.parentPhone || 'Chưa có SĐT'}
                          </p>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={createMutation.isPending}
              className="flex-1"
            >
              Quay lại
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={createMutation.isPending || selectedStudentIds.length === 0}
              className="flex-1"
            >
              {createMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Tạo & giao bài
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}