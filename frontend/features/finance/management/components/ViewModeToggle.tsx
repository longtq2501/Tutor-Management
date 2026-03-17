'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, CreditCard } from 'lucide-react';

interface ViewModeToggleProps {
    /** The current view mode */
    viewMode: 'MONTHLY' | 'DEBT';
    /** Callback to change view mode */
    setViewMode: (mode: 'MONTHLY' | 'DEBT') => void;
}

/**
 * Component to toggle between different finance view modes.
 * Supports mobile dropdown and desktop animated tabs.
 */
export function ViewModeToggle({ viewMode, setViewMode }: ViewModeToggleProps) {
    return (
        <div data-tour="finance-view-toggle" className="w-full sm:w-auto md:w-auto">
            {/* Mobile Dropdown */}
            <div className="md:hidden w-full sm:min-w-[160px]">
                <Select value={viewMode} onValueChange={(v) => setViewMode(v as 'MONTHLY' | 'DEBT')}>
                    <SelectTrigger className="w-full bg-muted/40 border-border/50 font-bold">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MONTHLY">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4" />
                                <span>Theo Tháng</span>
                            </div>
                        </SelectItem>
                        <SelectItem value="DEBT">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                <span>Công Nợ</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Desktop Tabs */}
            <div className="hidden md:flex p-1 bg-muted/40 rounded-xl border border-border/50 relative">
                {(['MONTHLY', 'DEBT'] as const).map((mode) => {
                    const isActive = viewMode === mode;
                    return (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            data-tour={mode === 'DEBT' ? 'finance-debt-view' : undefined}
                            className={cn(
                                "relative flex items-center justify-center gap-2 px-3 lg:px-5 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm font-bold transition-colors z-10",
                                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="active-view-tab"
                                    className="absolute inset-0 bg-background rounded-lg shadow-sm ring-1 ring-border/50"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">
                                {mode === 'MONTHLY' ? <CalendarIcon className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                {mode === 'MONTHLY' ? 'Theo Tháng' : 'Công Nợ'}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
