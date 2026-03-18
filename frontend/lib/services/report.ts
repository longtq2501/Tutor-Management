import api from './axios-instance';
import type {
  ApiResponse,
  MonthlyReportData,
  SaveMonthlyReportCommentRequest,
} from '../types';

export const reportApi = {
  getMonthlyReportData: async (studentId: number, month: number, year: number): Promise<MonthlyReportData> => {
    const response = await api.get<ApiResponse<MonthlyReportData>>('/reports/monthly', {
      params: { studentId, month, year },
    });
    return response.data.data;
  },

  saveComment: async (request: SaveMonthlyReportCommentRequest): Promise<void> => {
    await api.patch('/reports/monthly/comment', request);
  },

  exportPdf: async (studentId: number, month: number, year: number): Promise<Blob> => {
    const response = await api.get('/reports/monthly/export/pdf', {
      params: { studentId, month, year },
      responseType: 'blob',
    });
    return response.data;
  },

  getDataForPng: async (studentId: number, month: number, year: number): Promise<MonthlyReportData> => {
    const response = await api.get<ApiResponse<MonthlyReportData>>('/reports/monthly/export/png', {
      params: { studentId, month, year },
    });
    return response.data.data;
  },
};
