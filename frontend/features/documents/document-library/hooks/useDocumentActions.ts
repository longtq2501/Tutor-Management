// ============================================================================
// FILE: document-library/hooks/useDocumentActions.ts
// ============================================================================
import { documentsApi } from '@/lib/services';
import type { Document } from '@/lib/types';
import { toast } from 'sonner';

export const useDocumentActions = (loadDocuments: () => void, loadCategoryDocuments: () => void, selectedCategory: string | null) => {
  const handleDownload = async (doc: Document) => {
    try {
      const response = await documentsApi.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      if (selectedCategory) loadCategoryDocuments();
      loadDocuments();
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Không thể tải xuống tài liệu!');
    }
  };

  const handleDelete = async (id: number) => {
    const promise = async () => {
      await documentsApi.delete(id);
      if (selectedCategory) loadCategoryDocuments();
      loadDocuments();
    };

    toast.promise(promise(), {
      loading: 'Đang xóa tài liệu...',
      success: 'Đã xóa tài liệu thành công',
      error: (err: unknown) => {
        console.error('Error deleting document:', err);
        return 'Không thể xóa tài liệu!';
      }
    });
  };

  return { handleDownload, handleDelete };
};