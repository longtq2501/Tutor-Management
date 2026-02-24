import { Skeleton } from '@/components/ui/skeleton';

interface AdminTableSkeletonProps {
    rows?: number;
    cols?: number;
}

/**
 * Skeleton placeholder for AdminTable while data is loading.
 * Renders configurable number of skeleton rows and columns.
 */
export function AdminTableSkeleton({ rows = 8, cols = 5 }: AdminTableSkeletonProps) {
    return (
        <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-[var(--admin-surface2)]/50 border-b border-[var(--admin-border)] px-6 py-4">
                <div className="flex items-center gap-8">
                    {Array.from({ length: cols }).map((_, i) => (
                        <Skeleton key={i} className="h-3 w-20" />
                    ))}
                </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-[var(--admin-border)]">
                {Array.from({ length: rows }).map((_, rowIdx) => (
                    <div key={rowIdx} className="px-6 py-4 flex items-center gap-8">
                        {Array.from({ length: cols }).map((_, colIdx) => (
                            <Skeleton
                                key={colIdx}
                                className={`h-4 ${colIdx === 0 ? 'w-36' : colIdx === cols - 1 ? 'w-16' : 'w-24'}`}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
