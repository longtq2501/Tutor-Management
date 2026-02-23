// ============================================================================
// 📁 student-modal/components/ParentSelector.tsx
// ============================================================================
import { Users, UserCircle, Phone, Mail } from 'lucide-react';
import type { Parent } from '@/lib/types';

interface ParentSelectorProps {
  parentId?: number | null;
  parents: Parent[];
  loading: boolean;
  onChange: (parentId?: number) => void;
}

export function ParentSelector({ parentId, parents, loading, onChange }: ParentSelectorProps) {
  const selectedParent = parentId ? parents.find(p => p.id === parentId) : null;

  return (
    <div>
      <label className="block text-sm font-bold text-card-foreground mb-2 flex items-center gap-2">
        <Users size={16} className="text-primary" />
        Phụ huynh liên kết
      </label>
      <select
        value={parentId || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        className="w-full px-4 py-3 bg-background border border-input rounded-xl focus:border-ring focus:ring-1 focus:ring-ring outline-none transition-all appearance-none text-foreground font-medium"
        disabled={loading}
      >
        <option value="">-- Chọn phụ huynh --</option>
        {parents.map(parent => (
          <option key={parent.id} value={parent.id}>
            {parent.name} {parent.studentCount > 0 ? `(${parent.studentCount} HS)` : ''}
          </option>
        ))}
      </select>

      {/* Selected Parent Info Card */}
      {selectedParent && (
        <div className="mt-3 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <UserCircle size={20} />
          </div>
          <div>
            <p className="font-bold text-card-foreground text-sm">
              {selectedParent.name}
            </p>
            <div className="flex flex-col gap-1 mt-1">
              {selectedParent.phone && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone size={10} /> {selectedParent.phone}
                </span>
              )}
              {selectedParent.email && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail size={10} /> {selectedParent.email}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}