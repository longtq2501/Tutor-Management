import { useUI } from '@/contexts/UIContext';
import { sessionsApi } from '@/lib/services';
import { documentsApi } from '@/lib/services/document';
import { lessonLibraryApi } from '@/lib/services/lesson-admin';
import type { SessionRecord, SessionRecordUpdateRequest } from '@/lib/types/finance';
import type { LessonStatus } from '@/lib/types/lesson-status';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { LessonDetailFormData, LessonDetailModalProps } from './types';

import { isCancelledStatus, isCompletedStatus } from '@/lib/types/lesson-status';
import { useConvertToOnline } from '../../hooks/useConvertToOnline';
import { useConvertToOffline } from '../../hooks/useConvertToOffline';

// Debounce Hook (internal)
function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);

    return debouncedValue;
}

export function useLessonDetailModal({ session, onClose, onUpdate, onDelete, initialMode = 'view' }: LessonDetailModalProps) {
    const [localSession, setLocalSession] = useState<SessionRecord>(session);
    const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
    const [formData, setFormData] = useState<LessonDetailFormData>({
        startTime: session.startTime || '',
        endTime: session.endTime || '',
        subject: session.subject || '',
        notes: session.notes || '',
        status: (session.status || 'SCHEDULED') as LessonStatus,
    });
    const [loading, setLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [showConvertConfirm, setShowConvertConfirm] = useState(false);
    const [showRevertConfirm, setShowRevertConfirm] = useState(false);

    // Tab and filter state
    const [activeTab, setActiveTab] = useState<'lessons' | 'documents'>('lessons');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Library selection state
    const [selectedLessonIds, setSelectedLessonIds] = useState<Set<number>>(new Set());
    const [selectedDocumentIds, setSelectedDocumentIds] = useState<Set<number>>(new Set());

    // Conversion logic
    const { mutate: convertToOnline, isPending: isConvertingToOnline } = useConvertToOnline();
    const { mutate: revertToOffline, isPending: isRevertingToOffline } = useConvertToOffline();

    const isConverting = isConvertingToOnline || isRevertingToOffline;

    const canConvert = useMemo(() => {
        if (!localSession.status) return false;
        const status = localSession.status as LessonStatus;
        return !isCompletedStatus(status) && !isCancelledStatus(status);
    }, [localSession.status]);

    const handleConvertToOnline = async () => {
        convertToOnline(localSession.id, {
            onSuccess: () => {
                setLocalSession(prev => ({ ...prev, isOnline: true }));
                toast.success('Đã chuyển sang chế độ Online'); // Duplicate toast? Hook has one too.
            }
        });
    };

    const handleRevertToOffline = async () => {
        revertToOffline(localSession.id, {
            onSuccess: () => {
                setLocalSession(prev => ({ ...prev, isOnline: false }));
            }
        });
    };

    // Fetch Library Data
    const { data: libraryLessons = [] } = useQuery({
        queryKey: ['admin-lesson-library'],
        queryFn: async () => {
            try {
                const response = await lessonLibraryApi.getAll();
                return response.content;
            } catch (err) {
                console.error("Failed to fetch lesson library", err);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const { data: documentPage } = useQuery({
        queryKey: ['admin-document-library'],
        queryFn: async () => {
            try {
                // FETCH ALL DOCUMENTS to ensure correct count and filtering
                // Increased limit from 100 to 2000 to cover all existing documents
                // TODO: Implement server-side filtering if document count exceeds 2000
                return await documentsApi.getAll(0, 2000);
            } catch (err) {
                console.error("Failed to fetch document library", err);
                return null;
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const libraryDocuments = documentPage?.content || [];

    // Initialize selection from session
    useEffect(() => {
        if (session.lessons) {
            setSelectedLessonIds(new Set(session.lessons.map(l => l.id)));
        }
        if (session.documents) {
            setSelectedDocumentIds(new Set(session.documents.map(d => d.id)));
        }
    }, [session]);

    useEffect(() => {
        const hasChanges =
            formData.startTime !== (localSession.startTime || '') ||
            formData.endTime !== (localSession.endTime || '') ||
            formData.subject !== (localSession.subject || '') ||
            formData.notes !== (localSession.notes || '') ||
            formData.status !== (localSession.status || 'SCHEDULED') ||
            isSelectionDirty();
        setIsDirty(hasChanges);
    }, [formData, localSession, selectedLessonIds, selectedDocumentIds]);

    const isSelectionDirty = () => {
        const initialLessonIds = new Set(session.lessons?.map(l => l.id) || []);
        const initialDocIds = new Set(session.documents?.map(d => d.id) || []);

        if (selectedLessonIds.size !== initialLessonIds.size) return true;
        if (selectedDocumentIds.size !== initialDocIds.size) return true;

        for (const id of selectedLessonIds) if (!initialLessonIds.has(id)) return true;
        for (const id of selectedDocumentIds) if (!initialDocIds.has(id)) return true;

        return false;
    };

    useEffect(() => {
        setFormData({
            startTime: localSession.startTime || '',
            endTime: localSession.endTime || '',
            subject: localSession.subject || '',
            notes: localSession.notes || '',
            status: (localSession.status || 'SCHEDULED') as LessonStatus,
        });
    }, [localSession]);

    useEffect(() => {
        // Only sync from props if the prop actually changed (e.g. from parent re-fetch)
        // and we are NOT in the middle of an internal state update from handleSubmit
        if (session.version !== localSession.version) {
            setLocalSession(session);
        }
    }, [session, localSession.version]);

    const { openDialog, closeDialog } = useUI();

    useEffect(() => {
        openDialog();
        document.body.style.overflow = 'hidden';
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            closeDialog();
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    interface LibraryItem {
        id: number;
        title?: string;
        category?: string | { name: string };
        categoryName?: string;
        categoryDisplayName?: string;
        createdAt?: string;
    }

    const getCategoryName = (item: LibraryItem): string => {
        // For Documents: Prefer display name or dynamic name
        if (item.categoryDisplayName) return item.categoryDisplayName;
        if (item.categoryName) return item.categoryName;

        // For Lessons: Category is an object with name
        if (item.category && typeof item.category === 'object' && 'name' in item.category) {
            return item.category.name;
        }

        // Fallback: Return string (Enum key) or default
        if (typeof item.category === 'string') return item.category;
        return 'Chưa phân loại';
    };

    const filteredItems = useMemo(() => {
        const items = (activeTab === 'lessons' ? libraryLessons : libraryDocuments) as LibraryItem[];

        return items
            .filter(item => {
                const title = item.title?.toLowerCase() || '';
                if (!title.includes(debouncedSearch.toLowerCase())) return false;
                const category = getCategoryName(item);
                if (selectedCategory !== 'all' && category !== selectedCategory) return false;
                return true;
            })
            .sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
    }, [activeTab, libraryLessons, libraryDocuments, debouncedSearch, selectedCategory]);

    const categories: string[] = useMemo(() => {
        const items = (activeTab === 'lessons' ? libraryLessons : libraryDocuments) as LibraryItem[];
        const cats = items.map((item) => getCategoryName(item));
        const uniqueCats = Array.from(new Set(cats)).filter(Boolean);
        return ['all', ...uniqueCats];
    }, [activeTab, libraryLessons, libraryDocuments]);

    const toggleSelection = useCallback((id: number) => {
        if (activeTab === 'lessons') {
            setSelectedLessonIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                return newSet;
            });
        } else {
            setSelectedDocumentIds(prev => {
                const newSet = new Set(prev);
                if (newSet.has(id)) newSet.delete(id);
                else newSet.add(id);
                return newSet;
            });
        }
    }, [activeTab]);

    const globalSelectedCount = selectedLessonIds.size + selectedDocumentIds.size;
    const currentTabSelectedCount = activeTab === 'lessons' ? selectedLessonIds.size : selectedDocumentIds.size;


    const calculateHours = (start: string, end: string) => {
        if (!start || !end) return session.hours;
        const [h1, m1] = start.split(':').map(Number);
        const [h2, m2] = end.split(':').map(Number);
        let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
        if (diff <= 0) diff += 24 * 60;
        return diff / 60;
    };

    const currentHours = calculateHours(formData.startTime, formData.endTime);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setLoading(true);
        try {
            const updatePayload: SessionRecordUpdateRequest = {
                ...formData,
                hoursPerSession: currentHours,
                version: localSession.version,
                lessonIds: Array.from(selectedLessonIds),
                documentIds: Array.from(selectedDocumentIds)
            };
            const updated = await sessionsApi.update(localSession.id, updatePayload);
            toast.success('Đã cập nhật buổi học thành công!');

            // Critical: Update both internal states immediately
            setLocalSession(updated);

            // Also ensure selection sets are in sync with the updated response
            if (updated.lessons) setSelectedLessonIds(new Set(updated.lessons.map(l => l.id)));
            if (updated.documents) setSelectedDocumentIds(new Set(updated.documents.map(d => d.id)));

            onUpdate?.(updated);
            setMode('view');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Lỗi khi cập nhật buổi học');
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicate = async () => {
        setLoading(true);
        try {
            const duplicated = await sessionsApi.duplicate(localSession.id);
            toast.success('Đã nhân bản buổi học sang tuần sau!');
            onUpdate?.(duplicated);
            onClose();
        } catch (err) {
            toast.error('Lỗi khi nhân bản buổi học');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = () => {
        if (localSession.id && onDelete) {
            onDelete(localSession.id);
            onClose();
        }
    };

    return {
        // State
        localSession,
        mode,
        setMode,
        formData,
        setFormData,
        loading,
        isDirty,
        confirmDeleteOpen,
        setConfirmDeleteOpen,
        showConvertConfirm,
        setShowConvertConfirm,
        showRevertConfirm,
        setShowRevertConfirm,
        activeTab,
        setActiveTab,
        searchTerm,
        setSearchTerm,
        selectedCategory,
        setSelectedCategory,
        selectedLessonIds,
        selectedDocumentIds,

        // Data
        libraryLessons,
        libraryDocuments,
        filteredItems,
        categories,
        globalSelectedCount,
        currentTabSelectedCount,
        currentHours,

        // Handlers
        toggleSelection,
        handleSubmit,
        handleDuplicate,
        handleDelete,
        handleConvertToOnline,
        handleRevertToOffline,
        canConvert,
        isConverting,
        getCategoryName
    };
}
