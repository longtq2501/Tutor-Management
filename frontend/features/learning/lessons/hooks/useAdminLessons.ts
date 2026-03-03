import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { adminLessonsApi } from '@/lib/services/lesson-admin';
import type {
  CreateLessonRequest,
  UpdateLessonRequest,
} from '@/features/learning/lessons/types';
import { toast } from 'sonner';

// Query keys
export const adminLessonKeys = {
  all: ['admin-lessons'] as const,
  lists: () => [...adminLessonKeys.all, 'list'] as const,
  detail: (id: number) => [...adminLessonKeys.all, 'detail', id] as const,
  byStudent: (studentId: number) =>
    [...adminLessonKeys.all, 'student', studentId] as const,
};

/**
 * Hook để lấy tất cả bài giảng đang dạy
 */
export const useAdminLessons = () => {
  return useQuery({
    queryKey: adminLessonKeys.lists(),
    queryFn: adminLessonsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

/**
 * Hook để lấy chi tiết bài giảng
 */
export const useAdminLessonById = (id: number) => {
  return useQuery({
    queryKey: adminLessonKeys.detail(id),
    queryFn: () => adminLessonsApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook để lấy bài giảng theo học sinh
 */
export const useAdminLessonsByStudent = (studentId: number) => {
  return useQuery({
    queryKey: adminLessonKeys.byStudent(studentId),
    queryFn: () => adminLessonsApi.getByStudent(studentId),
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook để tạo bài giảng mới và giao trực tiếp
 */
export const useCreateAdminLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLessonRequest) => adminLessonsApi.create(data),
    onMutate: () => {
      const toastId = toast.loading('Đang tạo và giao bài giảng...');
      return { toastId };
    },
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: adminLessonKeys.lists() });
      toast.success('Tạo và giao bài giảng thành công!', { id: context?.toastId });
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
 * Hook để cập nhật bài giảng
 */
export const useUpdateAdminLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateLessonRequest }) =>
      adminLessonsApi.update(id, data),
    onMutate: () => {
      const toastId = toast.loading('Đang cập nhật bài giảng...');
      return { toastId };
    },
    onSuccess: (_, variables, context) => {
      queryClient.invalidateQueries({ queryKey: adminLessonKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminLessonKeys.detail(variables.id) });
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

/**
 * Hook để toggle publish status
 */
export const useTogglePublishLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminLessonsApi.togglePublish(id),
    onMutate: () => {
      const toastId = toast.loading('Đang cập nhật trạng thái...');
      return { toastId };
    },
    onSuccess: (_, id, context) => {
      queryClient.invalidateQueries({ queryKey: adminLessonKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adminLessonKeys.detail(id) });
      toast.success('Cập nhật trạng thái thành công!', { id: context?.toastId });
    },
    onError: (error: unknown, __, context) => {
      let message = 'Có lỗi xảy ra khi cập nhật trạng thái';
      if (axios.isAxiosError(error)) {
        message = error?.response?.data?.message || message;
      }
      toast.error(message, { id: context?.toastId });
    },
  });
};

/**
 * Hook để xóa bài giảng
 */
export const useDeleteAdminLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminLessonsApi.delete(id),
    onMutate: () => {
      const toastId = toast.loading('Đang xóa bài giảng...');
      return { toastId };
    },
    onSuccess: (_, __, context) => {
      queryClient.invalidateQueries({ queryKey: adminLessonKeys.lists() });
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