import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { submissionService } from '../services/submissionService';
import { CreateSubmissionRequest } from '../types/submission.types';

export const useAutoSave = (
    exerciseId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    answers: Map<string, any>,
    intervalMs: number = 30000 // 30 seconds default
) => {
    // const { toast } = useToast(); // Removed
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const latestAnswersRef = useRef(answers);

    // Keep ref updated to avoid closure staleness in interval
    useEffect(() => {
        latestAnswersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        if (!exerciseId) return;

        const save = async () => {
            const currentAnswers = latestAnswersRef.current;
            if (currentAnswers.size === 0) return;

            setIsSaving(true);
            try {
                const request: CreateSubmissionRequest = {
                    exerciseId,
                    answers: Array.from(currentAnswers.entries()).map(([qId, val]) => ({
                        questionId: qId,
                        ...val
                    }))
                };
                await submissionService.saveDraft(request);
                setLastSaved(new Date());
            } catch (e) {
                console.error("Auto-save failed", e);
                // Silent fail for auto-save to avoid annoying user
            } finally {
                setIsSaving(false);
            }
        };

        const interval = setInterval(save, intervalMs);
        return () => clearInterval(interval);
    }, [exerciseId, intervalMs]);

    return { isSaving, lastSaved };
};
