import type { SessionRecord } from '@/lib/types';
import type { CalendarStats } from '../types';

/**
 * Pure utility to calculate calendar statistics.
 * Should be wrapped in useMemo by the consumer if needed.
 */
export const getCalendarStats = (sessions: SessionRecord[]): CalendarStats => {
  const activeSessions = sessions.filter(s => s.status !== 'CANCELLED_BY_STUDENT' && s.status !== 'CANCELLED_BY_TUTOR');

  return {
    total: activeSessions.reduce((sum, s) => sum + s.sessions, 0),
    completed: activeSessions
      .filter(s => s.completed || s.status === 'COMPLETED' || s.status === 'PAID' || s.status === 'PENDING_PAYMENT')
      .reduce((sum, s) => sum + s.sessions, 0),
    scheduled: activeSessions
      .filter(s => !s.completed && s.status !== 'COMPLETED' && s.status !== 'PAID' && s.status !== 'PENDING_PAYMENT')
      .reduce((sum, s) => sum + s.sessions, 0),
    revenue: activeSessions.reduce((sum, s) => sum + s.totalAmount, 0),
    pending: activeSessions.filter(s => !s.paid && s.status !== 'PAID').length
  };
};