import { LucideIcon, SearchX, FolderOpen, FileQuestion } from 'lucide-react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    variant?: 'default' | 'search' | 'folder';
}

const PRESET_ICONS = {
    default: FileQuestion,
    search: SearchX,
    folder: FolderOpen,
};

/**
 * Reusable empty state component for admin list pages.
 * Shows an icon, title, optional description, and optional CTA button.
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
    variant = 'default',
}: EmptyStateProps) {
    const Icon = icon ?? PRESET_ICONS[variant];

    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--admin-surface2)] border border-[var(--admin-border)] flex items-center justify-center mb-4">
                <Icon className="h-8 w-8 text-[var(--admin-text3)]" />
            </div>
            <h3 className="text-base font-bold text-[var(--admin-text)] mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-[var(--admin-text3)] max-w-sm">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="mt-5 px-5 py-2 bg-[var(--admin-accent)] text-[var(--admin-bg)] rounded-xl text-xs font-bold hover:opacity-90 transition-opacity"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
