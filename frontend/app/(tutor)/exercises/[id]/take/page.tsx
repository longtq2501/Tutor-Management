'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ExercisePlayer } from '@/features/submission/components/student/ExercisePlayer';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/shared/ProtectedRoute';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function TakeExercisePage({ params }: PageProps) {
    const resolvedParams = use(params);
    const exerciseId = resolvedParams.id;
    const router = useRouter();
    const { user } = useAuth();

    const handleExit = () => {
        // Redirection logic to return to the library tab
        router.push('/dashboard');
    };

    if (!exerciseId) return null;

    return (
        <ProtectedRoute requiredRoles={['STUDENT', 'ADMIN', 'TUTOR']}>
            <main className="w-full min-h-screen bg-background">
                <ExercisePlayer
                    exerciseId={exerciseId}
                    studentId={user?.id ? String(user.id) : undefined}
                    onExit={handleExit}
                />
            </main>
        </ProtectedRoute>
    );
}
