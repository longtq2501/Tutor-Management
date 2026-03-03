'use client';

import React, { useMemo } from 'react';
import { Timer, Users, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AnimatePresence, motion } from 'framer-motion';

interface InactivityWarningProps {
    warning: string | null;
    secondsRemaining: number | null;
}

/**
 * Professional alert component for room status and inactivity warnings.
 * Now features visual urgency indicators.
 */
export const InactivityWarning: React.FC<InactivityWarningProps> = ({ warning, secondsRemaining }) => {
    // Determine visual urgency based on remaining time
    const urgency = useMemo(() => {
        if (secondsRemaining === null) return { variant: "default" as const, colorClass: "text-primary", Icon: Users };
        if (secondsRemaining < 30) return { variant: "destructive" as const, colorClass: "text-destructive", Icon: AlertTriangle };
        if (secondsRemaining < 60) return { variant: "default" as const, colorClass: "text-amber-500", Icon: Timer };
        return { variant: "default" as const, colorClass: "text-primary", Icon: Timer };
    }, [secondsRemaining]);

    if (!warning) return null;

    const { variant, colorClass, Icon } = urgency;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
            >
                <Alert
                    variant={variant}
                    className={`shadow-xl border-2 transition-colors duration-500 ${variant === 'default' ? 'bg-background/95 backdrop-blur-md' : ''}`}
                >
                    <Icon className={`h-4 w-4 ${colorClass}`} />
                    <AlertTitle className="flex items-center justify-between ml-2">
                        <span className="font-semibold">Thông báo hệ thống</span>
                        {secondsRemaining !== null && (
                            <motion.span
                                key={secondsRemaining}
                                initial={{ scale: 1.1 }}
                                animate={{ scale: 1 }}
                                className={`font-mono font-bold text-lg ${colorClass}`}
                            >
                                {formatTime(secondsRemaining)}
                            </motion.span>
                        )}
                    </AlertTitle>
                    <AlertDescription className="ml-2 text-sm opacity-90 font-medium">
                        {warning}
                    </AlertDescription>
                </Alert>
            </motion.div>
        </AnimatePresence>
    );
};
