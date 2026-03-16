import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonsApi } from '@/lib/services';
import { toast } from 'sonner';
import type { Lesson, CourseNavigation, LessonResource, LessonProgress } from '@/lib/types';

// Query keys for student lessons
export const studentLessonKeys = {
  all: ['student-lessons'] as const,
  detail: (id: number) => [...studentLessonKeys.all, id] as const,
  navigation: (courseId: number, lessonId: number) => [...studentLessonKeys.all, 'navigation', courseId, lessonId] as const,
};

export function useLessonDetail(lessonId: number, isPreview = false, courseId?: number) {
  const queryClient = useQueryClient();

  // Fetch lesson data with React Query
  const { data: lesson, isLoading: loading } = useQuery({
    queryKey: isPreview ? ['admin-lesson-preview', lessonId] : studentLessonKeys.detail(lessonId),
    queryFn: async () => {
      if (isPreview) {
        const mod = await import('@/lib/services/lesson-admin');
        const adminLesson = await mod.adminLessonsApi.getById(lessonId);

        const previewLesson: Lesson = {
          id: adminLesson.id,
          tutorName: adminLesson.tutorName,
          title: adminLesson.title,
          summary: adminLesson.summary,
          content: adminLesson.content,
          lessonDate: adminLesson.lessonDate,
          videoUrl: adminLesson.videoUrl,
          thumbnailUrl: adminLesson.thumbnailUrl,
          studentId: 0,
          studentName: 'Preview Mode',
          isCompleted: false,
          viewCount: 0,
          images: (adminLesson.images || []).map(img => ({
            id: img.id || 0,
            imageUrl: img.imageUrl,
            caption: img.caption,
            displayOrder: img.displayOrder || 0
          })),
          resources: (adminLesson.resources || []).map(res => ({
            id: res.id || 0,
            title: res.resourceName,
            description: '',
            resourceUrl: res.resourceUrl,
            resourceType: (res.resourceType as LessonResource['resourceType']) || 'DOCUMENT',
            fileSize: res.fileSize,
            displayOrder: 0
          })),
          createdAt: adminLesson.createdAt,
          updatedAt: adminLesson.updatedAt,
          category: adminLesson.category,
        };
        return previewLesson;
      }
      return lessonsApi.getById(lessonId);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  // Fetch course navigation if courseId is present
  const { data: navigation } = useQuery({
    queryKey: studentLessonKeys.navigation(courseId || 0, lessonId),
    queryFn: () => lessonsApi.getNavigation(courseId!, lessonId),
    enabled: !!courseId && !isPreview,
    staleTime: 1 * 60 * 1000,
  });

  // Mutation for syncing video progress
  const { mutate: syncProgress } = useMutation({
    mutationFn: (progress: number) => lessonsApi.updateProgress(lessonId, progress),
    onSuccess: (updatedProgress: LessonProgress) => {
      // Optimistically update the lesson cache if needed
      if (updatedProgress.isCompleted && lesson && !lesson.isCompleted) {
        queryClient.setQueryData<Lesson>(studentLessonKeys.detail(lessonId), (old) => {
          if (!old) return old;
          return { ...old, isCompleted: true, completedAt: new Date().toISOString() };
        });
        toast.success('🎉 Bạn đã hoàn thành bài học!');
        queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      }
      // Invalidate navigation to check for unlocks
      if (courseId) {
        queryClient.invalidateQueries({ queryKey: studentLessonKeys.navigation(courseId, lessonId) });
      }
    }
  });

  // Mutation for toggling completion status
  const { mutate: toggleComplete, isPending: markingComplete } = useMutation({
    mutationFn: async () => {
      if (!lesson) throw new Error('No lesson data');

      return lesson.isCompleted
        ? lessonsApi.markIncomplete(lessonId)
        : lessonsApi.markCompleted(lessonId);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: studentLessonKeys.detail(lessonId) });
      const previousLesson = queryClient.getQueryData<Lesson>(studentLessonKeys.detail(lessonId));

      if (previousLesson) {
        queryClient.setQueryData<Lesson>(studentLessonKeys.detail(lessonId), {
          ...previousLesson,
          isCompleted: !previousLesson.isCompleted,
          completedAt: !previousLesson.isCompleted ? new Date().toISOString() : previousLesson.completedAt,
        });
      }

      return { previousLesson };
    },
    onSuccess: (updatedLesson) => {
      queryClient.setQueryData<Lesson>(studentLessonKeys.detail(lessonId), updatedLesson);
      queryClient.invalidateQueries({ queryKey: studentLessonKeys.all });
      queryClient.invalidateQueries({ queryKey: ['my-courses'] });
      queryClient.invalidateQueries({ queryKey: ['student-course-detail'] });

      toast.success(
        updatedLesson.isCompleted
          ? '✅ Đã đánh dấu hoàn thành! Tiến độ khóa học đã được cập nhật.'
          : '❌ Đã bỏ đánh dấu'
      );
    },
    onError: (error: Error, _, context) => {
      if (context?.previousLesson) {
        queryClient.setQueryData(studentLessonKeys.detail(lessonId), context.previousLesson);
      }
      console.error('Failed to toggle completion:', error);
      toast.error('Không thể cập nhật trạng thái');
    },
  });

  return {
    lesson: lesson ?? null,
    loading,
    markingComplete,
    toggleComplete,
    navigation: (navigation as CourseNavigation) ?? null,
    syncProgress
  };
}
