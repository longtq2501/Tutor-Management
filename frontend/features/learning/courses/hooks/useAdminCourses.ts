import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { courseAdminApi } from '@/lib/services/course-admin';
import type {
    CourseRequest,
    AssignCourseRequest,
} from '@/features/learning/courses/types';
import { toast } from 'sonner';

// Query keys
export const adminCourseKeys = {
    all: ['admin-courses'] as const,
    lists: () => [...adminCourseKeys.all, 'list'] as const,
    detail: (id: number) => [...adminCourseKeys.all, 'detail', id] as const,
    assignments: (id: number) => [...adminCourseKeys.all, 'assignments', id] as const,
};

/**
 * Hook để lấy tất cả khóa học
 */
export const useAdminCourses = () => {
    return useQuery({
        queryKey: adminCourseKeys.lists(),
        queryFn: courseAdminApi.getAll,
    });
};

/**
 * Hook để lấy chi tiết khóa học
 */
export const useAdminCourseById = (id: number) => {
    return useQuery({
        queryKey: adminCourseKeys.detail(id),
        queryFn: () => courseAdminApi.getById(id),
        enabled: !!id,
    });
};

/**
 * Hook để tạo khóa học mới
 */
export const useCreateCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CourseRequest) => courseAdminApi.create(data),
        onMutate: () => {
            const toastId = toast.loading('Đang tạo khóa học...');
            return { toastId };
        },
        onSuccess: (_, __, context) => {
            queryClient.invalidateQueries({ queryKey: adminCourseKeys.lists() });
            toast.success('Tạo khóa học thành công!', { id: context?.toastId });
        },
        onError: (error: unknown, __, context) => {
            let message = 'Có lỗi xảy ra khi tạo khóa học';
            if (axios.isAxiosError(error)) {
                message = error?.response?.data?.message || message;
            }
            toast.error(message, { id: context?.toastId });
        },
    });
};

/**
 * Hook để cập nhật khóa học
 */
export const useUpdateCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: CourseRequest }) =>
            courseAdminApi.update(id, data),
        onMutate: () => {
            const toastId = toast.loading('Đang cập nhật khóa học...');
            return { toastId };
        },
        onSuccess: (_, variables, context) => {
            queryClient.invalidateQueries({ queryKey: adminCourseKeys.lists() });
            queryClient.invalidateQueries({ queryKey: adminCourseKeys.detail(variables.id) });
            toast.success('Cập nhật khóa học thành công!', { id: context?.toastId });
        },
        onError: (error: unknown, __, context) => {
            let message = 'Có lỗi xảy ra khi cập nhật khóa học';
            if (axios.isAxiosError(error)) {
                message = error?.response?.data?.message || message;
            }
            toast.error(message, { id: context?.toastId });
        },
    });
};

/**
 * Hook để xóa khóa học
 */
export const useDeleteCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: number) => courseAdminApi.delete(id),
        onMutate: () => {
            const toastId = toast.loading('Đang xóa khóa học...');
            return { toastId };
        },
        onSuccess: (_, __, context) => {
            queryClient.invalidateQueries({ queryKey: adminCourseKeys.lists() });
            toast.success('Xóa khóa học thành công!', { id: context?.toastId });
        },
        onError: (error: unknown, __, context) => {
            let message = 'Có lỗi xảy ra khi xóa khóa học';
            if (axios.isAxiosError(error)) {
                message = error?.response?.data?.message || message;
            }
            toast.error(message, { id: context?.toastId });
        },
    });
};

/**
 * Hook để giao khóa học cho học sinh
 */
export const useAssignCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: AssignCourseRequest }) =>
            courseAdminApi.assign(id, data),
        onMutate: () => {
            const toastId = toast.loading('Đang giao khóa học...');
            return { toastId };
        },
        onSuccess: (_, variables, context) => {
            queryClient.invalidateQueries({ queryKey: adminCourseKeys.assignments(variables.id) });
            toast.success('Giao khóa học thành công!', { id: context?.toastId });
        },
        onError: (error: unknown, __, context) => {
            let message = 'Có lỗi xảy ra khi giao khóa học';
            if (axios.isAxiosError(error)) {
                message = error?.response?.data?.message || message;
            }
            toast.error(message, { id: context?.toastId });
        },
    });
};

/**
 * Hook để lấy danh sách học sinh của khóa học
 */
export const useCourseAssignments = (id: number) => {
    return useQuery({
        queryKey: adminCourseKeys.assignments(id),
        queryFn: () => courseAdminApi.getAssignments(id),
        enabled: !!id,
    });
};

/**
 * Hook để thu hồi khóa học
 */
export const useUnassignCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ courseId, studentId }: { courseId: number; studentId: number }) =>
            courseAdminApi.unassign(courseId, studentId),
        onMutate: () => {
            const toastId = toast.loading('Đang thu hồi khóa học...');
            return { toastId };
        },
        onSuccess: (_, variables, context) => {
            queryClient.invalidateQueries({ queryKey: adminCourseKeys.assignments(variables.courseId) });
            toast.success('Thu hồi khóa học thành công!', { id: context?.toastId });
        },
        onError: (error: unknown, __, context) => {
            let message = 'Có lỗi xảy ra khi thu hồi khóa học';
            if (axios.isAxiosError(error)) {
                message = error?.response?.data?.message || message;
            }
            toast.error(message, { id: context?.toastId });
        },
    });
};
