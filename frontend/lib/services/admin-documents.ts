import api from './axios-instance';
import type { AdminDocument, AdminDocumentStats, AdminFolder } from '../types/admin';
import type { PageResponse } from '../types/common';

export const adminDocumentsApi = {
    getAll: async (
        page = 0,
        size = 20,
        search = '',
        folderId?: number,
        isRoot = false
    ): Promise<PageResponse<AdminDocument>> => {
        const params = new URLSearchParams({
            page: page.toString(),
            size: size.toString(),
        });
        if (search) params.append('search', search);
        if (folderId) params.append('folderId', folderId.toString());
        if (isRoot) params.append('isRoot', 'true');

        const response = await api.get(`/api/admin/documents?${params.toString()}`);
        return response.data.data;
    },

    getStats: async (): Promise<AdminDocumentStats> => {
        const response = await api.get('/api/admin/documents/stats');
        return response.data.data;
    },

    delete: async (id: number): Promise<void> => {
        await api.delete(`/api/admin/documents/${id}`);
    },

    // Folder Operations
    getRootFolders: async (): Promise<AdminFolder[]> => {
        const response = await api.get('/api/folders/root');
        return response.data.data;
    },

    getSubfolders: async (parentId: number): Promise<AdminFolder[]> => {
        const response = await api.get(`/api/folders/${parentId}/subfolders`);
        return response.data.data;
    },

    createFolder: async (name: string, parentId?: number): Promise<AdminFolder> => {
        const res = await api.post('/api/folders', { name, parentId });
        return res.data.data;
    },

    deleteFolder: async (id: number): Promise<void> => {
        await api.delete(`/api/folders/${id}`);
    },

    upload: async (formData: FormData, onUploadProgress?: (progress: number) => void): Promise<AdminDocument> => {
        const response = await api.post('/api/admin/documents', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
                if (onUploadProgress && progressEvent.total) {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onUploadProgress(percentCompleted);
                }
            },
        });
        return response.data.data;
    }
};
