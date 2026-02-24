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
    getAuditLogs: async (page = 0, size = 20): Promise<PageResponse<AuditLog>> => {
        const response = await api.get(`/admin/audit-logs?page=${page}&size=${size}`);
        return response.data.data;
    },
};
