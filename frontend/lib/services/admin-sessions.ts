import axiosInstance from "./axios-instance";
import type { SessionRecord } from "../types/finance";
import type { PageResponse } from "../types/common";

export const adminSessionsApi = {
    getAll: async (page = 0, size = 10, search = '', month = '', paid?: boolean): Promise<PageResponse<SessionRecord>> => {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        if (search) params.append('search', search);
        if (month) params.append('month', month);
        if (paid !== undefined) params.append('paid', paid.toString());

        const response = await axiosInstance.get(`/sessions?${params.toString()}`);
        return response.data.data;
    },

    getByMonth: async (month: string, page = 0, size = 10): Promise<PageResponse<SessionRecord>> => {
        const response = await axiosInstance.get(`/sessions/month/${month}?page=${page}&size=${size}`);
        return response.data.data;
    },

    getMonths: async (): Promise<string[]> => {
        const response = await axiosInstance.get('/sessions/months');
        return response.data.data;
    },

    getById: async (id: number): Promise<SessionRecord> => {
        const response = await axiosInstance.get(`/sessions/${id}`);
        return response.data.data;
    },

    togglePayment: async (id: number): Promise<SessionRecord> => {
        const response = await axiosInstance.put(`/sessions/${id}/toggle-payment`);
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await axiosInstance.delete(`/sessions/${id}`);
    }
};
