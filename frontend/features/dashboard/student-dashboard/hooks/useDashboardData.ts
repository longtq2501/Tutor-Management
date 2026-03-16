// ============================================================================
// FILE: student-dashboard/hooks/useDashboardData.ts (OPTIMIZED)
// ============================================================================
import type { Document, DocumentDTO, SessionRecord } from '@/lib/types';
import { api, dashboardApi, recurringSchedulesApi } from '@/lib/services';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

const formatFileSize = (size: number) => {
  if (!size || size <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const formatted = size / (1024 ** unitIndex);
  return `${formatted.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
};

const mapSessionDocument = (doc: DocumentDTO, session: SessionRecord, studentId: number): Document => {
  const sessionDate = session.sessionDate || new Date().toISOString().slice(0, 10);
  const sessionTimestamp = new Date(`${sessionDate}T${session.startTime || '00:00'}`).toISOString();

  return {
    id: doc.id,
    title: doc.title || doc.fileName,
    fileName: doc.fileName,
    filePath: doc.filePath,
    fileSize: doc.fileSize,
    fileType: doc.fileType,
    category: 'OTHER',
    categoryDisplayName: 'Tài liệu buổi học',
    description: `Đính kèm cho buổi học ngày ${sessionDate.split('-').reverse().join('/')}`,
    studentId,
    tutorId: session.tutorId,
    tutorName: session.tutorName,
    downloadCount: 0,
    createdAt: sessionTimestamp,
    updatedAt: sessionTimestamp,
    formattedFileSize: formatFileSize(doc.fileSize),
  };
};

export const useDashboardData = (studentId: number | undefined) => {
  // Use state for current month to allow toggling
  const [currentMonth, setCurrentMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  // 1. Fetch Stats (Cache-First)
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['student-stats', studentId, currentMonth],
    queryFn: () => dashboardApi.getStudentStats(studentId!, currentMonth),
    enabled: !!studentId,
    placeholderData: keepPreviousData,
    initialData: () => {
      if (typeof window !== 'undefined' && studentId) {
        const saved = localStorage.getItem(`student-stats-${studentId}-${currentMonth}`);
        return saved ? JSON.parse(saved) : undefined;
      }
      return undefined;
    },
    staleTime: 0, // Always check for updates
    refetchOnWindowFocus: true,
  });

  // 2. Fetch Sessions List (Dynamic based on selected month)
  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['student-sessions', studentId, currentMonth],
    queryFn: () => api.get(`/student/sessions?month=${currentMonth}`).then(res => res.data.data),
    enabled: !!studentId,
    refetchOnWindowFocus: true, // Ensure we refetch when user switches back to tab
  });

  // 3. Fetch Schedule
  const { data: schedule } = useQuery({
    queryKey: ['student-schedule', studentId],
    queryFn: () => recurringSchedulesApi.getByStudentId(studentId!),
    enabled: !!studentId,
    retry: false,
  });

  const sessionDocumentsMap = new Map<number, Document>();
  (sessions || []).forEach((session: SessionRecord) => {
    (session.documents || []).forEach((doc: DocumentDTO) => {
      const mappedDoc = mapSessionDocument(doc, session, studentId!);
      const existing = sessionDocumentsMap.get(doc.id);
      if (!existing || new Date(mappedDoc.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        sessionDocumentsMap.set(doc.id, mappedDoc);
      }
    });
  });

  const documents = Array.from(sessionDocumentsMap.values())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // Persist Stats to LocalStorage
  useEffect(() => {
    if (stats && studentId) {
      localStorage.setItem(`student-stats-${studentId}-${currentMonth}`, JSON.stringify(stats));
    }
  }, [stats, studentId, currentMonth]);

  const loading = loadingStats || loadingSessions;

  return {
    loading,
    stats,
    sessions: sessions || [],
    documents: documents || [],
    schedule,
    currentMonth,
    setCurrentMonth // Exposed setter
  };
};