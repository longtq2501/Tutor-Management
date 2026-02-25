'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const Spline = React.lazy(() => import('@splinetool/react-spline'));

/**
 * SplineVisual Component
 * Handles the 3D model loading with a smooth transition from a placeholder image.
 * 
 * @returns {JSX.Element} The 3D visual component
 */
const SplineVisual: React.FC = () => {
    const [isSceneLoaded, setIsSceneLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Fallback if loading takes too long (e.g., 10s)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isSceneLoaded) {
                console.warn('Spline loading timeout - staying with placeholder');
            }
        }, 10000);
        return () => clearTimeout(timer);
    }, [isSceneLoaded]);

    if (hasError) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/20 to-purple-900/20">
                <div className="relative w-full h-full opacity-50">
                    <Image
                        src="/hero_3d_placeholder.png"
                        alt="3D Education Scene"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* High-Quality Placeholder */}
            <AnimatePresence mode="wait">
                {!isSceneLoaded && (
                    <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 z-10"
                    >
                        <Image
                            src="/hero_3d_placeholder.png"
                            alt="Loading 3D Scene..."
                            fill
                            className="object-cover lg:scale-[1.3] translate-y-[5%]"
                            priority
                            sizes="(max-width: 1024px) 100vw, 80vw"
                        />
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3D Spline Model */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isSceneLoaded ? { opacity: 1, scale: 1.3 } : { opacity: 0, scale: 0.8 }}
                transition={{
                    duration: 1.5,
                    ease: [0.23, 1, 0.32, 1],
                }}
                className="w-full h-full translate-y-[5%]"
            >
                <Suspense fallback={null}>
                    <Spline
                        scene="https://prod.spline.design/yOWRQthqdHLGOrNC/scene.splinecode"
                        onLoad={() => setIsSceneLoaded(true)}
                        onError={() => setHasError(true)}
                        style={{ width: '100%', height: '100%' }}
                    />
                </Suspense>
            </motion.div>
        </div>
    );
};

export default SplineVisual;
