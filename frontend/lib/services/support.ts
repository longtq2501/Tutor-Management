import api from './axios-instance';
import { SupportConversation, SupportMessage } from '../types/support';

const BASE = '/support';

export const supportApi = {
    getMyConversation: async (): Promise<SupportConversation> => {
        const res = await api.get(`${BASE}/my-conversation`);
        return res.data.data;
    },

    getMyMessages: async (page = 0, size = 50): Promise<SupportMessage[]> => {
        const res = await api.get(`${BASE}/my-conversation/messages`, { params: { page, size } });
        return res.data.data;
    },

    // ── Admin ───────────────────────────────────────────────────────────────

    getAllConversations: async (): Promise<SupportConversation[]> => {
        const res = await api.get(`${BASE}/admin/conversations`);
        return res.data.data;
    },

    getConversationMessages: async (id: number, page = 0, size = 50): Promise<SupportMessage[]> => {
        const res = await api.get(`${BASE}/admin/conversations/${id}/messages`, { params: { page, size } });
        return res.data.data;
    },

    updateStatus: async (id: number, status: 'OPEN' | 'RESOLVED'): Promise<SupportConversation> => {
        const res = await api.patch(`${BASE}/admin/conversations/${id}/status`, null, { params: { status } });
        return res.data.data;
    },
};
