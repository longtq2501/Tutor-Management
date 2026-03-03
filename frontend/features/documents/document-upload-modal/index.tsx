// 📁 document-upload-modal/index.tsx
'use client';

import type { DocumentCategory, DocumentUploadRequest } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CategorySelect } from './components/CategorySelect';
import { FileUploadZone } from './components/FileUploadZone';
import { UploadProgress } from './components/UploadProgress';
import { useFileUpload } from './hooks/useFileUpload';
import { validateFile } from './utils';
import { useCategories } from '@/features/documents/hooks/useMasterDocuments';

interface DocumentUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
  defaultCategory?: DocumentCategory;
}

import { toast } from 'sonner';

export default function DocumentUploadModal({
  onClose,
  onSuccess,
  defaultCategory,
}: DocumentUploadModalProps) {
  const [formData, setFormData] = useState<DocumentUploadRequest>({
    title: '',
    category: defaultCategory || 'GRAMMAR',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { upload, loading, progress } = useFileUpload();
  const { data: categories = [] } = useCategories();

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setSelectedFile(file);
    if (!formData.title) {
      setFormData({ ...formData, title: file.name.replace(/\.[^/.]+$/, '') });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.warning('Vui lòng chọn file!');
      return;
    }
    if (!formData.title) {
      toast.warning('Vui lòng nhập tiêu đề!');
      return;
    }

    try {
      await upload(selectedFile, formData);
      toast.success('Tải lên tài liệu thành công!');
      setTimeout(onSuccess, 500);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Không thể tải lên tài liệu!');
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(prev => prev !== true ? true : prev);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-card rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-border z-10"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-card-foreground">Tải lên tài liệu</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <FileUploadZone file={selectedFile} onFileSelect={handleFileSelect} />

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">Tiêu đề *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Tên tài liệu"
                  required
                />
              </div>

              <CategorySelect
                value={formData.category}
                onChange={(category) => setFormData({ ...formData, category })}
                categories={categories}
              />

              <div>
                <label className="block text-sm font-medium text-card-foreground mb-2">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-border bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="Mô tả ngắn về tài liệu..."
                  rows={3}
                />
              </div>

              {loading && <UploadProgress progress={progress} />}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Upload size={20} />
                {loading ? 'Đang tải lên...' : 'Tải lên'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-secondary-foreground px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Hủy
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}