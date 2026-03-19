'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { exerciseService } from '@/features/exercise-import/services/exerciseService';
import { queryKeys } from '@/lib/hooks/useQueryKeys';
import { studentsApi } from '@/lib/services/student';
import { lessonCategoryApi } from '@/lib/services/lesson-category';
import { toast } from 'sonner';
import { useExercises, useInfiniteAssignedExercises } from '../hooks/useExercises';
import { ExerciseListItemResponse } from '@/features/exercise-import/types/exercise.types';
import { PageResponse } from '@/lib/types';
import { LessonCategoryDTO } from '@/features/learning/lessons/types';
import { useConfirm } from '@/hooks/useConfirm';
import axios from 'axios';

/**
 * Orchestrates state and side effects for the exercise library.
 */
export const useExerciseListLogic = (role: string) => {
    const queryClient = useQueryClient();
    const { confirm, ConfirmationDialog } = useConfirm();
    const isStudent = role === 'STUDENT';

    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

    const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState<ExerciseListItemResponse | null>(null);
    const [assignStudentId, setAssignStudentId] = useState<string>('');
    const [assignDeadline, setAssignDeadline] = useState<string>('');
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const { data: categories = [] } = useQuery<LessonCategoryDTO[]>({
        queryKey: ['lesson-categories'],
        queryFn: () => lessonCategoryApi.getAll(),
        enabled: !isStudent
    });

    const infiniteResult = useInfiniteAssignedExercises(12);

    const { data: exercisesData, isLoading: isExercisesLoading } = useExercises(
        selectedCategory === 'ALL' ? undefined : selectedCategory,
        undefined,
        debouncedSearch || undefined,
        page,
        pageSize
    );

    const exercises = isStudent
        ? (infiniteResult.data?.pages.flatMap(p => p.content) || [])
        : ((exercisesData as PageResponse<ExerciseListItemResponse>)?.content || []);

    const totalElements = isStudent
        ? (infiniteResult.data?.pages[0]?.totalElements || 0)
        : ((exercisesData as PageResponse<ExerciseListItemResponse>)?.totalElements || 0);

    const totalPages = isStudent
        ? (infiniteResult.data?.pages[0]?.totalPages || 1)
        : ((exercisesData as PageResponse<ExerciseListItemResponse>)?.totalPages || 1);

    const { data: students = [], isLoading: isStudentsLoading } = useQuery({
        queryKey: queryKeys.students.all,
        queryFn: async () => {
            const data = await studentsApi.getAll(0, 1000);
            // Handle both PageResponse and plain array structures to avoid cache collision issues
            const content = Array.isArray(data) ? data : (data?.content || []);
            return content.filter(s => s.active && s.accountId);
        },
        enabled: !isStudent
    });

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();

        const confirmed = await confirm({
            title: 'Xóa bài kiểm tra?',
            description: 'Bài kiểm tra và toàn bộ dữ liệu nộp/chấm liên quan sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.',
            confirmText: 'Xóa',
            cancelText: 'Hủy',
            variant: 'destructive',
        });
        if (!confirmed) return;

        try {
            await exerciseService.delete(id);
            toast.success('Đã xóa bài kiểm tra');
            await queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
        } catch (error) {
            let message = 'Không thể xóa bài kiểm tra';
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.message || error.message || message;
            }
            toast.error(message);
        }
    };

    const handleOpenAssign = (ex: ExerciseListItemResponse, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedExercise(ex);
        setAssignDeadline(ex.deadline ? new Date(ex.deadline).toISOString().slice(0, 16) : '');
        setIsAssignDialogOpen(true);
    };

    const handleAssign = async () => {
        if (!selectedExercise || !assignStudentId) return;
        try {
            setIsAssigning(true);
            await exerciseService.assign(selectedExercise.id, {
                studentId: assignStudentId,
                deadline: assignDeadline ? new Date(assignDeadline).toISOString() : undefined
            });
            toast.success("Đã giao bài tập thành công");
            setIsAssignDialogOpen(false);
            setAssignStudentId('');
            setAssignDeadline('');
            queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
        } catch (error) {
            toast.error("Không thể giao bài tập");
        } finally {
            setIsAssigning(false);
        }
    };

    return {
        page, setPage, pageSize,
        searchTerm, setSearchTerm,
        selectedCategory, setSelectedCategory,
        categories,
        exercises, totalElements, totalPages,
        isExercisesLoading: isStudent ? infiniteResult.isLoading : isExercisesLoading,
        isFetchingNextPage: infiniteResult.isFetchingNextPage,
        hasNextPage: infiniteResult.hasNextPage,
        fetchNextPage: infiniteResult.fetchNextPage,
        students, isStudentsLoading,
        isAssignDialogOpen, setIsAssignDialogOpen,
        selectedExercise,
        assignStudentId, setAssignStudentId,
        assignDeadline, setAssignDeadline,
        isAssigning,
        ConfirmationDialog,
        handleDelete, handleOpenAssign, handleAssign
    };
};
