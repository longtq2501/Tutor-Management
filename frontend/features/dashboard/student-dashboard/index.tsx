'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Clock, FileText, Sparkles } from 'lucide-react';
import { DocumentsSection } from './components/DocumentsSection';
import { LoadingState } from './components/LoadingState';
import { MonthlySessionsList } from './components/MonthlySessionsList';
import { ProgressSection } from './components/ProgressSection';
import { ScheduleSection } from './components/ScheduleSection';
import { StatCard } from './components/StatCard';
import { UnlinkedAccountState } from './components/UnlinkedAccountState';
import { WelcomeSection } from './components/WelcomeSection';
import { useStudentDashboard } from './useStudentDashboard';
import { DashboardHeader } from '@/contexts/UIContext';

/**
 * Component StudentDashboard (Refactoring Specialist Edition)
 * 
 * Chức năng: Màn hình Dashboard chính dành cho Sinh viên.
 * UI-ONLY: Chỉ chịu trách nhiệm sắp xếp layout (Grid) và truyền data vào các Sub-components.
 * Toàn bộ Logic fetch data và xử lý "Safe Stats" được đẩy vào useStudentDashboard.
 */
export default function StudentDashboard() {
  const {
    user,
    loading,
    stats,
    sessions,
    documents,
    schedule,
    currentMonth,
    setCurrentMonth,
    hasStudentId
  } = useStudentDashboard();

  // 1. Loading State
  if (loading) return <LoadingState />;

  // 2. Unlinked Account State
  if (!hasStudentId) return <UnlinkedAccountState />;

  return (
    <div className="space-y-8 relative">
      {/* Thông báo chúc mừng khi hoàn thành mục tiêu */}
      <AnimatePresence>
        {stats.showConfetti && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-10 z-50 pointer-events-none"
          >
            <div className="bg-yellow-400/20 p-4 rounded-full backdrop-blur-md border border-yellow-400/50 flex items-center gap-2 text-yellow-600 dark:text-yellow-300 font-bold shadow-xl">
              <Sparkles className="animate-spin-slow" />
              <span>Tuyệt vời! Đã hoàn thành mục tiêu tháng!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <DashboardHeader
        title="Tổng Quan"
        subtitle="Theo dõi tiến độ học tập và lịch học của bạn"
      />

      {/* Lời chào */}
      <WelcomeSection
        userName={user?.fullName || ''}
        quote={stats.motivationalQuote}
      />

      {/* Grid Chỉ số chính */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Buổi Học Tháng Này"
          value={stats.totalSessionsRaw}
          subtitle={`${stats.completedSessionsRaw} buổi đã hoàn thành`}
          icon={<BookOpen className="text-white" size={24} />}
          variant="blue"
          progressBar={{
            percentage: stats.totalSessionsRaw > 0
              ? (stats.completedSessionsRaw / stats.totalSessionsRaw) * 100
              : 0,
            color: 'blue'
          }}
        />

        <StatCard
          title="Tổng Số Giờ"
          value={stats.totalHoursFormatted}
          subtitle="Thời gian học tháng này"
          icon={<Clock className="text-white" size={24} />}
          variant="indigo"
          badge={
            <div className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-md border border-white/10">
              Tháng {currentMonth.split('-')[1]}
            </div>
          }
        />

        <StatCard
          title="Tài Liệu"
          value={documents.length}
          subtitle="Tài liệu học tập"
          icon={<FileText className="text-white" size={24} />}
          variant="purple"
        />
      </div>

      {/* Nội dung chính: Lịch học và Thời khóa biểu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlySessionsList
            sessions={sessions}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            isLoading={loading}
          />
        </div>

        <div className="space-y-6">
          {schedule && <ScheduleSection schedule={schedule} />}
          <DocumentsSection documents={documents} />
        </div>
      </div>

      {/* Phần tiến độ chi tiết */}
      <ProgressSection
        completedSessions={stats.completedSessionsRaw}
        totalHours={stats.totalHoursRaw}
        totalSessions={stats.totalSessionsRaw}
        completedLessons={stats.completedLessonsRaw}
        totalLessons={stats.totalLessonsRaw}
        lessonProgressPercentage={stats.lessonProgressPercentage}
      />
    </div>
  );
}
