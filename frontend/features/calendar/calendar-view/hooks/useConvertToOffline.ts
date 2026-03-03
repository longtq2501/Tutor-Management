import { sessionsApi } from '@/lib/services/session';
import type { SessionRecord } from '@/lib/types/finance';
import type { PageResponse } from '@/lib/types/common';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ApiError {
    response?: {
        status: number;
        data?: {
            message?: string;
        };
    };
}

/**
 * Hook for reverting an online session back to offline.
 * Handles the API call, loading states, and query invalidation.
 * IMPLEMENTS: Optimistic Updates for immediate UI feedback.
 */
export function useConvertToOffline() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sessionId: number) => sessionsApi.revertToOffline(sessionId),
        onMutate: async (sessionId: number) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ['sessions'] });

            // Snapshot the previous value
            const previousSessions = queryClient.getQueriesData({ queryKey: ['sessions'] });

            // Optimistically update to the new value (isOnline = false)
            // Note: We need to match the structure of useCalendarData which uses ['sessions', month]
            // We'll iterate over all 'sessions' queries to update them
            queryClient.setQueriesData({ queryKey: ['sessions'] }, (old: PageResponse<SessionRecord> | SessionRecord[] | undefined) => {
                if (!old) return old;

                const isPage = !Array.isArray(old) && 'content' in old;
                const content = isPage ? (old.content || []) : old;

                const newContent = content.map((session: SessionRecord) => {
                    if (session.id === sessionId) {
                        return { ...session, isOnline: false };
                    }
                    return session;
                });

                return isPage ? { ...old, content: newContent } : newContent;
            });

            return { previousSessions };
        },
        onSuccess: () => {
            toast.success('Đã hủy phòng học Online thành công!', {
                description: 'Buổi học đã trở về trạng thái Offline.',
            });

            // Invalidate queries to sync UI
            queryClient.invalidateQueries({ queryKey: ['sessions'] });
            queryClient.invalidateQueries({ queryKey: ['live-sessions'] });
            queryClient.invalidateQueries({ queryKey: ['online-sessions'] });
        },
        onError: (error: ApiError, variables, context) => {
            // Rollback to the previous value if conversion fails
            if (context?.previousSessions) {
                queryClient.setQueryData(['sessions'], context.previousSessions);
            }

            const status = error.response?.status;
            const backendMessage = error.response?.data?.message;

            let userMessage = 'Không thể hủy phòng học Online';
            let description = '';

            switch (status) {
                case 403:
                    userMessage = 'Bạn không có quyền thực hiện thao tác này';
                    break;
                case 400:
                    userMessage = backendMessage || 'Không thể hủy phòng học này';
                    description = 'Không thể hủy khi phòng học đã kết thúc';
                    break;
                default:
                    userMessage = backendMessage || userMessage;
            }

            toast.error(userMessage, { description });
            console.error('Revert failed:', error);
        }
    });
}
