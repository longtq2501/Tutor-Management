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
                {/* Fallback to a simple blurred sphere if Spline fails */}
                <div className="w-64 h-64 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-[80px] opacity-20" />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full overflow-hidden">
            {/* Subtle Loading Glow */}
            <AnimatePresence mode="wait">
                {!isSceneLoaded && (
                    <motion.div
                        key="placeholder"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                        className="absolute inset-0 z-10 flex items-center justify-center"
                    >
                        <div className="w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full animate-pulse" />
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
