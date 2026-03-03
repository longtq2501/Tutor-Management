'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Check, Layers } from 'lucide-react';
import { ReactNode, memo } from 'react';

interface PremiumCategoryCardProps {
    icon?: ReactNode;
    title: string;
    count: number;
    gradient?: string;
    color?: string;
    isActive?: boolean;
    onClick?: () => void;
}

export const PremiumCategoryCard = memo(({
    icon,
    title,
    count,
    gradient = "from-blue-500 to-cyan-500",
    color,
    isActive,
    onClick
}: PremiumCategoryCardProps) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden",
                "flex items-center gap-3 px-3 py-2 rounded-lg border text-left w-full h-16", // Horizontal Layout, Fixed Height
                "transition-all duration-300",
                "will-change-transform contain-layout",
                isActive
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
                    : "border-border hover:border-primary/50 bg-card shadow-sm hover:shadow"
            )}
        >
            {/* Dynamic Gradient Background Overlay */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500",
                "group-hover:opacity-[0.03]",
                gradient
            )} />

            {/* Icon Section - Compact */}
            <div className={cn(
                "w-10 h-10 rounded-md flex items-center justify-center shrink-0",
                "bg-gradient-to-br shadow-sm transition-all duration-500",
                "group-hover:scale-110 group-hover:rotate-3",
                gradient,
                "text-white"
            )}>
                {icon || <Layers className="w-5 h-5" />}
            </div>

            {/* Content - Side by Side */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="font-bold text-sm text-foreground tracking-tight group-hover:text-primary transition-colors duration-300 truncate">
                    {title}
                </h4>
                <div className="flex items-center gap-1.5 opacity-80">
                    <span className="text-xs font-bold tabular-nums">
                        {count}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider">
                        bài
                    </span>
                </div>
            </div>

            {/* Selection Indicator */}
            {isActive && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-sm shrink-0"
                >
                    <Check className="w-3 h-3 stroke-[3]" />
                </motion.div>
            )}

            {/* Decorative Orbs - Minimized */}
            <div className={cn(
                "absolute -right-4 -bottom-4 w-12 h-12 rounded-full",
                "bg-gradient-to-br opacity-5 blur-xl transition-all duration-700",
                "group-hover:opacity-20",
                gradient
            )} />
        </motion.button>
    );
});

PremiumCategoryCard.displayName = 'PremiumCategoryCard';
