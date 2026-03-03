// ============================================================================
// FILE: document-library/components/SearchBar.tsx
// ============================================================================
import { Search } from 'lucide-react';
import { memo } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const SearchBar = memo(({ value, onChange, disabled }: Props) => (
  <div className="mb-6">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Tìm kiếm tài liệu..."
        className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
        disabled={disabled}
      />
    </div>
  </div>
));
SearchBar.displayName = 'SearchBar';