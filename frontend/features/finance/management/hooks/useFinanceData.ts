'use client';

import { sessionsApi } from '@/lib/services';
import type { SessionRecord } from '@/lib/types';
import type { PageResponse } from '@/lib/types/common';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useFinanceContext } from '../context/FinanceContext';
import { groupSessionsByStudent } from '../utils/grouping';

export function useFinanceData() {
  const { viewMode, selectedDate, searchTerm, displayLimit, resetPagination } = useFinanceContext();
  const queryClient = useQueryClient();

  const formattedMonth = useMemo(() => format(selectedDate, 'yyyy-MM'), [selectedDate]);

  const fetchFn = async (): Promise<SessionRecord[]> => {
    let response: PageResponse<SessionRecord>;
    if (viewMode === 'MONTHLY') {
      response = await sessionsApi.getByMonth(formattedMonth);
    } else {
      // DEBT view - we only care about sessions that have been taught
      response = await sessionsApi.getUnpaid(0, 100, true);
    }

    // Maintain existing filtering logic but handle paginated response
    const content = response.content || [];
    if (viewMode === 'DEBT') {
      return content.filter((r: SessionRecord) => r.status && !['CANCELLED_BY_STUDENT', 'CANCELLED_BY_TUTOR'].includes(r.status));
    }
    return content;
  };

  const queryKey = viewMode === 'MONTHLY'
    ? ['sessions', formattedMonth]
    : ['unpaid-sessions'];

  const {
    data: rawRecords = [],
    isLoading: loading,
    refetch: refreshData
  } = useQuery({
    queryKey,
    queryFn: fetchFn,
    placeholderData: viewMode === 'MONTHLY' ? keepPreviousData : undefined,
    staleTime: 5 * 60 * 1000,
  });

  // Derived State: Filtering and Grouping
  const records = useMemo((): SessionRecord[] => {
    if (!rawRecords) return [];
    return Array.isArray(rawRecords) ? rawRecords : ((rawRecords as PageResponse<SessionRecord>).content || []);
  }, [rawRecords]);

  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const term = searchTerm.toLowerCase();

    // Helper to check safely
    const matches = (s?: string | null) => (s ?? '').toLowerCase().includes(term);

    return records.filter((r: SessionRecord) =>
      matches(r.studentName) ||
      matches(r.subject)
    );
  }, [records, searchTerm]);

  const allGroupedRecords = useMemo(() => {
    return groupSessionsByStudent(filteredRecords);
  }, [filteredRecords]);

  // Client-side pagination for DEBT view
  const paginatedGroupedRecords = useMemo(() => {
    if (viewMode === 'MONTHLY') {
      return allGroupedRecords; // No pagination for monthly view
    }
    return allGroupedRecords.slice(0, displayLimit);
  }, [allGroupedRecords, displayLimit, viewMode]);

  const hasMore = useMemo(() => {
    return viewMode === 'DEBT' && allGroupedRecords.length > displayLimit;
  }, [allGroupedRecords.length, displayLimit, viewMode]);

  // Reset pagination when view mode or search term changes
  useEffect(() => {
    resetPagination();
  }, [viewMode, searchTerm, resetPagination]);

  // Shared Actions
  const deleteRecord = async (id: number) => {
    if (!confirm('Xóa buổi học này?')) return;

    const promise = async () => {
      await sessionsApi.delete(id);

      // Invalidate both potential keys to be safe
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['unpaid-sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] })
      ]);
    };

    toast.promise(promise(), {
      loading: 'Đang xóa buổi học...',
      success: 'Đã xóa buổi học thành công',
      error: 'Lỗi khi xóa buổi học'
    });
  };

  const togglePayment = async (id: number) => {
    // This logic is mainly for Monthly view single toggle
    const promise = async () => {
      await sessionsApi.togglePayment(id);
      await queryClient.invalidateQueries({ queryKey: ['sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['unpaid-sessions'] });
    };

    toast.promise(promise(), {
      loading: 'Đang cập nhật...',
      success: 'Đã cập nhật thanh toán',
      error: 'Lỗi cập nhật'
    });
  };

  return {
    records: records,
    filteredRecords,
    groupedRecords: paginatedGroupedRecords,
    loading,
    refreshData,
    deleteRecord,
    togglePayment,
    hasMore,
    totalCount: allGroupedRecords.length,
  };
}
