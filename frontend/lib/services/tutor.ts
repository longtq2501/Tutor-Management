import api from './axios-instance';
import type { PageResponse } from '../types/common';
import { Tutor, TutorRequest, TutorStats } from '@/lib/types/tutor';
import { Student } from '@/lib/types/student';
import { SessionRecord } from '@/lib/types/finance';
import { Document } from '@/lib/types/document';



export const tutorsApi = {
  /**
   * Get all tutors with pagination and filters
   */
  getAll: async (
    page = 0,
    size = 10,
    search = '',
    status = ''
  ): Promise<PageResponse<Tutor>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const response = await api.get(`/admin/tutors?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get tutor by ID
   */
  getById: async (id: number): Promise<Tutor> => {
    const response = await api.get(`/admin/tutors/${id}`);
    return response.data.data;
  },

  /**
   * Create new tutor
   */
  create: async (data: TutorRequest): Promise<Tutor> => {
    const response = await api.post('/admin/tutors', data);
    return response.data.data;
  },

  /**
   * Update existing tutor
   */
  update: async (id: number, data: TutorRequest): Promise<Tutor> => {
    const response = await api.put(`/admin/tutors/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete tutor
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/tutors/${id}`);
  },

  /**
   * Get tutor statistics
   */
  getStats: async (id: number): Promise<TutorStats> => {
    const response = await api.get(`/admin/tutors/${id}/stats`);
    return response.data.data;
  },

  /**
   * Toggle tutor account status
   */
  toggleStatus: async (id: number): Promise<Tutor> => {
    const response = await api.put(`/admin/tutors/${id}/toggle-status`);
    return response.data.data;
  },

  /**
   * Get students belonging to a specific tutor
   */
  getStudents: async (id: number, page = 0, size = 10): Promise<PageResponse<Student>> => {
    const response = await api.get(`/admin/tutors/${id}/students?page=${page}&size=${size}`);
    return response.data.data;
  },

  /**
   * Get sessions belonging to a specific tutor
   */
  getSessions: async (id: number, month?: string, page = 0, size = 10): Promise<PageResponse<SessionRecord>> => {
    let url = `/admin/tutors/${id}/sessions?page=${page}&size=${size}`;
    if (month) url += `&month=${month}`;
    const response = await api.get(url);
    return response.data.data;
  },

  /**
   * Get documents belonging to a specific tutor
   */
  getDocuments: async (id: number, page = 0, size = 10): Promise<PageResponse<Document>> => {
    const response = await api.get(`/admin/tutors/${id}/documents?page=${page}&size=${size}`);
    return response.data.data;
  },
};


export type { TutorRequest, Tutor, TutorStats };

