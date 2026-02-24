// 📁 lesson-timeline-view/index.tsx
 
'use client';

import { useRouter } from 'next/navigation';
import { useLessonTimeline } from './hooks/useLessonTimeline';
import { useLessonFilter } from './hooks/useLessonFilter';
import { StatsCards } from './components/StatsCards';
import { FilterPanel } from './components/FilterPanel';
import { LessonList } from './components/LessonList';

interface LessonTimelineViewProps {
  onLessonSelect?: (lessonId: number) => void;
}

export default function LessonTimelineView({ onLessonSelect }: LessonTimelineViewProps) {
  const router = useRouter();
  const { lessons, stats, loading } = useLessonTimeline();
  const {
    selectedYear,
    selectedMonth,
    availableYears,
    filteredLessons,
    setSelectedYear,
    setSelectedMonth,
    clearFilters,
    hasActiveFilters,
  } = useLessonFilter(lessons);

  const handleLessonClick = (lessonId: number) => {
    if (onLessonSelect) {
      onLessonSelect(lessonId);
    } else {
      router.push(`/bai-tap/lessons/${lessonId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">📚 Kho Bài Giảng</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Xem lại và ôn tập các buổi học đã qua
          </p>
        </div>
      </div>

      {stats && <StatsCards stats={stats} />}

      <FilterPanel
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        availableYears={availableYears}
        totalCount={lessons.length}
        filteredCount={filteredLessons.length}
        hasActiveFilters={hasActiveFilters}
        onYearChange={setSelectedYear}
        onMonthChange={setSelectedMonth}
        onClearFilters={clearFilters}
      />

      <LessonList lessons={filteredLessons} onLessonClick={handleLessonClick} />
    </div>
  );
}