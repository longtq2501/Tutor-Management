import { Calendar, Columns, LayoutList, List, type LucideIcon } from 'lucide-react';

export type CalendarViewType = 'month' | 'week' | 'day' | 'list';

interface ViewSwitcherProps {
    currentView: CalendarViewType;
    onViewChange: (view: CalendarViewType) => void;
}

/**
 * ViewSwitcher Component
 * 
 * Allows users to toggle between different calendar layouts.
 */
export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
    const views: { id: CalendarViewType; label: string; icon: LucideIcon }[] = [
        { id: 'month', label: 'Tháng', icon: Calendar },
        { id: 'week', label: 'Tuần', icon: Columns },
        { id: 'day', label: 'Ngày', icon: LayoutList },
        { id: 'list', label: 'Danh sách', icon: List },
    ];

    return (
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border">
            {views.map((view) => {
                const Icon = view.icon;
                const isActive = currentView === view.id;

                return (
                    <button
                        key={view.id}
                        onClick={() => onViewChange(view.id)}
                        className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${isActive
                                ? 'bg-background text-primary shadow-sm border border-border'
                                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'}
            `}
                    >
                        <Icon size={14} />
                        <span className="hidden md:inline">{view.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
