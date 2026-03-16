import api from './axios-instance';
import type { Role, ManagedUser } from '../types/admin';
import type { PageResponse } from '../types/common';

/**
 * Service for administrative authentication and access control management.
 */
export const adminAuthApi = {
    /**
     * Retrieves all roles defined in the system.
     */
    getAllRoles: async (): Promise<Role[]> => {
        const response = await api.get('/admin/roles');
        return response.data.data;
    },

    /**
     * Returns a list of all available permission names.
     */
    getAvailablePermissions: async (): Promise<string[]> => {
        const response = await api.get('/admin/roles/permissions');
        return response.data.data;
    },

    /**
     * Updates the permissions assigned to a specific role.
     * @param roleId The ID of the role to update.
     * @param permissionNames Array of permission names to assign.
     */
    updateRolePermissions: async (roleId: number, permissionNames: string[]): Promise<Role> => {
        const response = await api.put(`/admin/roles/${roleId}/permissions`, permissionNames);
        return response.data.data;
    },

    /**
     * Retrieves a paginated list of all users in the system.
     */
    getUsers: async (page = 0, size = 10): Promise<PageResponse<ManagedUser>> => {
        const response = await api.get(`/admin/users?page=${page}&size=${size}`);
        return response.data.data;
    },

    /**
     * Toggles the enabled/disabled status of a user account.
     * @param userId The ID of the user to toggle.
     */
    toggleUserStatus: async (userId: number): Promise<void> => {
        await api.put(`/admin/users/${userId}/toggle-status`);
    },

    /**
     * Permanently deletes a user from the system.
     * @param userId The ID of the user to delete.
     */
    deleteUser: async (userId: number): Promise<void> => {
        await api.delete(`/admin/users/${userId}`);
    },
};
