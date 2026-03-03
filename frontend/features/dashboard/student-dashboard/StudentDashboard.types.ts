import type { SessionRecord, Document, RecurringSchedule } from '@/lib/types';
import type { UserInfo } from '@/lib/services/auth';
import type { StudentDashboardStats } from './types/dashboard.types';

export interface UseStudentDashboardReturn {
  loading: boolean;
  stats: StudentDashboardStats;
  sessions: SessionRecord[];
  documents: Document[];
  schedule: RecurringSchedule | null;
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  user: UserInfo | null;
  hasStudentId: boolean;
}
