import api from './axios-instance';
import type { OverviewStats, MonthlyRevenue, ActivityLog, StudentGrowth, TopTutor } from '../types/admin';
import type { PageResponse } from '../types/common';

export const adminStatsApi = {
    getOverview: async (startDate?: string, endDate?: string): Promise<OverviewStats> => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const response = await api.get(`/admin/stats/overview${params.toString() ? '?' + params.toString() : ''}`);
        return response.data.data;
    },

    getMonthlyRevenue: async (months = 6): Promise<MonthlyRevenue[]> => {
        const response = await api.get(`/admin/stats/monthly-revenue?months=${months}`);
        return response.data.data;
    },

    getActivityLog: async (page = 0, size = 20): Promise<PageResponse<ActivityLog>> => {
        const response = await api.get(`/admin/activity-log?page=${page}&size=${size}`);
        return response.data.data;
    },

    getStudentGrowth: async (): Promise<StudentGrowth[]> => {
        const response = await api.get('/admin/stats/student-growth');
        return response.data.data;
    },

    getTopTutors: async (limit = 5): Promise<TopTutor[]> => {
        const response = await api.get(`/admin/stats/top-tutors?limit=${limit}`);
        return response.data.data;
    },
};
