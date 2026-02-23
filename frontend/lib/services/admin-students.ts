import api from './axios-instance';
import type { AdminStudent } from '../types/admin';
import type { PageResponse } from '../types/common';
import type { StudentRequest } from '../types/student';

export const adminStudentsApi = {
    getAll: async (
        page = 0,
        size = 20,
        search = '',
        tutorId?: number,
        active?: boolean
    ): Promise<PageResponse<AdminStudent>> => {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        if (search) params.append('search', search);
        if (tutorId) params.append('tutorId', tutorId.toString());
        if (active !== undefined) params.append('active', active.toString());

        const response = await api.get(`/students?${params.toString()}`);
        return response.data.data;
    },

    getById: async (id: number): Promise<AdminStudent> => {
        const response = await api.get(`/students/${id}`);
        return response.data.data;
    },

    create: async (student: StudentRequest): Promise<AdminStudent> => {
        const response = await api.post('/students', student);
        return response.data.data;
    },

    update: async (id: number, student: StudentRequest): Promise<AdminStudent> => {
        const response = await api.put(`/students/${id}`, student);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/students/${id}`);
    },

    toggleActive: async (id: number): Promise<AdminStudent> => {
        const response = await api.put(`/students/${id}/toggle-active`);
        return response.data.data;
    },
};
