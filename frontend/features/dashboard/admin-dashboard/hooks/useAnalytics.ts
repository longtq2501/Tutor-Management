import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/services/analytics-api';

export const useFinancialAnalytics = (month?: string) => {
    return useQuery({
        queryKey: ['analytics-finance', month],
        queryFn: () => analyticsApi.getFinancialAnalytics(month),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

export const usePerformanceAnalytics = () => {
    return useQuery({
        queryKey: ['analytics-performance'],
        queryFn: () => analyticsApi.getPerformanceAnalytics(),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};
