'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

const HeroDashboardPreview: React.FC = () => {
    return (
        <motion.div
            data-testid="hero-dashboard-preview"
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="hidden md:block w-full max-w-4xl mb-12 pointer-events-auto"
        >
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
                <div className="absolute top-4 right-4 z-20 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 backdrop-blur-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live
                </div>
                <Image
                    src="/screenshots/dashboard-overview.png"
                    alt="Tutor Pro dashboard overview"
                    width={1600}
                    height={900}
                    priority
                    className="h-auto w-full"
                />
            </div>
        </motion.div>
    );
};

export default HeroDashboardPreview;
