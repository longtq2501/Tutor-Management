import React from 'react';
import { motion } from 'framer-motion';

interface StatsBarItem {
    label: string;
    value: string | number;
    variant?: 'default' | 'green' | 'red' | 'accent';
}

interface StatsBarProps {
    items: StatsBarItem[];
}

export function StatsBar({ items }: StatsBarProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
            {items.map((stat, idx) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ scale: 1.05 }}
                    className="glass border-premium rounded-[1.5rem] p-5 flex flex-col gap-2 shadow-premium backdrop-blur-xl group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-full blur-xl translate-x-4 -translate-y-4" />

                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] group-hover:text-primary transition-colors duration-300">
                        {stat.label}
                    </span>

                    <div className="flex items-center gap-2">
                        <span className={`text-2xl font-black tabular-nums transition-all duration-500 drop-shadow-sm ${stat.variant === 'green' ? 'text-green-500' :
                                stat.variant === 'red' ? 'text-red-500' :
                                    stat.variant === 'accent' ? 'text-primary' : 'text-foreground'
                            }`}>
                            {stat.value}
                        </span>
                    </div>

                    <div className="w-6 h-1 bg-border/50 rounded-full group-hover:w-full group-hover:bg-primary transition-all duration-700" />
                </motion.div>
            ))}
        </div>
    );
}
