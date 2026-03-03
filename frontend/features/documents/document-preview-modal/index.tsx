// ============================================================================
// 📁 document-preview-modal/index.tsx
// ============================================================================

'use client';

import type { Document } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { DocumentInfo } from './components/DocumentInfo';
import { ModalFooter } from './components/ModalFooter';
import { ModalHeader } from './components/ModalHeader';
import { PDFPreview } from './components/PDFPreview';
import { PreviewError } from './components/PreviewError';
import { PreviewLoading } from './components/PreviewLoading';
import { useDocumentDownload } from './hooks/useDocumentDownload';
import { useDocumentPreview } from './hooks/useDocumentPreview';

interface DocumentPreviewModalProps {
  document: Document;
  onClose: () => void;
  onDownload: (doc: Document) => void;
  onDelete?: (id: number) => void;
}

export default function DocumentPreviewModal({
  document: doc,
  onClose,
  onDownload,
  onDelete,
}: DocumentPreviewModalProps) {
  const { previewUrl, loading, error } = useDocumentPreview(doc.id);
  const { downloading, download, isDownloading } = useDocumentDownload();

  const handleDownload = useCallback(async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    await download(doc);
  }, [doc, download]);

  const handleDelete = useCallback((e?: React.MouseEvent) => {
    if (!onDelete) return;

    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    onDelete(doc.id);
  }, [doc.id, onDelete]);

  const handleOpenInNewTab = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (previewUrl) {
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    }
  }, [previewUrl]);

  const handleClose = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isDownloading) return;

    onClose();
  }, [onClose, isDownloading]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(prev => prev !== true ? true : prev);
    return () => setMounted(false);
  }, []);

  const canPreview = doc.fileType === 'application/pdf';

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md w-full h-full md:w-full md:max-w-5xl md:h-[85vh] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative z-10 border border-white/20"
          onClick={(e) => e.stopPropagation()}
        >
          <ModalHeader
            document={doc}
            downloading={downloading}
            onClose={handleClose}
            onDownload={handleDownload}
            onDelete={handleDelete}
            onOpenInNewTab={handleOpenInNewTab}
          />

          <div className="flex-1 overflow-hidden bg-muted/50 dark:bg-gray-800 relative">
            {loading && <PreviewLoading />}

            {error && (
              <PreviewError
                downloading={downloading}
                onDownload={handleDownload}
              />
            )}

            {!loading && !error && canPreview && (
              <PDFPreview url={previewUrl} title={doc.title} />
            )}

            {!loading && !error && !canPreview && (
              <DocumentInfo
                document={doc}
                downloading={downloading}
                onDownload={handleDownload}
              />
            )}
          </div>

          <ModalFooter description={doc.description} />
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}