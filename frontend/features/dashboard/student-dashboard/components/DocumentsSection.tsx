// ============================================================================
// FILE: student-dashboard/components/DocumentsSection.tsx
// ============================================================================
'use client';

import { FileText } from 'lucide-react';
import { useState } from 'react';
import DocumentPreviewModal from '@/features/documents/document-preview-modal';
import { documentsApi } from '@/lib/services/document';
import type { Document as DocumentType } from '@/lib/types';
import { DocumentCard } from './DocumentCard';
import { toast } from 'sonner';

export const DocumentsSection = ({ documents }: { documents: DocumentType[] }) => {
  const [previewDocument, setPreviewDocument] = useState<DocumentType | null>(null);
  const visibleDocuments = documents.slice(0, 4);

  const handleDownload = async (doc: DocumentType) => {
    try {
      await documentsApi.downloadAndSave(doc.id, doc.fileName);
    } catch {
      toast.error('Không thể tải xuống tài liệu');
    }
  };

  return (
    <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between gap-3">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <FileText className="text-primary" size={18} />
          Tài Liệu Mới Nhất
        </h3>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
          {documents.length} tài liệu
        </span>
      </div>

      <div className="p-6">
        {documents.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-6 space-y-2">
            <div className="mx-auto h-11 w-11 rounded-full border border-dashed border-border flex items-center justify-center">
              <FileText className="h-5 w-5 opacity-40" />
            </div>
            <p>Chưa có tài liệu nào được giao theo buổi học.</p>
            <p className="text-xs">Khi giáo viên đính kèm tài liệu vào session, bạn sẽ thấy tại đây.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleDocuments.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} onClick={setPreviewDocument} />
            ))}
          </div>
        )}
      </div>

      {previewDocument && (
        <DocumentPreviewModal
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};