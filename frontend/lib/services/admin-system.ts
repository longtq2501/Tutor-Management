import api from './axios-instance';

export const adminSystemApi = {
    getSettings: async (): Promise<Record<string, string>> => {
        const response = await api.get('/admin/system/settings');
        return response.data.data;
    },

    updateSettings: async (settings: Record<string, string>): Promise<void> => {
        await api.post('/admin/system/settings', settings);
    }
};
