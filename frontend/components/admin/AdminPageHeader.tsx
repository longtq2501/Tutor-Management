'use client';

import { LucideIcon, Sparkles } from 'lucide-react';
import React from 'react';
import { motion } from 'framer-motion';

interface AdminPageHeaderProps {
    title: string;
    subtitle: string;
    category?: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
}

export function AdminPageHeader({
    title,
    subtitle,
    category,
    icon: Icon,
    actions
}: AdminPageHeaderProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.33, 1, 0.68, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2"
        >
            <div className="flex flex-col gap-3">
                {category && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center gap-2.5 text-primary text-[10px] font-black uppercase tracking-[0.3em] bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-full w-fit backdrop-blur-md shadow-glow-sm shadow-primary/10"
                    >
                        {Icon ? <Icon className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                        <span>{category}</span>
                    </motion.div>
                )}
                <div className="space-y-1">
                    <h1 className="text-5xl font-black text-foreground tracking-tighter leading-tight drop-shadow-sm">
                        {title}
                        <span className="text-primary inline-block ml-1 animate-pulse prose-invert">.</span>
                    </h1>
                    <p className="text-muted-foreground text-sm font-black uppercase tracking-[0.15em] opacity-60 flex items-center gap-2">
                        <span className="w-8 h-px bg-border/50" />
                        {subtitle}
                    </p>
                </div>
            </div>

            {actions && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center gap-3 backdrop-blur-xl p-2 bg-white/5 dark:bg-black/5 rounded-[1.5rem] border border-border/10 shadow-premium"
                >
                    {actions}
                </motion.div>
            )}
        </motion.div>
    );
}
