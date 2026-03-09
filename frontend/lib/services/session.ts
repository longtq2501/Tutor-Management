import api from './axios-instance';
import type { SessionRecord, SessionRecordRequest, SessionRecordUpdateRequest } from '../types';
import type { PageResponse } from '../types/common';
import type { OnlineSessionResponse } from '../types/onlineSession';

export const sessionsApi = {
  /** * LẤY DANH SÁCH TẤT CẢ CÁC BUỔI HỌC
   * @returns {Promise<PageResponse<SessionRecord>>}
   */
  getAll: async (page = 0, size = 100): Promise<PageResponse<SessionRecord>> => {
    const response = await api.get(`/sessions?page=${page}&size=${size}`);
    return response.data.data;
  },

  /** * LẤY DANH SÁCH BUỔI HỌC THEO THÁNG CỤ THỂ
   * @param {string} month - Định dạng tháng (Ví dụ: "2023-12")
   * @returns {Promise<PageResponse<SessionRecord>>}
   */
  getByMonth: async (month: string, page = 0, size = 100): Promise<PageResponse<SessionRecord>> => {
    const response = await api.get(`/sessions/month/${month}?page=${page}&size=${size}`);
    return response.data.data;
  },

  /** * LẤY DANH SÁCH CÁC THÁNG ĐÃ CÓ DỮ LIỆU BUỔI HỌC
   * @returns {Promise<string[]>} Mảng các chuỗi định dạng tháng
   */
  getMonths: async (): Promise<string[]> => {
    const response = await api.get('/sessions/months');
    return response.data.data;
  },

  /** * TẠO MỚI MỘT BẢN GHI BUỔI HỌC
   * @param {SessionRecordRequest} data - Thông tin buổi học mới
   * @returns {Promise<SessionRecord>}
   */
  create: async (data: SessionRecordRequest): Promise<SessionRecord> => {
    const response = await api.post('/sessions', data);
    return response.data.data;
  },

  /** * CẬP NHẬT THÔNG TIN BUỔI HỌC
   * @param {number} id - ID buổi học cần sửa
   * @param {Partial<SessionRecordRequest>} data - Dữ liệu cập nhật một phần
   * @returns {Promise<SessionRecord>}
   */
  update: async (id: number, data: SessionRecordUpdateRequest): Promise<SessionRecord> => {
    const response = await api.put(`/sessions/${id}`, data);
    return response.data.data;
  },

  /** * THAY ĐỔI TRẠNG THÁI THANH TOÁN CỦA BUỔI HỌC
   * @param {number} id - ID buổi học
   * @returns {Promise<SessionRecord>}
   */
  togglePayment: async (id: number, version?: number): Promise<SessionRecord> => {
    const response = await api.put(`/sessions/${id}/toggle-payment`, null, {
      params: { version }
    });
    return response.data.data;
  },

  /** * XÓA BẢN GHI BUỔI HỌC KHỎI HỆ THỐNG
   * @param {number} id - ID buổi học cần xóa
   * @returns {Promise<void>}
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/sessions/${id}`);
  },

  /** * LẤY DANH SÁCH CÁC BUỔI HỌC CHƯA ĐƯỢC THANH TOÁN
   * @returns {Promise<PageResponse<SessionRecord>>}
   */
  getUnpaid: async (page = 0, size = 100, taughtOnly?: boolean): Promise<PageResponse<SessionRecord>> => {
    const params: any = { page, size };
    if (taughtOnly !== undefined) params.taughtOnly = taughtOnly;
    const response = await api.get('/sessions/unpaid', { params });
    return response.data.data;
  },

  /** * THAY ĐỔI TRẠNG THÁI HOÀN THÀNH (ĐÃ DẠY/CHƯA DẠY) CỦA BUỔI HỌC
   * @param {number} id - ID buổi học
   * @returns {Promise<SessionRecord>}
   */
  toggleCompleted: async (id: number, version?: number): Promise<SessionRecord> => {
    const response = await api.put(`/sessions/${id}/toggle-completed`, null, {
      params: { version }
    });
    return response.data.data;
  },

  /**
   * Lấy thông tin chi tiết của một buổi học
   */
  getById: async (id: number): Promise<SessionRecord> => {
    const response = await api.get(`/sessions/${id}`);
    return response.data.data;
  },

  /**
   * Cập nhật trạng thái buổi học (Optimistic Locking)
   */
  updateStatus: async (id: number, newStatus: string, version: number): Promise<SessionRecord> => {
    const response = await api.patch(`/sessions/${id}/status`, null, {
      params: { newStatus, version }
    });
    return response.data.data;
  },

  /**
   * Nhân bản một buổi học
   */
  duplicate: async (id: number): Promise<SessionRecord> => {
    const response = await api.post(`/sessions/${id}/duplicate`);
    return response.data.data;
  },

  /**
   * Chuyển đổi buổi học sang Online
   */
  convertToOnline: async (id: number): Promise<OnlineSessionResponse> => {
    const response = await api.patch(`/sessions/${id}/convert-to-online`);
    return response.data.data;
  },

  /**
   * Xóa tất cả các buổi học trong một tháng cụ thể
   * @param {string} month - Định dạng tháng (Ví dụ: "2023-12")
   * @returns {Promise<void>}
   */
  deleteByMonth: async (month: string): Promise<void> => {
    await api.delete(`/sessions/month/${month}`);
  },

  /**
   * Chuyển đổi buổi học Online về trạng thái Offline
   */
  revertToOffline: async (id: number): Promise<void> => {
    await api.patch(`/sessions/${id}/revert-to-offline`);
  },

  /**
   * Xuất danh sách buổi học ra file Excel
   */
  exportToExcel: async (month?: string, studentId?: number): Promise<void> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (studentId) params.append('studentId', studentId.toString());

    const response = await api.get('/sessions/export/excel', {
      params,
      responseType: 'blob',
    });

    // Create blob link to download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const fileName = `Sessions_Export_${month || 'All'}.xlsx`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};