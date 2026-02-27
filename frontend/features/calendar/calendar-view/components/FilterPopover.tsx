"use client";

import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Filter, Search, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LESSON_STATUS_LABELS } from '@/lib/types/lesson-status';
import { getStatusColors } from '../utils/statusColors';
import { motion } from 'framer-motion';

interface FilterPopoverProps {
    currentFilter: string;
    searchQuery: string;
    onFilterChange: (status: string | 'ALL') => void;
    onSearchChange: (query: string) => void;
}

export function FilterPopover({
    currentFilter,
    searchQuery,
    onFilterChange,
    onSearchChange,
}: FilterPopoverProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleStatusSelect = (status: string | 'ALL') => {
        onFilterChange(status);
        setTimeout(() => setIsOpen(false), 200);
    };

    const isFiltered = currentFilter !== 'ALL' || searchQuery;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 2xl:h-10 rounded-2xl px-2 2xl:px-4 gap-1 border-border/40 hover:bg-muted/50 bg-card/50 shadow-sm transition-all active:scale-95">
                    <Filter size={14} className={cn("w-3.5 h-3.5 2xl:w-4 2xl:h-4", isFiltered ? "text-primary fill-primary" : "")} />
                    <span className="text-[8px] 2xl:text-[11px] font-black uppercase tracking-tighter 2xl:tracking-widest hidden sm:inline">
                        Bộ lọc {isFiltered && "•"}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[calc(100vw-24px)] xs:w-72 sm:w-80 p-3.5 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border-border/60 shadow-2xl space-y-3.5 sm:space-y-5 bg-background/95 backdrop-blur-xl animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 duration-300" align="end" sideOffset={8}>
                <div className="space-y-2 sm:space-y-3">
                    <p className="text-[7.5px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Tìm kiếm</p>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors sm:hidden" size={14} />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors hidden sm:block" size={16} />
                        <input
                            type="text"
                            placeholder="Tên học sinh, môn học..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-8 sm:pl-10 pr-4 h-[34px] sm:h-11 bg-muted/50 border border-border/60 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between ml-1">
                        <p className="text-[7.5px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Trạng thái</p>
                        {currentFilter !== 'ALL' && (
                            <button onClick={() => handleStatusSelect('ALL')} className="text-[7.5px] sm:text-[9px] font-black uppercase text-primary hover:underline transition-all">Xóa lọc</button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 gap-1 sm:gap-1.5 mt-1 sm:mt-2 max-h-[40vh] overflow-y-auto no-scrollbar pr-1">
                        <FilterButton isActive={currentFilter === 'ALL'} onClick={() => handleStatusSelect('ALL')} label="Tất cả trạng thái" />
                        {Object.entries(LESSON_STATUS_LABELS).map(([status, label]) => (
                            <FilterButton
                                key={status}
                                isActive={currentFilter === status}
                                onClick={() => handleStatusSelect(status)}
                                label={label}
                                status={status as any}
                            />
                        ))}
                    </div>
                </div>

                {isFiltered && (
                    <div className="pt-1 sm:pt-2">
                        <Button variant="outline" size="sm" className="w-full rounded-lg sm:rounded-xl h-9 sm:h-11 font-black uppercase tracking-widest text-[8px] sm:text-[9px] border-dashed text-muted-foreground hover:text-primary hover:border-primary/50 transition-all" onClick={() => { onSearchChange(''); onFilterChange('ALL'); setTimeout(() => setIsOpen(false), 300); }}>
                            Đặt lại tất cả filters
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

function FilterButton({ isActive, onClick, label, status }: { isActive: boolean; onClick: () => void; label: string; status?: any }) {
    const colors = status ? getStatusColors(status) : null;
    return (
        <Button
            variant={isActive ? 'secondary' : 'ghost'}
            onClick={onClick}
            className={cn("justify-start h-[32px] sm:h-10 rounded-lg sm:rounded-xl px-2.5 sm:px-3 font-bold text-[10px] sm:text-xs transition-all", isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "hover:bg-muted")}
        >
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {colors && <div className={cn("w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full", colors.dot)} />}
                    <span className={cn(isActive && "text-primary")}>{label}</span>
                </div>
                {isActive && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <CheckCircle2 size={12} className="sm:hidden text-primary" />
                        <CheckCircle2 size={14} className="hidden sm:block text-primary" />
                    </motion.div>
                )}
            </div>
        </Button>
    );
}
