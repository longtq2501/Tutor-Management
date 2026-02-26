"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useStudents } from "@/features/students/student-list/hooks/useStudents";
import { recurringSchedulesApi } from "@/lib/services/recurring-schedule";
import type { Student, RecurringSchedule } from "@/lib/types";

export function useUnifiedView() {
    const { students, loading, isError, refetch } = useStudents();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Initial values from URL
    const initialSearch = searchParams.get('search') || '';
    const initialFilter = searchParams.get('filter') || 'all';

    // State for search and filter
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [filter, setFilter] = useState(initialFilter);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    // Update URL when search/filter changes
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (searchTerm) params.set('search', searchTerm);
        else params.delete('search');

        if (filter !== 'all') params.set('filter', filter);
        else params.delete('filter');

        const query = params.toString();
        const currentQuery = searchParams.toString();
        if (query !== currentQuery) {
            router.replace(`${pathname}${query ? `?${query}` : ''}`, { scroll: false });
        }
    }, [searchTerm, filter, pathname, router, searchParams]);

    // Schedule & Session Modals
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [sessionModalOpen, setSessionModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [existingSchedule, setExistingSchedule] = useState<RecurringSchedule | null>(null);
    const [isFetchingSchedule, setIsFetchingSchedule] = useState(false);

    // Detail Modal State
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedStudentDetail, setSelectedStudentDetail] = useState<Student | null>(null);

    // Debounce search term
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Computed Stats
    const stats = useMemo(() => {
        const active = students.filter(s => s.active).length;
        const inactive = students.filter(s => !s.active).length;
        const uniqueParents = new Set(students.filter(s => s.parentId).map(s => s.parentId));

        const totalDebtValue = students.reduce((sum, s) => sum + (s.totalUnpaidTaught || 0), 0);
        const totalDebt = new Intl.NumberFormat('vi-VN').format(totalDebtValue);

        return {
            active,
            inactive,
            parents: uniqueParents.size,
            totalDebt
        };
    }, [students]);

    // Filtered Students
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            if (filter === 'active' && !student.active) return false;
            if (filter === 'inactive' && student.active) return false;

            if (debouncedSearchTerm) {
                const lowerTerm = debouncedSearchTerm.toLowerCase();
                const matchName = student.name.toLowerCase().includes(lowerTerm);
                const matchPhone = student.phone?.includes(debouncedSearchTerm) || false;
                const matchParent = student.parentName?.toLowerCase().includes(lowerTerm) || false;
                const matchParentPhone = student.parentPhone?.includes(debouncedSearchTerm) || false;

                return matchName || matchPhone || matchParent || matchParentPhone;
            }

            return true;
        });
    }, [students, filter, debouncedSearchTerm]);

    // Handlers
    const handleViewSchedule = useCallback((student: Student) => {
        setSelectedStudent(student);
        setScheduleModalOpen(true);
        setExistingSchedule(null);
        setIsFetchingSchedule(true);

        recurringSchedulesApi.getByStudentId(student.id).then(schedule => {
            setExistingSchedule(schedule || null);
        }).finally(() => {
            setIsFetchingSchedule(false);
        });
    }, []);

    const handleAddSession = useCallback((student: Student) => {
        setSelectedStudent(student);
        setSessionModalOpen(true);
    }, []);

    const handleAddStudent = useCallback(() => {
        setEditingStudent(null);
        setIsModalOpen(true);
    }, []);

    const handleEditStudent = useCallback((student: Student) => {
        setEditingStudent(student);
        setIsModalOpen(true);
    }, []);

    const handleViewDetails = useCallback((student: Student) => {
        setSelectedStudentDetail(student);
        setDetailModalOpen(true);
    }, []);

    // Sync selected student states with fresh data from students list
    useEffect(() => {
        if (selectedStudentDetail) {
            const freshData = students.find(s => s.id === selectedStudentDetail.id);
            if (freshData && freshData !== selectedStudentDetail) {
                setSelectedStudentDetail(freshData);
            }
        }
        if (selectedStudent) {
            const freshData = students.find(s => s.id === selectedStudent.id);
            if (freshData && freshData !== selectedStudent) {
                setSelectedStudent(freshData);
            }
        }
    }, [students, selectedStudentDetail, selectedStudent]);

    return {
        students: filteredStudents,
        loading,
        isError,
        refetch,
        stats,
        searchTerm,
        setSearchTerm,
        filter,
        setFilter,
        isModalOpen,
        setIsModalOpen,
        editingStudent,
        scheduleModalOpen,
        setScheduleModalOpen,
        sessionModalOpen,
        setSessionModalOpen,
        selectedStudent,
        existingSchedule,
        isFetchingSchedule,
        detailModalOpen,
        setDetailModalOpen,
        selectedStudentDetail,
        handleAddStudent,
        handleEditStudent,
        handleViewSchedule,
        handleAddSession,
        handleViewDetails,
    };
}
