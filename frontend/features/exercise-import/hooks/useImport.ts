import { useState } from 'react';
import { exerciseService } from '../services/exerciseService';
import { CreateExerciseRequest, ImportPreviewResponse } from '../types/exercise.types';
import { toast } from 'sonner';

export const useImport = (classId?: string) => {
    const [step, setStep] = useState<number>(1);
    const [previewData, setPreviewData] = useState<ImportPreviewResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const parseText = async (content: string, cid?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await exerciseService.importPreview(content, cid || classId);
            if (data.isValid) {
                // Persist the selected category into metadata for step 2
                if (cid || classId) {
                    data.metadata.classId = cid || classId;
                }
                setPreviewData(data);
                setStep(2);
            } else {
                const firstError = data.validationErrors?.[0] || "Please check the errors and try again.";
                setError(data.validationErrors.join('\n'));
                toast.error("Validation Error", {
                    description: firstError
                });
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to parse content';
            setError(message);
            toast.error("Error", {
                description: message
            });
        } finally {
            setIsLoading(false);
        }
    };

    const saveExercise = async (data: CreateExerciseRequest) => {
        setIsLoading(true);
        try {
            if (classId) {
                data.classId = classId;
            }
            await exerciseService.create(data);
            toast.success("Success", {
                description: "Exercise created successfully!"
            });
            setStep(3); // Success step or redirect
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to create exercise';
            toast.error("Error", {
                description: message
            });
        } finally {
            setIsLoading(false);
        }
    };

    const reset = () => {
        setStep(1);
        setPreviewData(null);
        setError(null);
    };

    return {
        step,
        previewData,
        isLoading,
        error,
        parseText,
        saveExercise,
        goToStep: setStep,
        reset
    };
};
