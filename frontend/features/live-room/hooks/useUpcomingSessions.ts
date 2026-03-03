import { onlineSessionApi } from '@/lib/services/onlineSession';
import { useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import type { WindowResponse } from '@/lib/types/common';
import type { OnlineSessionResponse } from '@/lib/types/onlineSession';

/**
 * Hook for fetching and paginating upcoming online sessions for the current user.
 * Uses cursor-based pagination (Window) from the backend.
 * 
 * @param {number} size - Number of sessions to fetch per page
 * @returns {object} Infinite query object
 */
export function useUpcomingSessions(size: number = 5) {
    return useInfiniteQuery<
        WindowResponse<OnlineSessionResponse>,
        Error,
        InfiniteData<WindowResponse<OnlineSessionResponse>>,
        string[],
        string | undefined
    >({
        queryKey: ['live-sessions', 'upcoming'],
        queryFn: ({ pageParam }) => onlineSessionApi.getMySessions(pageParam, size),
        initialPageParam: undefined,
        getNextPageParam: (lastPage) => {
            if (lastPage.last) return undefined;
            // Ensure position is valid string or undefined
            return (lastPage.position as any)?.value ? String((lastPage.position as any).value) : undefined;
        },
        staleTime: 30 * 1000, // 30 seconds
        gcTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
    });
}
