'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ImportExercise } from '@/features/exercise-import/ImportExercise';
import { ExerciseListItemResponse } from '@/features/exercise-import/types/exercise.types';
import { ExercisePlayer } from '@/features/submission/components/student/ExercisePlayer';
import { TeacherGradingDashboard } from '@/features/submission/components/teacher/TeacherGradingDashboard';
import { GradingView } from '@/features/submission/components/teacher/GradingView';
import { ArrowLeft, Users, Library, X } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ExerciseList } from './components/ExerciseList';
import { TutorStudentGrid } from './components/TutorStudentGrid';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StudentDetailView } from './components/StudentDetailView';
import { TutorStudentSummaryResponse } from '@/features/exercise-import/types/exercise.types';
import { DashboardHeader } from '@/contexts/UIContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';

type ViewMode = 'LIST' | 'IMPORT' | 'GRADE' | 'REVIEW';

export default function ExerciseDashboard() {
    const { user, hasAnyRole } = useAuth();
    const router = useRouter();
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [activeTab, setActiveTab] = useState<'STUDENTS' | 'LIBRARY'>('STUDENTS');
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<TutorStudentSummaryResponse | null>(null);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

    const isTeacher = hasAnyRole(['ADMIN', 'TUTOR']);
    const role = isTeacher ? 'TEACHER' : 'STUDENT';

    const handleSelectExercise = (ex: ExerciseListItemResponse, action: 'PLAY' | 'GRADE' | 'EDIT' | 'REVIEW') => {
        if (action === 'PLAY') {
            router.push(`/exercises/${ex.id}/take`);
            return;
        }

        setSelectedExerciseId(ex.id);
        if (action === 'GRADE') setViewMode('GRADE');
        if (action === 'REVIEW') {
            setSelectedSubmissionId(ex.submissionId || ex.id);
            setViewMode('REVIEW');
        }
    };

    const handleBack = () => {
        setViewMode('LIST');
        setSelectedExerciseId(null);
        setSelectedSubmissionId(null);
    };

    const headerContent = useMemo(() => {
        switch (viewMode) {
            case 'IMPORT':
                return { title: 'Thêm bài tập', subtitle: 'Nhập bài tập mới vào hệ thống', actions: <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại</Button> };
            case 'GRADE':
                return { title: selectedSubmissionId ? 'Chấm điểm bài làm' : 'Chấm điểm bài tập', subtitle: 'Đánh giá kết quả của học sinh', actions: <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại</Button> };
            case 'REVIEW':
                return { title: 'Xem lại bài tập', subtitle: 'Xem chi tiết kết quả và phản hồi', actions: <Button variant="ghost" size="sm" onClick={handleBack} className="rounded-xl"><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại</Button> };
            default:
                return {
                    title: 'Hệ thống Khảo thí',
                    subtitle: isTeacher ? "Quản lý ngân hàng câu hỏi, bài tập và theo dõi tiến độ học sinh." : "Danh sách bài tập và bài kiểm tra dành cho bạn.",
                    actions: isTeacher ? (
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'STUDENTS' | 'LIBRARY')}>
                            <TabsList className="h-10 p-1 bg-muted/50 rounded-xl border border-border/40 w-auto flex gap-2">
                                <TabsTrigger
                                    value="STUDENTS"
                                    className="rounded-lg font-bold text-xs h-8 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-2">
                                        <Users className="h-3.5 w-3.5" />
                                        <span>Theo học sinh</span>
                                    </div>
                                </TabsTrigger>
                                <TabsTrigger
                                    value="LIBRARY"
                                    className="rounded-lg font-bold text-xs h-8 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                                >
                                    <div className="flex items-center gap-2">
                                        <Library className="h-3.5 w-3.5" />
                                        <span>Thư viện bài tập</span>
                                    </div>
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    ) : null
                };
        }
    }, [viewMode, isTeacher, selectedSubmissionId, activeTab]);

    if (!user) return null;

    return (
        <TooltipProvider>
            <div className={cn("flex flex-col flex-1 min-h-0 overflow-hidden", viewMode === 'LIST' ? "md:max-h-none space-y-1.5 md:space-y-1.5" : "space-y-3 md:space-y-4")}>
                <div className="shrink-0">
                    <div data-tour="exercises-header">
                        <DashboardHeader
                            title={headerContent.title}
                            subtitle={headerContent.subtitle}
                            actions={headerContent.actions}
                        />
                    </div>
                </div>

                {viewMode === 'IMPORT' && isTeacher && (
                    <ImportExercise />
                )}

                {viewMode === 'GRADE' && (selectedExerciseId || selectedSubmissionId) && isTeacher && (
                    selectedSubmissionId ? (
                        <GradingView
                            submissionId={selectedSubmissionId}
                            onBack={handleBack}
                            isReviewMode={false}
                        />
                    ) : (
                        <TeacherGradingDashboard exerciseId={selectedExerciseId!} />
                    )
                )}

                {viewMode === 'REVIEW' && (selectedExerciseId || selectedSubmissionId) && (
                    <GradingView
                        submissionId={(selectedSubmissionId || selectedExerciseId)!}
                        onBack={handleBack}
                        isReviewMode={true}
                    />
                )}

                {viewMode === 'LIST' && (
                    <div data-tour="exercises-content" className="flex-1 flex flex-col min-h-0">
                        {isTeacher ? (
                            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'STUDENTS' | 'LIBRARY')} className="w-full flex-1 flex flex-col space-y-1 md:space-y-1.5">
                                <TabsContent value="STUDENTS" className="mt-0 outline-none flex-1 flex flex-col">
                                    {selectedStudent ? (
                                        <StudentDetailView
                                            studentSummary={selectedStudent}
                                            onBack={() => setSelectedStudent(null)}
                                            onViewExercise={(ex, action) => {
                                                if (action === 'GRADE') {
                                                    setSelectedSubmissionId(ex.submissionId || '');
                                                    setViewMode('GRADE');
                                                } else if (action === 'REVIEW') {
                                                    setSelectedSubmissionId(ex.submissionId || '');
                                                    setViewMode('REVIEW');
                                                }
                                            }}
                                        />
                                    ) : (
                                        <TutorStudentGrid onSelectStudent={setSelectedStudent} />
                                    )}
                                </TabsContent>

                                <TabsContent value="LIBRARY" className="mt-0 outline-none flex-1 flex flex-col">
                                    <ExerciseList
                                        role={role}
                                        onSelectExercise={handleSelectExercise}
                                        onCreateNew={() => setViewMode('IMPORT')}
                                    />
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <ExerciseList
                                role={role}
                                onSelectExercise={handleSelectExercise}
                            />
                        )}
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}

