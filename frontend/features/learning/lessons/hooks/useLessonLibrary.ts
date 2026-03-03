import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { lessonLibraryApi } from '@/lib/services/lesson-admin';
import type {
  CreateLibraryLessonRequest,
  AssignLessonRequest,
  UpdateLessonRequest,
} from '@/features/learning/lessons/types';
import { toast } from 'sonner';

// Query keys
export const lessonLibraryKeys = {
  all: ['lesson-library'] as const,
  lists: () => [...lessonLibraryKeys.all, 'list'] as const,
  unassigned: () => [...lessonLibraryKeys.all, 'unassigned'] as const,
  students: (lessonId: number) =>
    [...lessonLibraryKeys.all, 'students', lessonId] as const,
};

export const useLessonLibrary = () => {
  return useQuery({
    queryKey: lessonLibraryKeys.lists(),
    queryFn: lessonLibraryApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

/**
 * Hook để lấy chi tiết đầy đủ của một bài giảng (bao gồm content)
 */
export const useLessonLibraryById = (id: number | undefined) => {
  return useQuery({
    queryKey: [...lessonLibraryKeys.all, 'detail', id] as const,
    queryFn: () => lessonLibraryApi.getById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  });
};

/**
 * Hook để lấy danh sách bài giảng chưa giao
 */
export const useUnassignedLessons = () => {
  return useQuery({
    queryKey: lessonLibraryKeys.unassigned(),
    queryFn: lessonLibraryApi.getUnassigned,
  });
};

/**
 * Hook để lấy danh sách học sinh đã được giao bài
 */
export const useLessonAssignedStudents = (lessonId: number) => {
  return useQuery({
    queryKey: lessonLibraryKeys.students(lessonId),
    queryFn: () => lessonLibraryApi.getAssignedStudents(lessonId),
    enabled: !!lessonId,
  });
};

/**
 * Hook để tạo bài giảng mới vào kho
 */
export const useCreateLibraryLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLibraryLessonRequest) => lessonLibraryApi.create(data),
    onMutate: () => {
      const toastId = toast.loading('Đang tạo bài giảng...');
      return { toastId };
    },
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: lessonLibraryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lessonLibraryKeys.unassigned() });
      toast.success('Tạo bài giảng thành công!', { id: context?.toastId });
    },
    onError: (error: unknown, __, context) => {
      let message = 'Có lỗi xảy ra khi tạo bài giảng';
      if (axios.isAxiosError(error)) {
        message = error?.response?.data?.message || message;
      }
      toast.error(message, { id: context?.toastId });
    },
  });
};

/**
 * Hook để giao bài giảng cho học sinh
 */
export const useAssignLibraryLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: number; data: AssignLessonRequest }) =>
      lessonLibraryApi.assign(lessonId, data),
    onMutate: () => {
      const toastId = toast.loading('Đang giao bài giảng...');
      return { toastId };
    },
    onSuccess: (_, variables, context) => {
      queryClient.invalidateQueries({ queryKey: lessonLibraryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lessonLibraryKeys.students(variables.lessonId) });
      toast.success('Giao bài giảng thành công!', { id: context?.toastId });
    },
    onError: (error: unknown, __, context) => {
      let message = 'Có lỗi xảy ra khi giao bài giảng';
      if (axios.isAxiosError(error)) {
        message = error?.response?.data?.message || message;
      }
      toast.error(message, { id: context?.toastId });
    },
  });
};

/**
 * Hook để thu hồi bài giảng
 */
export const useUnassignLibraryLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: number; data: AssignLessonRequest }) =>
      lessonLibraryApi.unassign(lessonId, data),
    onMutate: () => {
      const toastId = toast.loading('Đang thu hồi bài giảng...');
      return { toastId };
    },
    onSuccess: (_, variables, context) => {
      queryClient.invalidateQueries({ queryKey: lessonLibraryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lessonLibraryKeys.students(variables.lessonId) });
      toast.success('Thu hồi bài giảng thành công!', { id: context?.toastId });
    },
    onError: (error: unknown, __, context) => {
      let message = 'Có lỗi xảy ra khi thu hồi bài giảng';
      if (axios.isAxiosError(error)) {
        message = error?.response?.data?.message || message;
      }
      toast.error(message, { id: context?.toastId });
    },
  });
};

/**
 * Hook để xóa bài giảng khỏi kho
 */
export const useDeleteLibraryLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: number) => lessonLibraryApi.delete(lessonId),
    onMutate: () => {
      const toastId = toast.loading('Đang xóa bài giảng...');
      return { toastId };
    },
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: lessonLibraryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lessonLibraryKeys.unassigned() });
      toast.success('Xóa bài giảng thành công!', { id: context?.toastId });
    },
    onError: (error: unknown, __, context) => {
      let message = 'Có lỗi xảy ra khi xóa bài giảng';
      if (axios.isAxiosError(error)) {
        message = error?.response?.data?.message || message;
      }
      toast.error(message, { id: context?.toastId });
    },
  });
};

/**
 * Hook để cập nhật bài giảng trong kho (Sử dụng API của Admin Lesson)
 */
export const useUpdateLibraryLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLessonRequest }) =>
      // Reuse existing admin update API which works for library lessons too
      // Dynamic import to avoid circular dependency if they are in same file
      import('@/lib/services/lesson-admin').then(mod => mod.adminLessonsApi.update(id, data)),
    onMutate: () => {
      const toastId = toast.loading('Đang cập nhật bài giảng...');
      return { toastId };
    },
    onSuccess: (_, variables, context) => {
      queryClient.invalidateQueries({ queryKey: lessonLibraryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: lessonLibraryKeys.unassigned() });
      toast.success('Cập nhật bài giảng thành công!', { id: context?.toastId });
    },
    onError: (error: unknown, __, context) => {
      let message = 'Có lỗi xảy ra khi cập nhật bài giảng';
      if (axios.isAxiosError(error)) {
        message = error?.response?.data?.message || message;
      }
      toast.error(message, { id: context?.toastId });
    },
  });
};
