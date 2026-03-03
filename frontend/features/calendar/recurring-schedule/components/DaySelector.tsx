// ============================================================================
// 📁 recurring-schedule/components/DaySelector.tsx

import { Label } from '@/components/ui/label';
import { memo } from 'react';
import { DAYS_OF_WEEK } from "../utils/timeCalculation";

interface DaySelectorProps {
  selectedDays: number[];
  onToggle: (day: number) => void;
}

export const DaySelector = memo(({ selectedDays, onToggle }: DaySelectorProps) => {
  return (
    <div className="space-y-4">
      <Label className="block text-sm font-semibold text-foreground">
        Chọn ngày trong tuần <span className="text-destructive">*</span>
      </Label>
      <div className="flex justify-between gap-2 overflow-x-auto pb-2 scrollbar-none">
        {DAYS_OF_WEEK.map(day => {
          const isSelected = selectedDays.includes(day.value);
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => onToggle(day.value)}
              className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-200 shrink-0 ${isSelected
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                : 'bg-muted/30 border border-border/50 text-muted-foreground hover:border-primary/50'
                }`}
              title={day.full}
            >
              {day.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});
DaySelector.displayName = 'DaySelector';