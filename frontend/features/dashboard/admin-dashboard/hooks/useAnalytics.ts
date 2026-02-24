import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/services';

const STALE_5_MINUTES = 5 * 60 * 1000;

/**
 * Fetches financial analytics for a given month.
 * Caches for 5 minutes and keeps previous data while refetching.
 */
export const useFinancialAnalytics = (month: string) =>
    useQuery({
        queryKey: ['analytics', 'finance', month],
        queryFn: () => analyticsApi.getFinancialAnalytics(month),
        staleTime: STALE_5_MINUTES,
        gcTime: 15 * 60 * 1000,
        placeholderData: keepPreviousData,
    });

/**
 * Fetches performance analytics (tutor rankings, attendance, growth).
 * Caches for 5 minutes.
 */
export const usePerformanceAnalytics = () =>
    useQuery({
        queryKey: ['analytics', 'performance'],
        queryFn: () => analyticsApi.getPerformanceAnalytics(),
        staleTime: STALE_5_MINUTES,
        gcTime: 15 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
