import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Check, Search, X } from 'lucide-react';
import { useRef } from 'react';
import type { LessonLibraryDTO } from '@/features/learning/lessons/types';
import type { Document } from '@/lib/types/document';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface LibrarySelectionProps {
    activeTab: 'lessons' | 'documents';
    setActiveTab: (tab: 'lessons' | 'documents') => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedCategory: string;
    setSelectedCategory: (cat: string) => void;
    categories: string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filteredItems: any[];
    selectedLessonIds: Set<number>;
    selectedDocumentIds: Set<number>;
    currentTabSelectedCount: number;
    toggleSelection: (id: number) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getCategoryName: (item: any) => string;
}

export function LibrarySelection({
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredItems,
    selectedLessonIds,
    selectedDocumentIds,
    currentTabSelectedCount,
    toggleSelection,
    getCategoryName
}: LibrarySelectionProps) {
    const parentRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
        count: filteredItems.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 70,
        overscan: 5,
    });

    const isNewItem = (createdAt?: string) => {
        if (!createdAt) return false;
        const date = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
    };

    return (
        <div className="h-full min-h-0 space-y-3 pt-3 border-t border-border/60 flex flex-col overflow-hidden">
            {/* Stats Bar */}
            <div className="grid grid-cols-3 gap-2 px-1">
                <div className="flex flex-col items-center p-1.5 sm:p-2 bg-primary/5 rounded-lg border border-primary/10">
                    <span className="text-base sm:text-lg font-black text-primary leading-none">{categories.length}</span>
                    <span className="text-[8px] sm:text-[9px] text-muted-foreground font-bold uppercase mt-1">Danh mục</span>
                </div>
                <div className="flex flex-col items-center p-1.5 sm:p-2 bg-primary/5 rounded-lg border border-primary/10">
                    <span className="text-base sm:text-lg font-black text-primary leading-none">{filteredItems.length}</span>
                    <span className="text-[8px] sm:text-[9px] text-muted-foreground font-bold uppercase mt-1">Tìm thấy</span>
                </div>
                <div className="flex flex-col items-center p-1.5 sm:p-2 bg-primary/5 rounded-lg border border-primary/10">
                    <span className="text-base sm:text-lg font-black text-primary leading-none">{currentTabSelectedCount}</span>
                    <span className="text-[8px] sm:text-[9px] text-muted-foreground font-bold uppercase mt-1">Đã chọn</span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex p-1 bg-muted/40 rounded-xl border border-border/40">
                <button
                    type="button"
                    onClick={() => setActiveTab('lessons')}
                    className={cn(
                        "flex-1 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs transition-all flex items-center justify-center gap-1 sm:gap-2",
                        activeTab === 'lessons'
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                >
                    <span className="text-sm sm:text-base">📖</span> Kho bài giảng
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('documents')}
                    className={cn(
                        "flex-1 py-1.5 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs transition-all flex items-center justify-center gap-1 sm:gap-2",
                        activeTab === 'documents'
                            ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
                            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                >
                    <span className="text-sm sm:text-base">📄</span> Kho tài liệu
                </button>
            </div>

            {/* Search & Sort */}
            <div className="flex gap-2">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={14} />
                    <input
                        type="text"
                        placeholder={`Tìm kiếm...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 border border-border/60 rounded-xl focus:border-primary/50 focus:ring-4 focus:ring-primary/10 bg-background text-xs font-semibold transition-all outline-none"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted/80 transition-colors"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
                <Select
                    value={selectedCategory}
                    onValueChange={(val) => setSelectedCategory(val)}
                >
                    <SelectTrigger className="w-auto min-w-[120px] h-10 border-border/60 rounded-xl bg-background text-[10px] sm:text-xs font-semibold hover:bg-muted/30 transition-colors focus:ring-4 focus:ring-primary/10">
                        <SelectValue placeholder="Danh mục" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/60 shadow-xl max-h-[300px]">
                        {categories.map(cat => (
                            <SelectItem key={cat} value={cat} className="text-xs font-medium">
                                {cat === 'all' ? '✨ Tất cả' : cat}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>



            {/* Virtualized List - Dynamic Height */}
            <div
                ref={parentRef}
                className="flex-1 overflow-auto border border-border/60 rounded-xl bg-muted/20 min-h-[240px] lg:min-h-0 no-scrollbar relative"
            >
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Search size={24} className="opacity-30" />
                        </div>
                        <p className="text-sm font-bold">Không tìm thấy kết quả</p>
                        <p className="text-xs opacity-60 mt-1">Thử tìm với từ khóa khác</p>
                    </div>
                ) : (
                    <div style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                        {virtualizer.getVirtualItems().map((v) => {
                            const item = filteredItems[v.index];
                            const isSelected = activeTab === 'lessons'
                                ? selectedLessonIds.has(Number(item.id))
                                : selectedDocumentIds.has(Number(item.id));

                            const isNew = isNewItem(item.createdAt);

                            return (
                                <div
                                    key={v.key}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${v.start}px)`,
                                        padding: '4px 8px'
                                    }}
                                >
                                    <div
                                        onClick={() => toggleSelection(Number(item.id))}
                                        className={cn(
                                            "relative flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 group overflow-hidden",
                                            isSelected
                                                ? "bg-primary/5 border-primary shadow-sm"
                                                : "bg-card border-transparent hover:border-primary/20 hover:shadow-sm hover:bg-card/80"
                                        )}
                                    >
                                        {/* Selection Checkbox */}
                                        <div className={cn(
                                            "w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all shrink-0",
                                            isSelected
                                                ? "bg-primary border-primary text-primary-foreground scale-110"
                                                : "border-border/60 bg-muted/10 group-hover:border-primary/60"
                                        )}>
                                            {isSelected && <Check size={12} strokeWidth={4} />}
                                        </div>

                                        {/* Icon */}
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 shadow-sm transition-transform group-hover:scale-105",
                                            activeTab === 'lessons'
                                                ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
                                                : "bg-gradient-to-br from-emerald-400 to-teal-600 text-white"
                                        )}>
                                            {activeTab === 'lessons' ? '📖' : '📄'}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div className="flex items-center gap-2">
                                                <h5 className={cn(
                                                    "font-bold text-xs truncate transition-colors",
                                                    isSelected ? "text-primary" : "text-foreground"
                                                )}>
                                                    {item.title}
                                                </h5>
                                                {isNew && (
                                                    <span className="px-1.5 py-0.5 rounded-[4px] bg-red-500 text-[8px] font-black text-white leading-none animate-pulse">
                                                        NEW
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-muted-foreground/80 flex items-center gap-1.5 mt-0.5">
                                                <span className="inline-block px-1.5 py-0.5 rounded-md bg-muted font-semibold text-[9px]">
                                                    {getCategoryName(item)}
                                                </span>
                                                {item.createdAt && (
                                                    <span className="opacity-50">
                                                        • {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
