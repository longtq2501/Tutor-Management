import { recurringSchedulesApi, sessionsApi } from '@/lib/services';
import type { SessionRecord, SessionRecordUpdateRequest } from '@/lib/types/finance';
import type { DragEndEvent } from '@dnd-kit/core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { UseCalendarViewReturn } from './CalendarView.types';
import type { CalendarViewType } from './components/ViewSwitcher';
import { useCalendarData } from './hooks/useCalendarData';
import { getCalendarDays } from './hooks/useCalendarDays';
import { getCalendarStats } from './hooks/useCalendarStats';
import type { CalendarDay } from './types';
import { getMonthStr } from './utils';

/**
 * Hook useCalendarView (Refactoring Specialist Edition)
 * 
 * Chức năng: Quản lý toàn bộ State và Logic nghiệp vụ cho component CalendarView.
 * Luồng dữ liệu:
 * 1. Fetch data từ API (sessions, students) qua useCalendarData.
 * 2. Xử lý Logic lọc (statusFilter) và phân bổ dữ liệu vào CalendarDays.
 * 3. Cung cấp các Handlers để UI tương tác (Edit, Delete, Complete, v.v.)
 */
export const useCalendarView = (): UseCalendarViewReturn => {
    // === 1. State cơ bản ===
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState<CalendarViewType>('month');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
    const [selectedSession, setSelectedSession] = useState<SessionRecord | null>(null);
    const [showAddSessionModal, setShowAddSessionModal] = useState(false);
    const [selectedDateStr, setSelectedDateStr] = useState('');
    const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; session: SessionRecord } | null>(null);
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [loadingSessions, setLoadingSessions] = useState<Set<number>>(new Set());
    const [isScrolled, setIsScrolled] = useState(false);

    // === 2. State Lọc (Logic chuyển từ UI index.tsx sang) ===
    const [statusFilter, setStatusFilter] = useState<string | 'ALL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    // === 3. Xử lý Hiệu năng (Scroll listener) ===
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    setIsScrolled(window.scrollY > 50);
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // === 4. Data Fetching ===
    const { sessions, students, loading, isFetching, loadData, updateSession } = useCalendarData(currentDate);

    // Track initial load (sticky false after first true -> false transition)
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    if (!loading && !hasLoadedOnce) {
        setHasLoadedOnce(true);
    }
    const isInitialLoad = !hasLoadedOnce;

    // === 5. Logic xử lý dữ liệu & Filtering (Performance optimized) ===
    const sortedSessions = useMemo(() => {
        const sessionList = sessions || [];
        return [...sessionList].sort((a, b) => {
            const dateA = new Date(a.sessionDate).getTime();
            const dateB = new Date(b.sessionDate).getTime();
            if (dateA !== dateB) return dateA - dateB;

            // Secondary sort by startTime for same-day sessions
            const timeA = a.startTime || '';
            const timeB = b.startTime || '';
            return timeA.localeCompare(timeB);
        });
    }, [sessions]);

    const rawCalendarDays = useMemo(() => getCalendarDays(currentDate, sortedSessions), [currentDate, sortedSessions]);
    const stats = useMemo(() => getCalendarStats(sortedSessions), [sortedSessions]);

    // Grouping status filter logic for reuse
    const applyFilters = useCallback((s: SessionRecord) => {
        const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
        const matchesSearch = !searchQuery ||
            s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (s.subject && s.subject.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesStatus && matchesSearch;
    }, [statusFilter, searchQuery]);

    // Lọc sessions dựa trên statusFilter và searchQuery
    const filteredSessions = useMemo(() => sortedSessions.filter(applyFilters), [sortedSessions, applyFilters]);

    // Lọc calendarDays dựa trên statusFilter và searchQuery
    const filteredCalendarDays = useMemo(() => rawCalendarDays.map(day => ({
        ...day,
        sessions: day.sessions.filter(applyFilters)
    })), [rawCalendarDays, applyFilters]);

    // Lấy thông tin ngày hiện tại (cho Day View)
    const currentDayInfo = useMemo(() => {
        return filteredCalendarDays.find(d => d.isToday) || filteredCalendarDays[0] || null;
    }, [filteredCalendarDays]);

    // === 6. Handlers (Actions) ===

    const handleUpdateSession = useCallback((updated: SessionRecord) => {
        updateSession(updated);

        if (selectedDay) {
            setSelectedDay(prev => prev ? {
                ...prev,
                sessions: prev.sessions.map(s => s.id === updated.id ? updated : s)
            } : null);
        }

        if (selectedSession?.id === updated.id) {
            setSelectedSession(updated);
        }

        if (contextMenu?.session.id === updated.id) {
            setContextMenu(prev => prev ? { ...prev, session: updated } : null);
        }
    }, [selectedDay, selectedSession, contextMenu, updateSession]);

    const handleAutoGenerate = async () => {
        setIsGenerating(true);
        try {
            const activeSchedules = await recurringSchedulesApi.getActive();
            const studentList = students || [];
            const scheduleStudentIds = activeSchedules?.length
                ? [...new Set(activeSchedules.map((s) => s.studentId))]
                : [];

            // Nhóm C (Cảnh báo): Học sinh đang học nhưng chưa có lịch cố định -> chặn, không tạo cho ai
            const activeWithoutSchedule = studentList.filter(
                (s) => s.active && !scheduleStudentIds.includes(s.id)
            );
            if (activeWithoutSchedule.length > 0) {
                const names = activeWithoutSchedule.map((s) => s.name).join(', ');
                toast.error(
                    `Không thể tạo lịch. Học sinh ${names} chưa có lịch cố định. Vui lòng bổ sung trước.`
                );
                return;
            }

            // Nhóm A (Hợp lệ): active + có lịch cố định. Nhóm B (Skip): inactive -> bỏ qua
            const groupAStudentIds =
                activeSchedules && activeSchedules.length > 0
                    ? [...new Set(
                        activeSchedules
                            .filter((s) => {
                                const stu = studentList.find((st) => st.id === s.studentId);
                                return stu && stu.active;
                            })
                            .map((s) => s.studentId)
                    )]
                    : [];
            const skipCount =
                activeSchedules?.filter((s) => {
                    const stu = studentList.find((st) => st.id === s.studentId);
                    return stu && !stu.active;
                }).length ?? 0;

            if (!activeSchedules?.length) {
                toast.error(
                    'Bạn chưa thiết lập lịch cố định nào. Vui lòng tạo lịch cố định cho học sinh trước khi tự động tạo lịch dạy.'
                );
                return;
            }

            if (groupAStudentIds.length === 0) {
                toast.info(
                    skipCount > 0
                        ? `Không có học sinh đang học nào có lịch cố định. (Đã bỏ qua ${skipCount} học sinh đang nghỉ).`
                        : 'Không có học sinh đang học nào có lịch cố định để tạo lịch.'
                );
                return;
            }

            const monthStr = getMonthStr(currentDate);
            const promise = recurringSchedulesApi.generateSessions(monthStr, groupAStudentIds);
            toast.promise(promise, {
                loading: 'Đang tự động tạo lịch học...',
                success: () => {
                    loadData();
                    const skipMsg =
                        skipCount > 0 ? ` (Đã bỏ qua ${skipCount} học sinh đang nghỉ).` : '';
                    return `Đã chạy lệnh tự động tạo lịch học.${skipMsg}`;
                },
                error: 'Không thể tạo buổi học tự động.'
            });
            await promise;
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteSession = useCallback(async (id: number) => {
        const promise = async () => {
            await sessionsApi.delete(id);
            if (selectedDay) {
                setSelectedDay(prev => prev ? {
                    ...prev,
                    sessions: prev.sessions.filter(s => s.id !== id)
                } : null);
            }
            if (selectedSession?.id === id) {
                setSelectedSession(null);
            }
            loadData();
        };
        toast.promise(promise(), {
            loading: 'Đang xóa buổi học...',
            success: 'Đã xóa buổi học thành công',
            error: 'Lỗi khi xóa buổi học'
        });
    }, [selectedDay, selectedSession, loadData]);

    const handleSessionClick = useCallback((session: SessionRecord) => {
        setModalMode('view');
        setSelectedSession(session);
    }, []);

    const handleSessionEdit = useCallback((session: SessionRecord) => {
        setModalMode('edit');
        setSelectedSession(session);
    }, []);

    const handleTogglePayment = async (sessionId: number, version?: number) => {
        if (loadingSessions.has(sessionId)) return;
        setLoadingSessions(prev => new Set(prev).add(sessionId));

        const promise = async () => {
            let effectiveVersion = version;
            if (effectiveVersion === undefined) {
                const currentSession = sessions.find(s => s.id === sessionId);
                if (!currentSession) throw new Error("Session not found");
                effectiveVersion = currentSession.version;
            }
            const updated = await sessionsApi.togglePayment(sessionId, effectiveVersion);
            handleUpdateSession(updated);
            setLoadingSessions(prev => {
                const next = new Set(prev);
                next.delete(sessionId);
                return next;
            });
            return updated.paid ? 'Đã xác nhận thanh toán' : 'Đã hủy xác nhận thanh toán';
        };

        toast.promise(promise(), {
            loading: 'Đang cập nhật trạng thái thanh toán...',
            success: (msg) => msg,
            error: (err) => {
                setLoadingSessions(prev => {
                    const next = new Set(prev);
                    next.delete(sessionId);
                    return next;
                });
                return err instanceof Error ? err.message : 'Không thể cập nhật trạng thái thanh toán!';
            }
        });
    };

    const handleToggleComplete = async (sessionId: number, version?: number) => {
        if (loadingSessions.has(sessionId)) return;
        setLoadingSessions(prev => new Set(prev).add(sessionId));

        const promise = async () => {
            let effectiveVersion = version;
            if (effectiveVersion === undefined) {
                const currentSession = sessions.find(s => s.id === sessionId);
                if (!currentSession) throw new Error("Session not found");
                effectiveVersion = currentSession.version;
            }
            const updated = await sessionsApi.toggleCompleted(sessionId, effectiveVersion);
            handleUpdateSession(updated);
            setLoadingSessions(prev => {
                const next = new Set(prev);
                next.delete(sessionId);
                return next;
            });
            return updated.completed ? 'Đã đánh dấu hoàn thành' : 'Đã hủy đánh dấu hoàn thành';
        };

        toast.promise(promise(), {
            loading: 'Đang cập nhật trạng thái...',
            success: (msg) => msg,
            error: (err) => {
                setLoadingSessions(prev => {
                    const next = new Set(prev);
                    next.delete(sessionId);
                    return next;
                });
                return err instanceof Error ? err.message : 'Không thể cập nhật trạng thái!';
            }
        });
    };

    const handleAddSessionSubmit = async (studentId: number, count: number, hours: number, date: string, month: string, subject?: string, start?: string, end?: string) => {
        const promise = async () => {
            await sessionsApi.create({
                studentId, sessions: count, hoursPerSession: hours, sessionDate: date, month,
                subject: subject || '', startTime: start || '', endTime: end || '', status: 'SCHEDULED'
            });
            setShowAddSessionModal(false);
            setSelectedDateStr('');
            loadData();
        };
        toast.promise(promise(), {
            loading: 'Đang thêm buổi học...',
            success: 'Đã thêm buổi học thành công!',
            error: 'Lỗi khi thêm buổi học. Vui lòng thử lại.'
        });
    };

    const navigateMonth = useCallback((dir: number) => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + dir));
    }, []);

    const goToToday = useCallback(() => setCurrentDate(new Date()), []);

    const openAddSessionModal = useCallback((dateStr: string) => {
        setSelectedDateStr(dateStr);
        setShowAddSessionModal(true);
    }, []);

    const closeAddSessionModal = useCallback(() => {
        setShowAddSessionModal(false);
        setSelectedDateStr('');
    }, []);

    const handleContextMenu = useCallback((e: React.MouseEvent, session: SessionRecord) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, session });
    }, []);

    const handleConfirmDeleteAll = async () => {
        const monthStr = getMonthStr(currentDate);
        setDeleteConfirmationOpen(false);
        const promise = async () => {
            await sessionsApi.deleteByMonth(monthStr);
            loadData();
        };
        toast.promise(promise(), {
            loading: `Đang xóa tất cả buổi học tháng ${monthStr}...`,
            success: `Đã xóa tất cả buổi học tháng ${monthStr}`,
            error: 'Lỗi khi xóa dữ liệu.'
        });
    };

    const exportToExcel = async () => {
        const monthStr = getMonthStr(currentDate);
        const promise = sessionsApi.exportToExcel(monthStr);
        toast.promise(promise, {
            loading: `Đang chuẩn bị file Excel tháng ${monthStr}...`,
            success: `Đã tải xuống file Excel tháng ${monthStr}`,
            error: 'Lỗi khi xuất file Excel.'
        });
    };

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over) return;

        const session = active.data.current as SessionRecord;
        const newDate = over.id as string; // YYYY-MM-DD format

        if (session.sessionDate === newDate) return;

        // Ensure we update the month string if dragged to a different month
        const newMonth = newDate.substring(0, 7); // "YYYY-MM"

        // 1. Construct clean payload (remove undefined/null)
        const updateData: SessionRecordUpdateRequest = {
            sessionDate: newDate,
            month: newMonth,
            version: session.version
        };

        // Remove undefined keys to prevent 400 Bad Request
        Object.keys(updateData).forEach(key => {
            const k = key as keyof SessionRecordUpdateRequest;
            if (updateData[k] === undefined) delete updateData[k];
        });

        const promise = async () => {
            try {
                const result = await sessionsApi.update(session.id, updateData);
                handleUpdateSession(result);
                return `Đã dời lịch sang ngày ${newDate}`;
            } catch (error) {
                // If anything fails (400, 409, etc.), force reload to sync with server
                console.error("Drag update failed, reloading...", error);
                await loadData();
                throw error; // Re-throw to trigger toast error
            }
        };

        toast.promise(promise(), {
            loading: 'Đang dời lịch học...',
            success: (msg) => msg,
            error: 'Lỗi khi dời lịch học (đã đồng bộ lại)'
        });
    }, [handleUpdateSession, loadData]);

    return {
        currentDate, currentView, isGenerating, selectedDay, selectedSession, showAddSessionModal,
        selectedDateStr, modalMode, contextMenu, deleteConfirmationOpen, loadingSessions, isScrolled,
        loading, isInitialLoad, isFetching, statusFilter, searchQuery, filteredSessions, filteredCalendarDays, stats,
        currentDayInfo, students, setCurrentView, setSelectedDay, setSelectedSession, setContextMenu,
        setStatusFilter, setSearchQuery, setDeleteConfirmationOpen, navigateMonth, goToToday, handleAutoGenerate,
        handleUpdateSession, handleDeleteSession, handleSessionClick, handleSessionEdit,
        handleTogglePayment, handleToggleComplete, handleAddSessionSubmit, openAddSessionModal,
        closeAddSessionModal, handleConfirmDeleteAll, exportToExcel, handleContextMenu, handleDragEnd
    };
};
