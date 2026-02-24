// 📁 parents-view/index.tsx
 
'use client';

import { useState, useMemo } from 'react';
import { Users, Plus } from 'lucide-react';
import { useParents } from './hooks/useParents';
import { useParentForm } from './hooks/useParentForm';
import { calculateParentStats } from './utils/stats';
import { ParentStats } from './components/ParentStats';
import { SearchBar } from './components/SearchBar';
import { ParentCard } from './components/ParentCard';
import { ParentFormModal } from './components/ParentFormModal';
import { EmptyState } from './components/EmptyState';

export default function ParentsView() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { parents, loading, loadParents, search, deleteParent } = useParents();
  const form = useParentForm(loadParents);
  const stats = useMemo(() => calculateParentStats(parents), [parents]);

  const handleSearch = (keyword: string) => {
    setSearchTerm(keyword);
    search(keyword);
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-lg p-6 transition-colors border border-border">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Users className="text-primary" size={32} />
          <h2 className="text-2xl font-bold text-card-foreground">Quản lý phụ huynh</h2>
        </div>
        <button
          onClick={form.openCreate}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Thêm phụ huynh
        </button>
      </div>

      <SearchBar value={searchTerm} onChange={handleSearch} />
      <ParentStats {...stats} />

      {parents.length === 0 ? (
        <EmptyState onAddClick={form.openCreate} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {parents.map((parent) => (
            <ParentCard
              key={parent.id}
              parent={parent}
              onEdit={() => form.openEdit(parent)}
              onDelete={() => deleteParent(parent.id)}
            />
          ))}
        </div>
      )}

      {form.showModal && (
        <ParentFormModal
          isEdit={!!form.editingParent}
          formData={form.formData}
          onFormChange={form.setFormData}
          onSubmit={form.submit}
          onClose={form.close}
        />
      )}
    </div>
  );
}