// ============================================================================
// FILE: student-dashboard/components/DocumentCard.tsx
// ============================================================================
import { FileText } from 'lucide-react';
import type { Document as DocumentType } from '@/lib/types';

export const DocumentCard = ({ doc, onClick }: { doc: DocumentType; onClick: (doc: DocumentType) => void }) => (
  <button
    type="button"
    onClick={() => onClick(doc)}
    className="w-full text-left flex items-start gap-3 p-3 rounded-xl border border-border/70 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer"
  >
    <div className="p-2 bg-primary/10 rounded-lg flex-shrink-0">
      <FileText className="text-primary" size={16} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm text-foreground truncate">
        {doc.title}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        {doc.categoryDisplayName} • {doc.formattedFileSize}
      </p>
    </div>
  </button>
);