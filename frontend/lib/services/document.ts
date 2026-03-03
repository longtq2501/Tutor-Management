import type {
  Document as AppDocument,
  DocumentCategory,
  Category,
  DocumentUploadRequest,
  DocumentStats
} from '../types';
import type { CursorPageResponse, PageResponse } from '../types/common';
import api from './axios-instance';

export const documentsApi = {
  /** * LẤY DANH SÁCH TẤT CẢ TÀI LIỆU (PHÂN TRANG) */
  getAll: async (page = 0, size = 10): Promise<PageResponse<AppDocument>> => {
    const response = await api.get('/documents', {
      params: { page, size }
    });
    return response.data.data;
  },

  /** * LẤY CHI TIẾT TÀI LIỆU THEO ID */
  getById: async (id: number): Promise<AppDocument> => {
    const response = await api.get(`/documents/${id}`);
    return response.data.data;
  },

  /** * LẤY DANH SÁCH TÀI LIỆU THEO DANH MỤC (PHÂN TRANG) */
  getByCategory: async (category: DocumentCategory, page = 0, size = 10): Promise<PageResponse<AppDocument>> => {
    const response = await api.get(`/documents/category/${category}`, {
      params: { page, size }
    });
    return response.data.data;
  },

  /** * TÌM KIẾM TÀI LIỆU THEO TỪ KHÓA */
  search: async (keyword: string, category?: string, page = 0, size = 10): Promise<PageResponse<AppDocument>> => {
    const response = await api.get('/documents/search', { params: { keyword, category, page, size } });
    return response.data.data;
  },

  /** * TẢI TÀI LIỆU MỚI LÊN HỆ THỐNG (LƯU TRỮ QUA CLOUDINARY)
   * @param {File} file - File vật lý cần upload
   * @param {DocumentUploadRequest} data - Thông tin mô tả tài liệu
   */
  upload: async (file: File, data: DocumentUploadRequest): Promise<AppDocument> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    const response = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.data;
  },

  /** * TẢI DỮ LIỆU FILE TỪ CLOUDINARY VỀ DƯỚI DẠNG BLOB */
  download: async (id: number): Promise<Blob> => {
    try {
      // LẤY URL CLOUDINARY TỪ BACKEND
      const response = await api.get(`/documents/${id}/download`);
      const cloudinaryUrl = response.data.data.url;

      // TRUY XUẤT FILE TRỰC TIẾP TỪ CLOUDINARY
      const fileResponse = await fetch(cloudinaryUrl);
      if (!fileResponse.ok) {
        throw new Error('Failed to download file from Cloudinary');
      }

      return await fileResponse.blob();
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },

  /** * TẢI VỀ VÀ TỰ ĐỘNG LƯU FILE XUỐNG MÁY NGƯỜI DÙNG */
  downloadAndSave: async (id: number, filename: string): Promise<void> => {
    try {
      const blob = await documentsApi.download(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download and save error:', error);
      throw error;
    }
  },

  /** * XÓA TÀI LIỆU KHỎI HỆ THỐNG */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  /** * LẤY THỐNG KÊ VỀ KHO TÀI LIỆU (SỐ LƯỢNG, DUNG LƯỢNG...) */
  getStats: async (): Promise<DocumentStats> => {
    const response = await api.get('/documents/stats');
    return response.data.data;
  },

  /** * LẤY DANH SÁCH CÁC DANH MỤC TÀI LIỆU HIỆN CÓ */
  getCategories: async (): Promise<Category[]> => {
    const response = await api.get('/document-categories');
    return response.data.data;
  },

  /** * LẤY DANH SÁCH CÁC DANH MỤC TÀI LIỆU (PHÂN TRANG CURSOR) */
  getCategoriesPaginated: async (cursor?: string, limit = 10): Promise<CursorPageResponse<Category>> => {
    const response = await api.get('/document-categories/paginated', {
      params: { cursor, limit }
    });
    return response.data.data;
  },

  /** * LẤY ĐƯỜNG DẪN XEM TRƯỚC (PREVIEW) TRỰC TIẾP TỪ CLOUDINARY */
  getPreviewUrl: async (id: number): Promise<string> => {
    try {
      const response = await api.get(`/documents/${id}/preview`);
      const cloudinaryUrl = response.data.data.url;
      console.log('📄 Cloudinary preview URL:', cloudinaryUrl);
      return cloudinaryUrl;
    } catch (error) {
      console.error('Preview URL error:', error);
      throw error;
    }
  },

  /** * XÓA DANH MỤC */
  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/document-categories/${id}`);
  },

  /** * TẠO DANH MỤC MỚI */
  createCategory: async (category: Partial<Category>): Promise<Category> => {
    const response = await api.post('/document-categories', category);
    return response.data.data;
  },

  /** * CẬP NHẬT DANH MỤC */
  updateCategory: async (id: number, category: Partial<Category>): Promise<Category> => {
    const response = await api.put(`/document-categories/${id}`, category);
    return response.data.data;
  }
};