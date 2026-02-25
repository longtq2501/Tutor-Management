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
    green: 'bg-green-500/10 text-green-500 border-green-500/20 shadow-glow-sm shadow-green-500/10',
    red: 'bg-red-500/10 text-red-500 border-red-500/20 shadow-glow-sm shadow-red-500/10',
    amber: 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-glow-sm shadow-amber-500/10',
    accent: 'bg-primary/10 text-primary border-primary/20 shadow-glow-sm shadow-primary/10',
};

export function StatCard({ label, value, icon: Icon, badge, glowColor = '#6366f1', index = 0 }: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1, ease: [0.33, 1, 0.68, 1] }}
            className="relative group glass border-premium rounded-3xl p-8 overflow-hidden shadow-premium backdrop-blur-xl transition-all duration-500 hover:scale-[1.02]"
        >
            {/* Advanced Glow Effect */}
            <div
                className="absolute -top-16 -right-16 w-48 h-48 blur-[80px] opacity-[0.05] group-hover:opacity-[0.15] transition-opacity duration-700 pointer-events-none rounded-full"
                style={{ backgroundColor: glowColor }}
            />
            <div
                className="absolute -bottom-16 -left-16 w-32 h-32 blur-[60px] opacity-[0.02] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none rounded-full bg-primary"
            />

            <div className="relative z-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {Icon && (
                            <div
                                className="w-12 h-12 flex items-center justify-center bg-white dark:bg-white/5 border border-border/50 rounded-xl text-muted-foreground group-hover:text-primary group-hover:border-primary/20 transition-all duration-500 shadow-glow-sm group-hover:shadow-primary/10"
                            >
                                <Icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-500" />
                            </div>
                        )}
                        <span className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.25em]">{label}</span>
                    </div>

                    {badge && (
                        <motion.span
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 + (index * 0.1) }}
                            className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${variantStyles[badge.variant]}`}
                        >
                            {badge.text}
                        </motion.span>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="text-4xl font-black text-foreground tracking-tighter tabular-nums drop-shadow-sm">
                        {value}
                    </h3>
                    <div className="w-12 h-1 bg-gradient-to-r from-primary to-transparent rounded-full opacity-40 group-hover:w-24 transition-all duration-700" />
                </div>
            </div>
        </motion.div>
    );
}
