import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton for the main admin dashboard overview. */
export const LoadingState = () => (
  <div className="space-y-6 lg:space-y-8 pb-10 animate-pulse">
    {/* Header skeleton */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>

    {/* Stat cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>

    {/* Chart skeleton */}
    <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-[280px] w-full rounded-xl" />
    </div>
  </div>
);