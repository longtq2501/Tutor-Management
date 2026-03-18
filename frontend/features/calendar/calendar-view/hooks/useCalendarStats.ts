import type { SessionRecord } from '@/lib/types';
import type { CalendarStats } from '../types';

/**
 * Pure utility to calculate calendar statistics.
 * Should be wrapped in useMemo by the consumer if needed.
 */
export const getCalendarStats = (sessions: SessionRecord[]): CalendarStats => {
  const activeSessions = sessions.filter(s => s.status !== 'CANCELLED_BY_STUDENT' && s.status !== 'CANCELLED_BY_TUTOR');
  const completedStatuses = new Set(['COMPLETED', 'PAID', 'PENDING_PAYMENT']);

  return {
    total: sessions.length,
    completed: activeSessions
      .filter(s => s.completed || (s.status ? completedStatuses.has(s.status) : false))
      .length,
    scheduled: activeSessions
      .filter(s => !s.completed && (!s.status || !completedStatuses.has(s.status)))
      .length,
    revenue: activeSessions.reduce((sum, s) => sum + s.totalAmount, 0),
    pending: activeSessions.filter(s => !s.paid && s.status !== 'PAID').length
  };
};