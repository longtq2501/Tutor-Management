import type { Student, StudentRequest, ApiResponse } from '../types';
import type { PageResponse } from '../types/common';
import api from './axios-instance';

export const studentsApi = {
  /** * LẤY DANH SÁCH TẤT CẢ HỌC SINH (PHÂN TRANG)
   * @param {number} page - Số trang (bắt đầu từ 0)
   * @param {number} size - Kích thước trang
   * @returns {Promise<PageResponse<Student>>} Đối tượng phân trang học sinh
   */
  getAll: async (page = 0, size = 100): Promise<PageResponse<Student>> => {
    const response = await api.get<ApiResponse<PageResponse<Student>>>(`/students?page=${page}&size=${size}`);
    return response.data.data;
  },

  getById: async (id: number): Promise<Student> => {
    const response = await api.get<ApiResponse<Student>>(`/students/${id}`);
    return response.data.data;
  },

  create: async (data: StudentRequest): Promise<Student> => {
    const response = await api.post<ApiResponse<Student>>('/students', data);
    return response.data.data;
  },

  update: async (id: number, data: StudentRequest): Promise<Student> => {
    const response = await api.put<ApiResponse<Student>>(`/students/${id}`, data);
    return response.data.data;
  },

  /** * XÓA HỌC SINH KHỎI HỆ THỐNG
   * @param {number} id - ID học sinh cần xóa
   * @returns {Promise<void>}
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/students/${id}`);
  },

  toggleActive: async (id: number): Promise<Student> => {
    const response = await api.put<ApiResponse<Student>>(`/students/${id}/toggle-active`);
    return response.data.data;
  },
};