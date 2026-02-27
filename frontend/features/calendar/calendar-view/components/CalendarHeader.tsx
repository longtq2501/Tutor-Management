'use client';

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Columns, List, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatsOverview } from './StatsOverview';
import { FilterPopover } from './FilterPopover';
import { HeaderActions } from './HeaderActions';
import { Button } from '@/components/ui/button';
import type { SessionRecord } from '@/lib/types/finance';
import type { CalendarStats } from '../types';
import type { CalendarViewType } from "./ViewSwitcher";

interface Props {
  currentDate: Date;
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  onNavigate: (dir: number) => void;
  onToday: () => void;
  onAddSession: () => void;
  onAutoGenerate: () => void;
  onGenerateInvoice: () => void;
  isGenerating?: boolean;
  sessions: SessionRecord[];
  stats: CalendarStats;
  currentFilter?: string;
  searchQuery?: string;
  onFilterChange?: (status: string | 'ALL') => void;
  onSearchChange?: (query: string) => void;
  onDeleteMonth?: () => void;
  isFetching?: boolean;
}

export const CalendarActions = ({
  currentDate, currentView, onViewChange, onNavigate, onToday, onAddSession,
  onAutoGenerate, onGenerateInvoice, isGenerating = false, sessions, stats,
  onFilterChange, currentFilter = 'ALL', searchQuery = '',
  onSearchChange, onDeleteMonth, isFetching = false
}: Props) => {
  return (
    // Outer wrapper: stack vertically on small screens, row on xl+
    <div className="flex flex-col xl:flex-row xl:items-center gap-2 xl:gap-3 w-full">

      {/* Row 1 (on mobile/md): Navigation + View Tabs + Filter + Actions */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 xl:contents">

        {/* Navigation Controls */}
        <div className="flex items-center bg-muted/50 rounded-2xl p-0.5 border border-border/40 shadow-sm shrink-0">
          <Button variant="ghost" size="icon" onClick={() => onNavigate(-1)} className="rounded-xl h-8 w-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={onToday}
            className="px-2 sm:px-3 font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-xl h-8 whitespace-nowrap"
          >
            Tháng này
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onNavigate(1)} className="rounded-xl h-8 w-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* View Tabs — visible from md up */}
        <Tabs value={currentView} onValueChange={(v) => onViewChange(v as CalendarViewType)} className="hidden md:flex shrink-0">
          <TabsList className="bg-muted/50 p-0.5 sm:p-1 rounded-2xl border border-border/40 h-8 2xl:h-10">
            <TabsTrigger value="month" className="rounded-xl px-1.5 2xl:px-3 font-black uppercase tracking-tighter text-[9px] xl:text-[8px] 2xl:text-[9px]">
              <CalendarIcon className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">Tháng</span>
            </TabsTrigger>
            <TabsTrigger value="week" className="rounded-xl px-1.5 2xl:px-3 font-black uppercase tracking-tighter text-[9px] xl:text-[8px] 2xl:text-[9px]">
              <Columns className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">Tuần</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-xl px-1.5 2xl:px-3 font-black uppercase tracking-tighter text-[9px] xl:text-[8px] 2xl:text-[9px]">
              <List className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">D.Sách</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Spacer pushes Filter + Actions to the right on larger screens */}
        <div className="flex-1 hidden xl:block" />

        {/* Stats — show from xl, placed inline before filter/actions on xl+ */}
        <div className="hidden xl:flex items-center gap-1 2xl:gap-2 shrink-0">
          <StatsOverview stats={stats} />
        </div>

        {/* Filter + Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 ml-auto xl:ml-0">
          <FilterPopover
            currentFilter={currentFilter}
            searchQuery={searchQuery}
            onFilterChange={onFilterChange!}
            onSearchChange={onSearchChange!}
          />
          <HeaderActions
            onAddSession={onAddSession}
            onGenerateInvoice={onGenerateInvoice}
            onAutoGenerate={onAutoGenerate}
            onDeleteMonth={onDeleteMonth!}
            isGenerating={isGenerating}
            sessionsCount={sessions.length}
          />
        </div>
      </div>

      {/* Stats row visible only on md and below xl (between nav row and calendar) */}
      <div className="flex xl:hidden items-center gap-2 flex-wrap">
        <StatsOverview stats={stats} />
      </div>

    </div>
  );
};