'use client';

import { useState, useEffect } from 'react';
import { X, Download, Trash2, ExternalLink, FileText, Loader2 } from 'lucide-react';
import type { Document } from '@/lib/types';

interface DocumentPreviewModalProps {
  document: Document;
  onClose: () => void;
  onDownload: (doc: Document) => void;
  onDelete: (id: number) => void;
}

export default function DocumentPreviewModal({
  document,
  onClose,
  onDownload,
  onDelete,
}: DocumentPreviewModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadPreview();
    
    // Cleanup function
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [document.id]); // Only depend on document.id

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(false);
      
      // Use preview endpoint (doesn't increment download count)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
      const url = `${apiUrl}/documents/${document.id}/preview`;
      
      setPreviewUrl(url);
      setLoading(false);
    } catch (err) {
      console.error('Error loading preview:', err);
      setError(true);
      setLoading(false);
    }
  };

  const handleDownload = () => {
    onDownload(document);
  };

  const handleDelete = () => {
    if (confirm('Xóa tài liệu này?')) {
      onDelete(document.id);
      onClose();
    }
  };

  const handleOpenInNewTab = () => {
    window.open(previewUrl, '_blank');
  };

  const canPreview = document.fileType === 'application/pdf';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full md:w-[90vw] md:h-[90vh] md:rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FileText className="text-gray-600 flex-shrink-0" size={24} />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-800 truncate">
                {document.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>{document.fileName}</span>
                <span>•</span>
                <span>{document.formattedFileSize}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Download size={12} />
                  {document.downloadCount} lượt
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleOpenInNewTab}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="Mở tab mới"
            >
              <ExternalLink size={20} className="text-gray-600" />
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Download size={18} />
              Tải xuống
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
              title="Xóa"
            >
              <Trash2 size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden bg-gray-100 relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                <p className="text-gray-600">Đang tải xem trước...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-md p-8">
                <FileText className="text-gray-400 mx-auto mb-4" size={64} />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Không thể xem trước
                </h3>
                <p className="text-gray-600 mb-4">
                  Không thể hiển thị xem trước cho loại file này. Vui lòng tải xuống để xem.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium inline-flex items-center gap-2"
                >
                  <Download size={18} />
                  Tải xuống
                </button>
              </div>
            </div>
          )}

          {!loading && !error && canPreview && (
            <iframe
              src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              className="w-full h-full border-0"
              title={document.title}
            />
          )}

          {!loading && !error && !canPreview && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
                <FileText className="text-indigo-600 mx-auto mb-4" size={64} />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {document.fileName}
                </h3>
                {document.description && (
                  <p className="text-gray-600 mb-4">{document.description}</p>
                )}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Loại file</p>
                      <p className="font-medium text-gray-800">
                        {document.fileType.split('/')[1]?.toUpperCase() || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Kích thước</p>
                      <p className="font-medium text-gray-800">
                        {document.formattedFileSize}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Lượt tải</p>
                      <p className="font-medium text-gray-800">
                        {document.downloadCount} lượt
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Ngày tạo</p>
                      <p className="font-medium text-gray-800">
                        {new Date(document.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Xem trước không khả dụng cho loại file này. Vui lòng tải xuống để xem nội dung.
                </p>
                <button
                  onClick={handleDownload}
                  className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium inline-flex items-center justify-center gap-2"
                >
                  <Download size={18} />
                  Tải xuống để xem
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        {document.description && (
          <div className="p-4 border-t bg-gray-50">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Mô tả:</span> {document.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}