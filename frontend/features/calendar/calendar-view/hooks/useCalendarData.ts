import { sessionsApi, studentsApi } from '@/lib/services';
import type { SessionRecord, Student } from '@/lib/types';
import type { PageResponse } from '@/lib/types/common';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getMonthStr } from '../utils';

export const useCalendarData = (currentDate: Date) => {
  const queryClient = useQueryClient();
  const monthStr = getMonthStr(currentDate);

  // 1. Fetch Sessions with Cache
  const {
    data: sessionsData,
    isLoading: loadingSessions,
    isFetching: isFetchingSessions,
    isRefetching: isRefetchingSessions
  } = useQuery<PageResponse<SessionRecord> | SessionRecord[]>({
    queryKey: ['sessions', monthStr],
    queryFn: () => sessionsApi.getByMonth(monthStr),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  });

  // 2. Prefetch adjacent months
  useEffect(() => {
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);

    queryClient.prefetchQuery({
      queryKey: ['sessions', getMonthStr(nextMonth)],
      queryFn: () => sessionsApi.getByMonth(getMonthStr(nextMonth)),
      staleTime: 5 * 60 * 1000,
    });

    queryClient.prefetchQuery({
      queryKey: ['sessions', getMonthStr(prevMonth)],
      queryFn: () => sessionsApi.getByMonth(getMonthStr(prevMonth)),
      staleTime: 5 * 60 * 1000,
    });
  }, [monthStr, queryClient, currentDate]);

  // 3. Fetch Students with Cache
  const {
    data: studentsData,
    isLoading: loadingStudents
  } = useQuery<PageResponse<Student> | Student[]>({
    queryKey: ['students'],
    queryFn: () => studentsApi.getAll(),
    staleTime: 30 * 60 * 1000,
  });

  // 4. Derive Content (No more redundant local state)
  const sessions = Array.isArray(sessionsData) ? sessionsData : (sessionsData?.content || []);
  const students = Array.isArray(studentsData) ? studentsData : (studentsData?.content || []);

  const handleUpdateSession = (updated: SessionRecord) => {
    // Update the TanStack Query Cache (The Source of Truth)
    queryClient.setQueryData(['sessions', monthStr], (oldData: PageResponse<SessionRecord> | SessionRecord[] | undefined) => {
      if (!oldData) return undefined;

      const isPage = !Array.isArray(oldData) && 'content' in oldData;
      const content = isPage ? (oldData.content || []) : oldData;
      const exists = content.some((s: SessionRecord) => s.id === updated.id);

      const newContent = exists
        ? content.map((s: SessionRecord) => s.id === updated.id ? updated : s)
        : [updated, ...content];

      return isPage ? { ...oldData, content: newContent } : newContent;
    });
  };

  const loadData = async () => {
    await queryClient.invalidateQueries({ queryKey: ['sessions', monthStr] });
  };

  return {
    sessions,
    updateSession: handleUpdateSession,
    students,
    loading: loadingSessions || loadingStudents,
    isFetching: isFetchingSessions,
    isRefetching: isRefetchingSessions,
    loadData
  };
};