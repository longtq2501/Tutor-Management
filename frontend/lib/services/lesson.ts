import api from './axios-instance';
import type { Lesson, LessonStats, ApiResponse, PageResponse, LessonProgress, CourseNavigation } from '../types';

export const lessonsApi = {
  /** * LẤY DANH SÁCH TẤT CẢ BÀI HỌC CỦA HỌC SINH HIỆN TẠI
   * @returns {Promise<Lesson[]>} Danh sách bài học kèm trạng thái riêng của học sinh
   */
  getAll: async (): Promise<PageResponse<Lesson>> => {
    const response = await api.get<ApiResponse<PageResponse<Lesson>>>('/student/lessons');
    return response.data.data;
  },

  /** * LẤY CHI TIẾT BÀI HỌC THEO ID
   * @param {number} id - ID của bài học
   * @returns {Promise<Lesson>} Thông tin bài học và trạng thái hoàn thành
   */
  getById: async (id: number): Promise<Lesson> => {
    const response = await api.get<ApiResponse<Lesson>>(`/student/lessons/${id}`);
    return response.data.data;
  },

  /** * LỌC DANH SÁCH BÀI HỌC THEO THÁNG VÀ NĂM
   * @param {number} year - Năm cần lọc
   * @param {number} month - Tháng cần lọc
   * @returns {Promise<Lesson[]>}
   */
  getByMonthYear: async (year: number, month: number): Promise<PageResponse<Lesson>> => {
    const response = await api.get<ApiResponse<PageResponse<Lesson>>>(
      `/student/lessons/filter?year=${year}&month=${month}`
    );
    return response.data.data;
  },

  /** * ĐÁNH DẤU BÀI HỌC LÀ ĐÃ HOÀN THÀNH (ĐÃ HIỂU)
   * @param {number} id - ID bài học
   * @returns {Promise<Lesson>} Đối tượng bài học sau khi cập nhật trạng thái
   */
  markCompleted: async (id: number): Promise<Lesson> => {
    const response = await api.post<ApiResponse<Lesson>>(`/student/lessons/${id}/complete`);
    return response.data.data;
  },

  /** * HỦY ĐÁNH DẤU HOÀN THÀNH (CHƯA HIỂU/CẦN XEM LẠI)
   * @param {number} id - ID bài học
   * @returns {Promise<Lesson>}
   */
  markIncomplete: async (id: number): Promise<Lesson> => {
    const response = await api.post<ApiResponse<Lesson>>(`/student/lessons/${id}/incomplete`);
    return response.data.data;
  },

  /** * LẤY THỐNG KÊ HỌC TẬP (TỔNG SỐ BÀI, TỶ LỆ HOÀN THÀNH...)
   * @returns {Promise<LessonStats>} Dữ liệu thống kê tổng quát
   */
  getStats: async (): Promise<LessonStats> => {
    const response = await api.get<ApiResponse<LessonStats>>('/student/lessons/stats');
    return response.data.data;
  },

  /** * CẬP NHẬT TIẾN ĐỘ XEM VIDEO
   * @param {number} lessonId - ID bài học
   * @param {number} progress - % tiến độ (0-100)
   */
  updateProgress: async (lessonId: number, progress: number): Promise<LessonProgress> => {
    const response = await api.post<ApiResponse<LessonProgress>>(`/student/progress/${lessonId}`, { progress });
    return response.data.data;
  },

  /** * LẤY THÔNG TIN ĐIỀU HƯỚNG TRONG KHÓA HỌC
   * @param {number} courseId - ID khóa học
   * @param {number} lessonId - ID bài học hiện tại
   */
  getNavigation: async (courseId: number, lessonId: number): Promise<CourseNavigation> => {
    const response = await api.get<ApiResponse<CourseNavigation>>(`/student/progress/navigation/${courseId}/${lessonId}`);
    return response.data.data;
  },
};