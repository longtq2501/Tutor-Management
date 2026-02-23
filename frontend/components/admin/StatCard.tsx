'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string;
    icon?: LucideIcon;
    badge?: {
        text: string;
        variant: 'green' | 'red' | 'amber' | 'accent';
    };
    glowColor?: string;
    index?: number;
}

const variantStyles = {
    green: 'bg-[var(--admin-green)]/10 text-[var(--admin-green)] border-[var(--admin-green)]/20',
    red: 'bg-[var(--admin-red)]/10 text-[var(--admin-red)] border-[var(--admin-red)]/20',
    amber: 'bg-[var(--admin-amber)]/10 text-[var(--admin-amber)] border-[var(--admin-amber)]/20',
    accent: 'bg-[var(--admin-accent)]/10 text-[var(--admin-accent)] border-[var(--admin-accent)]/20',
};

export function StatCard({ label, value, icon: Icon, badge, glowColor = '#6366f1', index = 0 }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative group bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-6 overflow-hidden hover:border-[var(--admin-border2)] transition-all duration-300"
        >
            {/* Glow Effect */}
            <div
                className="absolute -top-12 -right-12 w-32 h-32 blur-[60px] opacity-[0.03] dark:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"
                style={{ backgroundColor: glowColor }}
            />

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="p-2 bg-[var(--admin-surface2)] rounded-lg text-[var(--admin-text2)] group-hover:text-[var(--admin-text)] transition-colors">
                                <Icon className="h-5 w-5" />
                            </div>
                        )}
                        <span className="text-sm font-medium text-[var(--admin-text2)]">{label}</span>
                    </div>

                    {badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${variantStyles[badge.variant]}`}>
                            {badge.text}
                        </span>
                    )}
                </div>

                <div className="flex flex-col">
                    <h3 className="text-3xl font-bold text-[var(--admin-text)] tracking-tight">
                        {value}
                    </h3>
                </div>
            </div>
        </motion.div>
    );
}
