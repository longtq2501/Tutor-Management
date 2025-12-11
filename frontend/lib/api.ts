// src/lib/api.ts
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
  InvoiceRequest,
  InvoiceResponse,
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
  getAll: async (): Promise<Student[]> => {
    const response = await api.get('/students');
    return response.data;
  },
  getById: async (id: number): Promise<Student> => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },
  create: async (data: StudentRequest): Promise<Student> => {
    const response = await api.post('/students', data);
    return response.data;
  },
  update: async (id: number, data: StudentRequest): Promise<Student> => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/students/${id}`);
  },
  toggleActive: async (id: number): Promise<Student> => {
    const response = await api.put(`/students/${id}/toggle-active`);
    return response.data;
  },
};

// Sessions API
export const sessionsApi = {
  getAll: async (): Promise<SessionRecord[]> => {
    const response = await api.get('/sessions');
    return response.data;
  },
  getByMonth: async (month: string): Promise<SessionRecord[]> => {
    const response = await api.get(`/sessions/month/${month}`);
    return response.data;
  },
  getMonths: async (): Promise<string[]> => {
    const response = await api.get('/sessions/months');
    return response.data;
  },
  create: async (data: SessionRecordRequest): Promise<SessionRecord> => {
    const response = await api.post('/sessions', data);
    return response.data;
  },
  togglePayment: async (id: number): Promise<SessionRecord> => {
    const response = await api.put(`/sessions/${id}/toggle-payment`);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/sessions/${id}`);
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: async (currentMonth: string): Promise<DashboardStats> => {
    const response = await api.get('/dashboard/stats', {
      params: { currentMonth }
    });
    return response.data;
  },
  getMonthlyStats: async (): Promise<MonthlyStats[]> => {
    const response = await api.get('/dashboard/monthly-stats');
    return response.data;
  },
};

// Documents API
export const documentsApi = {
  getAll: async (): Promise<Document[]> => {
    const response = await api.get('/documents');
    return response.data;
  },
  getById: async (id: number): Promise<Document> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },
  getByCategory: async (category: DocumentCategory): Promise<Document[]> => {
    const response = await api.get(`/documents/category/${category}`);
    return response.data;
  },
  search: async (keyword: string): Promise<Document[]> => {
    const response = await api.get('/documents/search', { params: { keyword } });
    return response.data;
  },
  upload: async (file: File, data: DocumentUploadRequest): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    const response = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  download: async (id: number): Promise<Blob> => {
    const response = await api.get(`/documents/${id}/download`, { 
      responseType: 'blob' 
    });
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },
  getStats: async (): Promise<DocumentStats> => {
    const response = await api.get('/documents/stats');
    return response.data;
  },
  getCategories: async (): Promise<DocumentCategory[]> => {
    const response = await api.get('/documents/categories');
    return response.data;
  },
};

// Invoice API
export const invoicesApi = {
  generateInvoice: async (request: InvoiceRequest): Promise<InvoiceResponse> => {
    const response = await api.post('/invoices/generate', request);
    return response.data;
  },

  downloadInvoicePDF: async (request: InvoiceRequest): Promise<Blob> => {
    const response = await api.post('/invoices/download-pdf', request, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default api;