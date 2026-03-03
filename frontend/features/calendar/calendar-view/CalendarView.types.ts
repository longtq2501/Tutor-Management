import type { DragEndEvent } from '@dnd-kit/core';
import type { SessionRecord } from '@/lib/types/finance';
import type { CalendarViewType } from './components/ViewSwitcher';
import type { CalendarDay, CalendarStats } from './types';
import type { Student } from '@/lib/types/student';

/**
 * Phản hồi từ useCalendarView hook
 * Chứa toàn bộ State và Actions cho CalendarView
 */
export interface UseCalendarViewReturn {
    // === State ===
    currentDate: Date;
    currentView: CalendarViewType;
    isGenerating: boolean;
    selectedDay: CalendarDay | null;
    selectedSession: SessionRecord | null;
    showAddSessionModal: boolean;
    selectedDateStr: string;
    modalMode: 'view' | 'edit';
    contextMenu: { x: number; y: number; session: SessionRecord } | null;
    deleteConfirmationOpen: boolean;
    loadingSessions: Set<number>;
    isScrolled: boolean;
    loading: boolean;
    isInitialLoad: boolean;
    isFetching: boolean;

    // === Data Filtered (Logic moved from UI) ===
    statusFilter: string | 'ALL';
    searchQuery: string;
    filteredSessions: SessionRecord[];
    filteredCalendarDays: CalendarDay[];
    stats: CalendarStats;
    currentDayInfo: CalendarDay | null;
    students: Student[];

    // === Actions ===
    setCurrentView: (view: CalendarViewType) => void;
    setSelectedDay: (day: CalendarDay | null) => void;
    setSelectedSession: (session: SessionRecord | null) => void;
    setContextMenu: (menu: { x: number; y: number; session: SessionRecord } | null) => void;
    setStatusFilter: (filter: string | 'ALL') => void;
    setSearchQuery: (query: string) => void;
    setDeleteConfirmationOpen: (open: boolean) => void;

    // === Handlers ===
    navigateMonth: (dir: number) => void;
    goToToday: () => void;
    handleAutoGenerate: () => Promise<void>;
    handleUpdateSession: (updated: SessionRecord) => void;
    handleDeleteSession: (id: number) => Promise<void>;
    handleSessionClick: (session: SessionRecord) => void;
    handleSessionEdit: (session: SessionRecord) => void;
    handleTogglePayment: (sessionId: number, version?: number) => Promise<void>;
    handleToggleComplete: (sessionId: number, version?: number) => Promise<void>;
    handleAddSessionSubmit: (studentId: number, count: number, hours: number, date: string, month: string, subject?: string, start?: string, end?: string) => Promise<void>;
    openAddSessionModal: (dateStr: string) => void;
    closeAddSessionModal: () => void;
    handleConfirmDeleteAll: () => Promise<void>;
    exportToExcel: () => Promise<void>;
    handleContextMenu: (e: React.MouseEvent, session: SessionRecord) => void;
    handleDragEnd: (event: DragEndEvent) => void;
}
