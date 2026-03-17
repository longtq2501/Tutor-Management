"use client";

import { RecurringScheduleModal } from '@/features/calendar/recurring-schedule/components/RecurringScheduleModal';
import { toast } from 'sonner';
import { AddSessionModal } from './components/AddSessionModal';
import { EnhancedAddStudentModal } from './components/EnhancedAddStudentModal';
import { OptimizedStudentGrid } from './components/OptimizedStudentGrid';
import { StudentDetailModal } from './components/StudentDetailModal';
import { UnifiedContactStats, UnifiedContactActions } from './components/UnifiedContactHeader';
import { useUnifiedView } from './hooks/useUnifiedView';
import { DashboardHeader } from '@/contexts/UIContext';
import { useMemo } from 'react';

export default function UnifiedContactManagement() {
    const {
        students,
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
    } = useUnifiedView();

    return (
        <div className="p-4 sm:p-6 space-y-6 sm:space-y-8 w-full">
            <DashboardHeader
                title="Học Sinh & Phụ Huynh"
                subtitle="Quản lý thông tin học sinh và phụ huynh trong hệ thống"
                actions={
                    <UnifiedContactActions
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        filter={filter}
                        onFilterChange={setFilter}
                        onAddStudent={handleAddStudent}
                    />
                }
            />

            <div data-tour="students-stats">
                <UnifiedContactStats
                    stats={stats}
                    isLoading={loading}
                    isError={isError}
                />
            </div>

            <div data-tour="students-grid">
                <OptimizedStudentGrid
                    students={students}
                    isLoading={loading}
                    isError={isError}
                    onRetry={refetch}
                    onViewSchedule={handleViewSchedule}
                    onAddSession={handleAddSession}
                    onEdit={handleEditStudent}
                    onViewDetails={handleViewDetails}
                />
            </div>

            {isModalOpen && (
                <EnhancedAddStudentModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={async () => {
                        toast.success(editingStudent ? 'Cập nhật thành công' : 'Thêm mới thành công');
                        // Đảm bảo danh sách học sinh được cập nhật ngay sau khi lưu
                        await refetch();
                    }}
                    editingStudent={editingStudent}
                />
            )}

            {scheduleModalOpen && selectedStudent && (
                <RecurringScheduleModal
                    studentId={selectedStudent.id}
                    studentName={selectedStudent.name}
                    existingSchedule={existingSchedule}
                    isLoadingData={isFetchingSchedule}
                    onClose={() => setScheduleModalOpen(false)}
                    onSuccess={() => {
                        setScheduleModalOpen(false);
                        toast.success('Cập nhật lịch cố định thành công');
                        refetch();
                    }}
                />
            )}

            {sessionModalOpen && selectedStudent && (
                <AddSessionModal
                    open={sessionModalOpen}
                    onClose={() => setSessionModalOpen(false)}
                    student={selectedStudent}
                />
            )}

            {detailModalOpen && selectedStudentDetail && (
                <StudentDetailModal
                    open={detailModalOpen}
                    student={selectedStudentDetail}
                    onClose={() => setDetailModalOpen(false)}
                    onEdit={(s) => {
                        setDetailModalOpen(false);
                        handleEditStudent(s);
                    }}
                    onAddSession={(s) => {
                        setDetailModalOpen(false);
                        handleAddSession(s);
                    }}
                    onViewSchedule={(s) => {
                        setDetailModalOpen(false);
                        handleViewSchedule(s);
                    }}
                />
            )}
        </div>
    );
}
