import axios from 'axios';
import type {
  Student,
  StudentRequest,
  SessionRecord,
  SessionRecordRequest,
  DashboardStats,
  MonthlyStats,
  DocumentCategory,
  DocumentStats,
  DocumentUploadRequest,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Students API
export const studentsApi = {
  getAll: () => api.get<Student[]>('/students'),
  getById: (id: number) => api.get<Student>(`/students/${id}`),
  create: (data: StudentRequest) => api.post<Student>('/students', data),
  update: (id: number, data: StudentRequest) => api.put<Student>(`/students/${id}`, data),
  delete: (id: number) => api.delete(`/students/${id}`),
};

// Sessions API
export const sessionsApi = {
  getAll: () => api.get<SessionRecord[]>('/sessions'),
  getByMonth: (month: string) => api.get<SessionRecord[]>(`/sessions/month/${month}`),
  getMonths: () => api.get<string[]>('/sessions/months'),
  create: (data: SessionRecordRequest) => api.post<SessionRecord>('/sessions', data),
  togglePayment: (id: number) => api.put<SessionRecord>(`/sessions/${id}/toggle-payment`),
  delete: (id: number) => api.delete(`/sessions/${id}`),
};

// Dashboard API
export const dashboardApi = {
  getStats: (currentMonth: string) => api.get<DashboardStats>('/dashboard/stats', {
    params: { currentMonth }
  }),
  getMonthlyStats: () => api.get<MonthlyStats[]>('/dashboard/monthly-stats'),
};

// Documents API
export const documentsApi = {
  getAll: () => api.get<Document[]>('/documents'),
  getById: (id: number) => api.get<Document>(`/documents/${id}`),
  getByCategory: (category: DocumentCategory) => api.get<Document[]>(`/documents/category/${category}`),
  search: (keyword: string) => api.get<Document[]>('/documents/search', { params: { keyword } }),
  upload: (file: File, data: DocumentUploadRequest) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    return api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  download: (id: number) => api.get(`/documents/${id}/download`, { 
    responseType: 'blob' 
  }),
  delete: (id: number) => api.delete(`/documents/${id}`),
  getStats: () => api.get<DocumentStats>('/documents/stats'),
  getCategories: () => api.get<DocumentCategory[]>('/documents/categories'),
};

export default api;