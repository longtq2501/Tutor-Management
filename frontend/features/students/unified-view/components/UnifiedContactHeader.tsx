import React from 'react';
import { motion } from 'framer-motion';
import { Users, UserX, UserCircle, Wallet, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface UnifiedContactHeaderProps {
    stats: {
        active: number;
        inactive: number;
        parents: number;
        totalDebt: string;
    };
    searchTerm: string;
    onSearchChange: (val: string) => void;
    filter: string;
    onFilterChange: (val: string) => void;
    onAddStudent: () => void;
}

function StatsCard({
    icon,
    label,
    value,
    variant,
}: {
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
    variant: 'green' | 'gray' | 'blue' | 'red';
}) {
    const variants = {
        green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
        gray: "bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200 dark:border-slate-700",
        blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
        red: "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-800"
    };

    return (
        <div className={cn("flex flex-col p-4 rounded-xl border transition-all hover:shadow-md", variants[variant])}>
            <div className="flex items-center gap-2 opacity-80 mb-2">
                {icon}
                <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
        </div>
    );
}

function StatsOverview({ stats, isLoading, isError }: { stats: UnifiedContactHeaderProps['stats'], isLoading?: boolean, isError?: boolean }) {
    const renderValue = (val: number | string) => {
        if (isLoading) return <div className="h-8 w-16 bg-muted-foreground/10 animate-pulse rounded-lg" />;
        if (isError) return <span className="text-muted-foreground/40 text-lg">--</span>;
        return val;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatsCard icon={<Users className="w-5 h-5" />} label="Đang học" value={renderValue(stats.active)} variant="green" />
            <StatsCard icon={<UserX className="w-5 h-5" />} label="Đã nghỉ" value={renderValue(stats.inactive)} variant="gray" />
            <StatsCard icon={<UserCircle className="w-5 h-5" />} label="Phụ huynh" value={renderValue(stats.parents)} variant="blue" />
            <StatsCard icon={<Wallet className="w-5 h-5" />} label="Tổng nợ" value={renderValue(stats.totalDebt)} variant="red" />
        </div>
    );
}

export function UnifiedContactStats({ stats, isLoading, isError }: { stats: UnifiedContactHeaderProps['stats'], isLoading?: boolean, isError?: boolean }) {
    return (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <StatsOverview stats={stats} isLoading={isLoading} isError={isError} />
        </div>
    );
}

export function UnifiedContactActions(props: Omit<UnifiedContactHeaderProps, 'stats'>) {
    return (
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:items-center justify-start lg:justify-end w-full animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="relative w-full md:w-48 lg:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                    placeholder="Tìm kiếm..."
                    className="pl-9 h-10 w-full rounded-xl border-border/60 bg-background focus:ring-primary/10 transition-all font-medium text-sm"
                    value={props.searchTerm}
                    onChange={(e) => props.onSearchChange(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <Tabs value={props.filter} onValueChange={props.onFilterChange} className="flex-1 sm:flex-none min-w-0">
                    <TabsList className="h-10 p-1 bg-muted/50 rounded-xl border border-border/40 w-full sm:w-auto">
                        <TabsTrigger value="all" className="flex-1 sm:flex-none rounded-lg font-bold text-[10px] h-8 px-2 sm:px-3">Tất cả</TabsTrigger>
                        <TabsTrigger value="active" className="flex-1 sm:flex-none rounded-lg font-bold text-[10px] h-8 px-2 sm:px-3">Đang học</TabsTrigger>
                        <TabsTrigger value="inactive" className="flex-1 sm:flex-none rounded-lg font-bold text-[10px] h-8 px-2 sm:px-3">Đã nghỉ</TabsTrigger>
                    </TabsList>
                </Tabs>

                <Button
                    size="sm"
                    onClick={props.onAddStudent}
                    className="h-10 w-10 sm:w-auto shrink-0 rounded-xl bg-primary shadow-lg shadow-primary/20 font-bold text-xs gap-1.5 hover:scale-105 active:scale-95 transition-all p-0 sm:px-4"
                >
                    <Plus size={16} /> <span className="hidden sm:inline">Thêm học sinh</span>
                </Button>
            </div>
        </div>
    );
}
