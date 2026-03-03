import api from './axios-instance';
import type { RecurringSchedule, RecurringScheduleRequest } from '../types';

export const recurringSchedulesApi = {
  /** * LẤY DANH SÁCH TẤT CẢ LỊCH HỌC ĐỊNH KỲ
   * @returns {Promise<RecurringSchedule[]>}
   */
  getAll: async (): Promise<RecurringSchedule[]> => {
    const response = await api.get('/recurring-schedules');
    return response.data.data;
  },

  /** * LẤY DANH SÁCH CÁC LỊCH HỌC ĐANG CÒN HOẠT ĐỘNG
   * @returns {Promise<RecurringSchedule[]>}
   */
  getActive: async (): Promise<RecurringSchedule[]> => {
    const response = await api.get('/recurring-schedules/active');
    return response.data.data;
  },

  /** * LẤY CHI TIẾT LỊCH HỌC ĐỊNH KỲ THEO ID
   * @param {number} id - ID của lịch học
   * @returns {Promise<RecurringSchedule>}
   */
  getById: async (id: number): Promise<RecurringSchedule> => {
    const response = await api.get(`/recurring-schedules/${id}`);
    return response.data.data;
  },

  /** * LẤY LỊCH HỌC ĐỊNH KỲ CỦA MỘT HỌC SINH CỤ THỂ
   * @param {number} studentId - ID của học sinh
   * @returns {Promise<RecurringSchedule>}
   */
  getByStudentId: async (studentId: number): Promise<RecurringSchedule> => {
    const response = await api.get(`/recurring-schedules/student/${studentId}`);
    return response.data.data;
  },

  /** * TẠO MỚI LỊCH HỌC ĐỊNH KỲ
   * @param {RecurringScheduleRequest} data - Thông tin cấu hình lịch học (thứ, giờ, học phí...)
   * @returns {Promise<RecurringSchedule>}
   */
  create: async (data: RecurringScheduleRequest): Promise<RecurringSchedule> => {
    const response = await api.post('/recurring-schedules', data);
    return response.data.data;
  },

  /** * CẬP NHẬT THÔNG TIN LỊCH HỌC ĐỊNH KỲ
   * @param {number} id - ID lịch học cần sửa
   * @param {RecurringScheduleRequest} data - Dữ liệu cập nhật mới
   * @returns {Promise<RecurringSchedule>}
   */
  update: async (id: number, data: RecurringScheduleRequest): Promise<RecurringSchedule> => {
    const response = await api.put(`/recurring-schedules/${id}`, data);
    return response.data.data;
  },

  /** * XÓA LỊCH HỌC ĐỊNH KỲ KHỎI HỆ THỐNG
   * @param {number} id - ID lịch học cần xóa
   * @returns {Promise<void>}
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/recurring-schedules/${id}`);
  },

  /** * THAY ĐỔI TRẠNG THÁI HOẠT ĐỘNG (KÍCH HOẠT/DỪNG) CỦA LỊCH HỌC
   * @param {number} id - ID lịch học
   * @returns {Promise<RecurringSchedule>}
   */
  toggleActive: async (id: number): Promise<RecurringSchedule> => {
    const response = await api.put(`/recurring-schedules/${id}/toggle-active`);
    return response.data.data;
  },

  /** * TỰ ĐỘNG TẠO CÁC BUỔI HỌC TRONG THÁNG DỰA TRÊN LỊCH ĐỊNH KỲ
   * @param {string} month - Tháng cần tạo (Ví dụ: "2023-12")
   * @param {number[]} [studentIds] - Danh sách ID học sinh cụ thể (tùy chọn)
   */
  generateSessions: async (month: string, studentIds?: number[]): Promise<void> => {
    const response = await api.post('/recurring-schedules/generate-sessions', {
      month,
      studentIds
    });
    return response.data.data;
  },

  /** * KIỂM TRA XEM THÁNG HIỆN TẠI ĐÃ ĐƯỢC TẠO BUỔI HỌC CHƯA
   * @param {string} month - Tháng cần kiểm tra
   * @param {number} [studentId] - ID học sinh (tùy chọn)
   */
  checkMonth: async (month: string, studentId?: number): Promise<boolean> => {
    const response = await api.get('/recurring-schedules/check-month', {
      params: { month, studentId }
    });
    return response.data.data;
  },

  /** * ĐẾM SỐ LƯỢNG BUỔI HỌC DỰ KIẾN SẼ ĐƯỢC TẠO TRONG THÁNG
   * @param {string} month - Tháng cần đếm
   * @param {number[]} [studentIds] - Danh sách ID học sinh (tùy chọn)
   */
  countSessions: async (month: string, studentIds?: number[]): Promise<number> => {
    const response = await api.post('/recurring-schedules/count-sessions', {
      month,
      studentIds
    });
    return response.data.data;
  },
};