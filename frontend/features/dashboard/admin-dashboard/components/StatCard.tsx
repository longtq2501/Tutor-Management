// ============================================================================
// FILE: admin-dashboard/components/StatCard.tsx (PREMIUM VERSION)
// ============================================================================
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { memo } from 'react';

interface StatCardProps {
  title: React.ReactNode;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  variant: 'blue' | 'green' | 'red' | 'purple';
  badge?: React.ReactNode;
  progressBar?: {
    percentage: number;
    color: 'green' | 'red';
  };
  trend?: {
    direction: 'up' | 'down';
    value: number; // percentage change
  };
  isLoading?: boolean;
}

const gradients = {
  blue: 'from-blue-500 to-cyan-500',
  green: 'from-green-500 to-emerald-500',
  red: 'from-red-500 to-rose-500',
  purple: 'from-purple-500 to-pink-500'
};

const bgColors = {
  blue: 'bg-blue-50 dark:bg-blue-950/20',
  green: 'bg-green-50 dark:bg-green-950/20',
  red: 'bg-red-50 dark:bg-red-950/20',
  purple: 'bg-purple-50 dark:bg-purple-950/20'
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
        "rounded-2xl sm:rounded-3xl border p-5 sm:p-6 lg:p-7",
        "animate-pulse",
        bgColors[variant]
      )}>
        <div className="space-y-4">
          {/* 1. Header Row (Icon & Trend) */}
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-muted/50 rounded-2xl sm:rounded-3xl" />
            <div className="h-6 w-16 bg-muted/50 rounded-full" />
          </div>

          {/* 2. Label - Khớp với height thực tế */}
          <div className="h-3 sm:h-4 bg-muted/50 rounded w-24" />

          {/* 3. Value - Chỉnh lại h-8/h-9 để không bị cao hơn thực tế */}
          <div className="h-6 sm:h-7 lg:h-8 bg-muted/50 rounded w-48" />

          {/* 4. Footer Placeholder (Badge/Subtitle) - Dùng h-5/h-6 để vừa khít */}
          <div className="h-5 sm:h-6 bg-muted/40 rounded w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={cn(
        "group relative overflow-hidden",
        "rounded-2xl sm:rounded-3xl border",
        "p-5 sm:p-6 lg:p-7",
        "transition-all duration-300",
        bgColors[variant],
        "hover:shadow-2xl hover:shadow-black/10 hover:border-transparent",
        "dark:border-white/10",
        "will-change-transform contain-layout" // GPU Acceleration
      )}
    >
      {/* Animated Gradient Background */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-0",
        "group-hover:opacity-5 transition-opacity duration-500",
        gradients[variant]
      )} />

      {/* Decorative Orb */}
      <div className={cn(
        "absolute -right-12 -bottom-12 w-40 h-40 rounded-full blur-3xl",
        "bg-gradient-to-br opacity-5 transition-all duration-700",
        "group-hover:opacity-10 group-hover:scale-150",
        gradients[variant]
      )} />

      {/* Content */}
      <div className="relative space-y-4">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          {/* Icon */}
          <motion.div
            whileHover={{ rotate: 5, scale: 1.1 }}
            className={cn(
              "flex items-center justify-center",
              "w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16",
              "rounded-2xl sm:rounded-3xl shadow-lg",
              "bg-gradient-to-br",
              gradients[variant],
              "transition-transform duration-300"
            )}
          >
            <div className="text-white [&>svg]:w-6 [&>svg]:h-6 sm:[&>svg]:w-7 sm:[&>svg]:h-7 lg:[&>svg]:w-8 lg:[&>svg]:h-8">
              {icon}
            </div>
          </motion.div>

          {/* Trend Badge */}
          {trend && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full",
                "text-xs font-medium",
                trend.direction === 'up'
                  ? "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                  : "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
              )}
            >
              {trend.direction === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend.value > 0 ? '+' : ''}{trend.value}%
            </motion.div>
          )}
        </div>

        {/* Label */}
        <div className="text-xs sm:text-sm text-muted-foreground font-medium uppercase tracking-wide">
          {title}
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-2">
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums break-all">
            {value}
          </h3>
        </div>

        {/* Badge or Subtitle */}
        {badge && (
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {badge}
          </motion.div>
        )}

        {subtitle && !progressBar && !badge && (
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-muted-foreground font-medium truncate"
          >
            {subtitle}
          </motion.div>
        )}

        {/* Progress Bar */}
        {progressBar && (
          <div className="space-y-2 pt-2">
            {/* Progress Bar */}
            <div className="h-2 sm:h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressBar.percentage}%` }}
                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  progressBar.color === 'green' && "bg-gradient-to-r from-green-500 to-emerald-500",
                  progressBar.color === 'red' && "bg-gradient-to-r from-red-500 to-rose-500"
                )}
              />
            </div>

            {/* Subtitle below progress */}
            {subtitle && (
              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
});
StatCard.displayName = 'StatCard';