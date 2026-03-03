import { documentsApi } from '@/lib/services/document';
import { lessonLibraryApi } from '@/lib/services/lesson-admin';
import { sessionsApi } from '@/lib/services/session';
import { Student } from '@/lib/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { addHours, format, parse, startOfHour } from 'date-fns';
import { useState, FormEvent } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for managing AddSessionModal form state and logic.
 * Handles form data, duration calculation, and submission.
 */
export function useAddSessionForm(student: Student | null, onClose: () => void, onSuccess?: () => void) {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);

    // Default to today, next hour
    const now = new Date();
    const nextHour = startOfHour(addHours(now, 1));
    const twoHoursLater = addHours(nextHour, 2);

    const [formData, setFormData] = useState({
        sessionDate: format(now, 'yyyy-MM-dd'),
        startTime: format(nextHour, 'HH:mm'),
        endTime: format(twoHoursLater, 'HH:mm'),
        subject: '',
        notes: '',
        pricePerHour: student?.pricePerHour || 0
    });

    const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
    const [selectedLessonIds, setSelectedLessonIds] = useState<number[]>([]);

    const updateField = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleDoc = (id: number) => {
        setSelectedDocIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleLesson = (id: number) => {
        setSelectedLessonIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const calculateDuration = () => {
        try {
            const start = parse(`${formData.sessionDate} ${formData.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
            const end = parse(`${formData.sessionDate} ${formData.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
            const durationMs = end.getTime() - start.getTime();
            const durationHours = durationMs / (1000 * 60 * 60);
            return durationHours > 0 ? durationHours : 0;
        } catch {
            return 0;
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!student) return;
        if (!formData.sessionDate || !formData.startTime || !formData.endTime) {
            toast.error('Vui lòng nhập đầy đủ thời gian.');
            return;
        }

        try {
            setLoading(true);

            const start = parse(`${formData.sessionDate} ${formData.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
            const end = parse(`${formData.sessionDate} ${formData.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
            const durationMs = end.getTime() - start.getTime();
            const durationHours = durationMs / (1000 * 60 * 60);

            if (durationHours <= 0) {
                toast.error('Thời gian kết thúc phải sau thời gian bắt đầu.');
                return;
            }

            await sessionsApi.create({
                studentId: student.id,
                sessionDate: formData.sessionDate,
                month: format(new Date(formData.sessionDate), 'yyyy-MM'),
                sessions: 1,
                hoursPerSession: durationHours,
                startTime: formData.startTime,
                endTime: formData.endTime,
                subject: formData.subject,
                notes: formData.notes,
                status: 'SCHEDULED',
                documentIds: selectedDocIds,
                lessonIds: selectedLessonIds
            });

            toast.success('Thêm buổi học thành công');
            await queryClient.invalidateQueries({ queryKey: ['sessions'] });
            await queryClient.invalidateQueries({ queryKey: ['students'] });

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Có lỗi xảy ra khi tạo buổi học.');
        } finally {
            setLoading(false);
        }
    };

    const { data: documentPage } = useQuery({
        queryKey: ['documents'],
        queryFn: () => documentsApi.getAll(0, 1000)
    });
    const documents = documentPage?.content || [];

    const { data: lessonsData } = useQuery({
        queryKey: ['lesson-library'],
        queryFn: () => lessonLibraryApi.getAll()
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lessons = lessonsData && !Array.isArray(lessonsData) ? (lessonsData as { content: any[] }).content : (lessonsData || []);

    return {
        formData,
        updateField,
        selectedDocIds,
        selectedLessonIds,
        toggleDoc,
        toggleLesson,
        handleSubmit,
        duration: calculateDuration(),
        loading,
        documents,
        lessons
    };
}
