// ============================================================================
// FILE: student-dashboard/components/StatCard.tsx (PREMIUM STUDENT VERSION)
// ============================================================================
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { memo } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant: 'blue' | 'green' | 'red' | 'purple' | 'indigo' | 'orange';
  badge?: React.ReactNode;
  progressBar?: {
    percentage: number;
    color: 'green' | 'red' | 'blue';
  };
  trend?: {
    direction: 'up' | 'down';
    value: number; // percentage change
  };
  isLoading?: boolean;
}

const gradients: Record<string, string> = {
  blue: 'from-blue-400 to-cyan-400',
  green: 'from-emerald-400 to-teal-400',
  red: 'from-red-400 to-rose-400',
  purple: 'from-purple-400 to-fuchsia-400',
  indigo: 'from-indigo-400 to-violet-400',
  orange: 'from-orange-400 to-amber-400',
};

const bgColors: Record<string, string> = {
  blue: 'bg-blue-50 dark:bg-blue-950/20',
  green: 'bg-emerald-50 dark:bg-emerald-950/20',
  red: 'bg-red-50 dark:bg-red-950/20',
  purple: 'bg-purple-50 dark:bg-purple-950/20',
  indigo: 'bg-indigo-50 dark:bg-indigo-950/20',
  orange: 'bg-orange-50 dark:bg-orange-950/20',
};

export const StatCard = memo(({
  title,
  value,
  subtitle,
  icon,
  variant,
  badge,
  progressBar,
  trend,
  isLoading = false,
}: StatCardProps) => {
  if (isLoading) {
    return (
      <div className={cn(
        "rounded-3xl border border-white/40 dark:border-white/5 p-6",
        "animate-pulse backdrop-blur-sm",
        bgColors[variant]
      )}>
        <div className="space-y-4">
          {/* 1. Header Row */}
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 bg-white/50 dark:bg-white/10 rounded-2xl" />
            <div className="h-6 w-16 bg-white/50 dark:bg-white/10 rounded-full" />
          </div>
          {/* 2. Label */}
          <div className="h-4 bg-white/50 dark:bg-white/10 rounded w-24" />
          {/* 3. Value */}
          <div className="h-8 bg-white/50 dark:bg-white/10 rounded w-48" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring" }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "group relative overflow-hidden",
        "rounded-3xl border border-white/60 dark:border-white/10",
        "p-6 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10",
        bgColors[variant],
        "transition-all duration-300",
        "backdrop-blur-md"
      )}
    >
      {/* Decorative Gradient Blob */}
      <div className={cn(
        "absolute -right-16 -top-16 w-64 h-64 rounded-full blur-3xl opacity-20",
        "bg-gradient-to-br transition-transform duration-700 group-hover:scale-110",
        gradients[variant]
      )} />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={cn(
              "flex items-center justify-center",
              "w-14 h-14 rounded-2xl shadow-md",
              "bg-gradient-to-br text-white",
              gradients[variant]
            )}
          >
            {icon}
          </motion.div>
          {badge}
        </div>

        {/* Content */}
        <div>
          <p className="text-sm text-foreground/60 font-medium uppercase tracking-wider mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-black tracking-tight text-foreground">
            {value}
          </h3>
        </div>

        {/* Footer / Progress */}
        {progressBar && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-foreground/70">
              <span>Tiến độ</span>
              <span>{Math.round(progressBar.percentage)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressBar.percentage}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className={cn("h-full rounded-full bg-gradient-to-r", gradients[variant])}
              />
            </div>
          </div>
        )}

        {subtitle && (
          <div className="text-sm font-medium text-foreground/60 flex items-center gap-1">
            {subtitle}
          </div>
        )}
      </div>
    </motion.div>
  );
});
StatCard.displayName = 'StatCard';