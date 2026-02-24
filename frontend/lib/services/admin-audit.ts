import api from './axios-instance';
import type { AuditLog } from '../types/admin';
import type { PageResponse } from '../types/common';

/**
 * Service for administrative auditing and monitoring.
 */
export const adminAuditApi = {
    /**
     * Retrieves a paginated list of system audit logs.
     * @param page Page index (0-based).
     * @param size Number of items per page.
     */
    getAuditLogs: async (
        page = 0,
        size = 20,
        search?: string,
        actionType?: string
    ): Promise<PageResponse<AuditLog>> => {
        const params = new URLSearchParams({ page: String(page), size: String(size) });
        if (search) params.set('search', search);
        if (actionType) params.set('actionType', actionType);
        const response = await api.get(`/admin/audit-logs?${params}`);
        return response.data.data;
    },
};
