// src/components/DocumentLibrary.tsx
'use client';

import { useState, useEffect } from 'react';
import { Upload, Download, Trash2, Search, FileText, Eye } from 'lucide-react';
import { documentsApi } from '@/lib/api';
import type { Document, DocumentCategory } from '@/lib/types';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentPreviewModal from './DocumentPreviewModal';

const CATEGORIES = [
  { key: 'GRAMMAR', name: 'Ngữ pháp', icon: '📚', color: 'from-blue-400 to-blue-600' },
  { key: 'VOCABULARY', name: 'Từ vựng', icon: '📖', color: 'from-green-400 to-green-600' },
  { key: 'READING', name: 'Đọc hiểu', icon: '📰', color: 'from-yellow-400 to-yellow-600' },
  { key: 'LISTENING', name: 'Nghe hiểu', icon: '🎧', color: 'from-orange-400 to-orange-600' },
  { key: 'SPEAKING', name: 'Nói', icon: '🗣️', color: 'from-red-400 to-red-600' },
  { key: 'WRITING', name: 'Viết', icon: '✍️', color: 'from-pink-400 to-pink-600' },
  { key: 'EXERCISES', name: 'Bài tập', icon: '📝', color: 'from-cyan-400 to-cyan-600' },
  { key: 'EXAM', name: 'Đề thi', icon: '📋', color: 'from-purple-400 to-purple-600' },
  { key: 'PET', name: 'PET (B1)', icon: '🎯', color: 'from-teal-400 to-teal-600' },
  { key: 'FCE', name: 'FCE (B2)', icon: '🏆', color: 'from-rose-400 to-rose-600' },
  { key: 'IELTS', name: 'IELTS', icon: '🌐', color: 'from-indigo-400 to-indigo-600' },
  { key: 'TOEIC', name: 'TOEIC', icon: '💼', color: 'from-emerald-400 to-emerald-600' },
  { key: 'OTHER', name: 'Khác', icon: '📄', color: 'from-gray-400 to-gray-600' },
];

export default function DocumentLibrary() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);
  const [categoryDocs, setCategoryDocs] = useState<Document[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    downloads: 0,
    size: '0 B',
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryDocuments();
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedCategory && searchQuery) {
      const filtered = categoryDocs.filter((doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setCategoryDocs(filtered);
    } else if (selectedCategory) {
      loadCategoryDocuments();
    }
  }, [searchQuery]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await documentsApi.getAll();
      setDocuments(response.data as unknown as Document[]);
      
      // Calculate stats
      const total = response.data.length;
      const downloads = response.data.reduce((sum, doc) => sum + (doc as unknown as Document).downloadCount, 0);
      const totalSize = response.data.reduce((sum, doc) => sum + (doc as unknown as Document).fileSize, 0);
      
      setStats({
        total,
        downloads,
        size: formatFileSize(totalSize),
      });
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryDocuments = async () => {
    if (!selectedCategory) return;
    try {
      const response = await documentsApi.getByCategory(selectedCategory);
      setCategoryDocs(response.data as unknown as Document[]);
    } catch (error) {
      console.error('Error loading category documents:', error);
    }
  };

  const getCategoryCount = (category: string) => {
    return documents.filter((doc) => doc.category === category as DocumentCategory).length;
  };

  const handleCategoryClick = (category: DocumentCategory) => {
    setSelectedCategory(category);
    setSearchQuery('');
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setCategoryDocs([]);
    setSearchQuery('');
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await documentsApi.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      if (selectedCategory) {
        loadCategoryDocuments();
      }
      loadDocuments();
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Không thể tải xuống tài liệu!');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa tài liệu này?')) return;

    try {
      await documentsApi.delete(id);
      if (selectedCategory) {
        loadCategoryDocuments();
      }
      loadDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Không thể xóa tài liệu!');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Đang tải...</p>
      </div>
    );
  }

  // Category Grid View
  if (!selectedCategory) {
    return (
      <>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Kho Tài Liệu Tiếng Anh</h2>
              <p className="text-gray-600 text-sm mt-1">
                Quản lý tài liệu theo danh mục để dễ tìm kiếm sau này
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Upload size={20} />
              Tải lên
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Tổng tài liệu</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Lượt tải xuống</p>
              <p className="text-2xl font-bold text-green-600">{stats.downloads}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Dung lượng</p>
              <p className="text-2xl font-bold text-purple-600">{stats.size}</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled
              />
            </div>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CATEGORIES.map((category) => {
              const count = getCategoryCount(category.key as DocumentCategory);
              return (
                <button
                  key={category.key}
                  onClick={() => handleCategoryClick(category.key as DocumentCategory)}
                  className={`bg-gradient-to-r ${category.color} text-white rounded-xl p-6 text-left hover:shadow-lg transition-all transform hover:scale-[1.02]`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{category.icon}</span>
                      <div>
                        <h3 className="font-bold text-lg">{category.name}</h3>
                        <p className="text-white/80 text-sm">{count} tài liệu</p>
                      </div>
                    </div>
                    <div className="bg-white/20 rounded-lg px-3 py-1">
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {showUploadModal && (
          <DocumentUploadModal
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => {
              setShowUploadModal(false);
              loadDocuments();
            }}
          />
        )}
      </>
    );
  }

  // Document List View
  const categoryInfo = CATEGORIES.find((c) => c.key === selectedCategory);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBackToCategories}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Quay lại
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{categoryInfo?.icon}</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{categoryInfo?.name}</h2>
                <p className="text-gray-600 text-sm">{categoryDocs.length} tài liệu</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Upload size={20} />
            Thêm tài liệu
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tài liệu..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Documents List */}
        {categoryDocs.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto text-gray-300 mb-4" size={64} />
            <p className="text-gray-500 text-lg mb-2">
              {searchQuery ? 'Không tìm thấy tài liệu' : 'Chưa có tài liệu nào'}
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-2 mt-4"
            >
              <Upload size={18} />
              Thêm tài liệu đầu tiên
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {categoryDocs.map((doc) => (
              <div
                key={doc.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => setPreviewDocument(doc)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="text-gray-400 flex-shrink-0" size={20} />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                          {doc.title}
                        </h3>
                        {doc.description && (
                          <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500 ml-8">
                      <span>{doc.fileName}</span>
                      <span>•</span>
                      <span>{doc.formattedFileSize}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Download size={12} />
                        {doc.downloadCount} lượt
                      </span>
                      <span>•</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewDocument(doc);
                      }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      title="Xem trước"
                    >
                      <Eye size={16} />
                      Xem
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc);
                      }}
                      className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      Tải xuống
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showUploadModal && (
        <DocumentUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            if (selectedCategory) {
              loadCategoryDocuments();
            }
            loadDocuments();
          }}
          defaultCategory={selectedCategory}
        />
      )}

      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
          onDownload={handleDownload}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}