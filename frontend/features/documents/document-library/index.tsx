// ============================================================================
// FILE: document-library/index.tsx (MAIN)
// ============================================================================
'use client';

import { useState } from 'react';
import { Upload, Plus } from 'lucide-react';
import type { Document, DocumentCategory, Category } from '@/lib/types';
import { useDocumentLibrary } from './hooks/useDocumentLibrary';
import { useDocumentActions } from './hooks/useDocumentActions';
import { StatsCards } from './components/StatsCards';
import { SearchBar } from './components/SearchBar';
import { CategoryGrid } from './components/CategoryGrid';
import { useAuth } from '@/contexts/AuthContext';
import { CategoryView } from './components/CategoryView';
import { CategoryFormModal } from './components/CategoryFormModal';
import DocumentUploadModal from '@/features/documents/document-upload-modal';
import DocumentPreviewModal from '@/features/documents/document-preview-modal';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useQueryClient } from '@tanstack/react-query';
import { DashboardHeader } from '@/contexts/UIContext';

export default function DocumentLibrary() {
  const {
    documents,
    categories,
    selectedCategory,
    setSelectedCategory,
    categoryDocs,
    searchQuery,
    setSearchQuery,
    loading,
    stats,
    loadDocuments,
    loadCategoryDocuments,
    page,
    setPage,
    totalPages,
    isCategoriesLoading,
    loadMoreCategories,
    hasMoreCategories,
    isFetchingMoreCategories
  } = useDocumentLibrary();

  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const queryClient = useQueryClient();

  const { handleDownload, handleDelete: executeDelete } = useDocumentActions(loadDocuments, loadCategoryDocuments, selectedCategory);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const handleDeleteTrigger = (id: number) => {
    setDeleteConfirmId(id);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      executeDelete(deleteConfirmId);
      setDeleteConfirmId(null);
      // If we are in preview, close it too
      if (previewDocument && previewDocument.id === deleteConfirmId) {
        setPreviewDocument(null);
      }
      // Invalidate stats to refresh counts
      queryClient.invalidateQueries({ queryKey: ['documents', 'stats'] });
    }
  };

  const handleUploadSuccess = () => {
    setShowUploadModal(false);
    loadDocuments();
    loadCategoryDocuments();
    // Invalidate stats to refresh counts
    queryClient.invalidateQueries({ queryKey: ['documents', 'stats'] });
  };

  if (!selectedCategory) {
    return (
      <>
        <DashboardHeader
          title="Kho Tài Liệu Tiếng Anh"
          subtitle="Quản lý tài liệu theo danh mục để dễ tìm kiếm sau này"
          actions={!isStudent && (
            <div className="flex flex-row gap-2 sm:gap-3 w-full">
              <button
                onClick={() => {
                  setEditingCategory(null);
                  setIsCategoryFormOpen(true);
                }}
                className="flex-1 sm:flex-none sm:w-auto bg-muted hover:bg-muted/80 text-muted-foreground px-3 sm:px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 border shadow-sm text-xs sm:text-base"
              >
                <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="hidden sm:inline">Thêm danh mục</span>
                <span className="sm:hidden">Thêm</span>
              </button>
              <button onClick={() => setShowUploadModal(true)} className="flex-1 sm:flex-none sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-3 sm:px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20 text-xs sm:text-base">
                <Upload size={16} className="sm:w-[18px] sm:h-[18px]" />
                Tải lên
              </button>
            </div>
          )}
        />

        <div className="space-y-6 pb-20 sm:pb-32">
          <div data-tour="documents-stats">
            <StatsCards stats={stats} />
          </div>
          <div data-tour="documents-grid">
            <CategoryGrid
              categories={categories}
              counts={stats.categoryCounts}
              onCategoryClick={setSelectedCategory}
              isLoading={isCategoriesLoading}
              loadMoreCategories={loadMoreCategories}
              hasMoreCategories={hasMoreCategories}
              isFetchingMoreCategories={isFetchingMoreCategories}
            />
          </div>
        </div>

        {showUploadModal && (
          <DocumentUploadModal
            onClose={() => setShowUploadModal(false)}
            onSuccess={handleUploadSuccess}
          />
        )}

        <CategoryFormModal
          open={isCategoryFormOpen}
          onOpenChange={setIsCategoryFormOpen}
          initialData={editingCategory}
        />
      </>
    );
  }

  const foundCategory = categories.find(c => c.code === selectedCategory);
  const fullSelectedCategory = foundCategory || (selectedCategory as DocumentCategory);

  return (
    <>
      <CategoryView
        category={fullSelectedCategory}
        documents={categoryDocs}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onBack={() => { setSelectedCategory(null); setSearchQuery(''); }}
        onUpload={() => setShowUploadModal(true)}
        onPreview={setPreviewDocument}
        onDownload={handleDownload}
        onDelete={handleDeleteTrigger}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        isLoading={loading}
      />

      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={handleUploadSuccess}
          defaultCategory={selectedCategory}
        />
      )}

      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
          onDownload={handleDownload}
          onDelete={handleDeleteTrigger}
        />
      )}

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa"
        description="Bạn có chắc chắn muốn xóa tài liệu này? Hành động này không thể hoàn tác."
        variant="destructive"
        confirmText="Xóa tài liệu"
      />
    </>
  );
}