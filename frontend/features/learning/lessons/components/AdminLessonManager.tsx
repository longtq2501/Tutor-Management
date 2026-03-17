'use client';

import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GraduationCap, Library } from 'lucide-react';
import { LessonLibraryTab } from './LessonLibraryTab';
import { CourseManagementTab } from '../../courses/components/CourseManagementTab';
import { motion } from 'framer-motion';
import { useLessonLibrary } from '../hooks/useLessonLibrary';
import { useAdminCourses } from '../../courses/hooks/useAdminCourses';
import { Badge } from '@/components/ui/badge';
import { DashboardHeader } from '@/contexts/UIContext';

/**
 * Admin Lesson Manager - Main component for ADMIN/TUTOR
 * Quản lý bài giảng cho giáo viên
 */
export function AdminLessonManager() {
  const { data: lessonsData } = useLessonLibrary();
  const libraryLessonsCount = useMemo(() => {
    if (!lessonsData) return 0;
    if (Array.isArray(lessonsData)) return lessonsData.length;
    return lessonsData.totalElements ?? lessonsData.content?.length ?? 0;
  }, [lessonsData]);

  const { data: courses = [] } = useAdminCourses();

  return (
    <div className="flex flex-col">
      <Tabs defaultValue="library" className="flex flex-col flex-1 min-h-0">
        <DashboardHeader
          title="Quản Lý Bài Giảng"
          subtitle="Nền tảng quản lý kho học liệu và xây dựng lộ trình học tập chuyên nghiệp cho giáo viên."
          actions={
            <TabsList data-tour="lessons-tabs" className="h-10 p-1 bg-muted/50 rounded-xl border border-border/40 w-auto flex gap-2">
              <TabsTrigger
                value="library"
                className="rounded-lg font-bold text-xs h-8 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2">
                  <Library className="h-3.5 w-3.5" />
                  <span>Kho học liệu</span>
                  <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-[10px] font-bold">
                    {libraryLessonsCount}
                  </Badge>
                </div>
              </TabsTrigger>

              <TabsTrigger
                value="courses"
                className="rounded-lg font-bold text-xs h-8 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Khóa học</span>
                  <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-[10px] font-bold">
                    {courses.length}
                  </Badge>
                </div>
              </TabsTrigger>
            </TabsList>
          }
        />

        <div data-tour="lessons-content" className="flex-1 relative">
          <TabsContent value="library" className="h-full mt-0 focus-visible:outline-none focus-visible:ring-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full lg:overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6"
            >
              <LessonLibraryTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="courses" className="h-full mt-0 focus-visible:outline-none focus-visible:ring-0">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full lg:overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6"
            >
              <CourseManagementTab />
            </motion.div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

export default AdminLessonManager;
