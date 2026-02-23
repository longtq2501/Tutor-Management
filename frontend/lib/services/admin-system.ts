import api from './axios-instance';

export const adminSystemApi = {
    getSettings: async (): Promise<Record<string, string>> => {
        const response = await api.get('/api/admin/system/settings');
        return response.data.data;
    },

    updateSettings: async (settings: Record<string, string>): Promise<void> => {
        await api.post('/api/admin/system/settings', settings);
    }
};
