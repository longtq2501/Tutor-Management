'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * ExamVisual Component
 * Enhanced quiz interface mockup with progress tracking and realistic exam layout
 */
const ExamVisual: React.FC = () => {
    const questionGrid = Array.from({ length: 25 }, (_, i) => {
        if (i === 0) return 'current';
        if (i < 12) return 'unanswered';
        return 'answered';
    });

    return (
        <div className="w-full h-[500px] md:h-[400px] bg-[#09090b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-col md:flex-row p-4 md:p-6 gap-4 md:gap-6 font-sans select-none">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Left Panel - Progress */}
            <div className="w-full md:w-48 flex flex-row md:flex-col gap-3 md:gap-4 z-10 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1"
                >
                    <h3 className="text-white font-bold text-base">Làm bài tập</h3>
                    <p className="text-white/40 text-xs">Hoàn thành bài tập của bạn</p>
                </motion.div>

                {/* Timer Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass p-3 rounded-xl border-white/10 bg-white/5"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-white/50 text-xs">⏱️ Làm bài tập</span>
                        <span className="text-white font-bold text-sm">29:55</span>
                    </div>
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-white/40">Tiến độ bài làm</span>
                            <span className="text-white/60 font-bold">4%</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-red-500 to-pink-500"
                                initial={{ width: 0 }}
                                animate={{ width: '4%' }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Progress Grid - Hidden on mobile, shown on desktop */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="hidden md:block glass p-3 rounded-xl border-white/10 bg-white/5"
                >
                    <div className="text-xs text-white/50 mb-2 flex justify-between">
                        <span>Progress</span>
                        <span>0/25 (0%)</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                        {questionGrid.map((status, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 + i * 0.02 }}
                                whileHover={{ scale: 1.2, zIndex: 10 }}
                                className={`
                                    aspect-square rounded-md flex items-center justify-center text-[9px] font-bold cursor-pointer transition-all
                                    ${status === 'current' ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400 ring-2 ring-blue-500/30' :
                                        status === 'answered' ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' :
                                            'bg-white/5 border border-white/10 text-white/30'}
                                `}
                            >
                                {i + 1}
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Right Panel - Question */}
            <motion.div
                className="flex-1 glass rounded-2xl border-white/10 p-4 md:p-6 flex flex-col z-10 shadow-2xl overflow-hidden"
                initial={{ opacity: 0, x: 20, rotateY: -5 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.01, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
                style={{ perspective: '1000px' }}
            >
                {/* Question Header */}
                <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                        &quot;I ___ my keys. I can&apos;t open the door now.&quot; Chọn từ đúng:
                    </span>
                    <div className="px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold">
                        4 points
                    </div>
                </div>

                {/* Question Content */}
                <div className="flex-1 flex flex-col justify-center space-y-3">
                    {[
                        { id: 'A', text: 'lose', selected: false },
                        { id: 'B', text: 'lost', selected: false },
                        { id: 'C', text: 'have lost', selected: true },
                        { id: 'D', text: 'has lost', selected: false }
                    ].map((option, i) => (
                        <motion.div
                            key={option.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            whileHover={{ scale: 1.02, x: 4 }}
                            className={`
                                p-4 rounded-xl border text-sm transition-all cursor-pointer flex items-center gap-3
                                ${option.selected
                                    ? 'border-purple-500/50 bg-purple-500/10 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:border-white/20'}
                            `}
                        >
                            <div className={`
                                w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                ${option.selected ? 'border-purple-500 bg-purple-500' : 'border-white/30'}
                            `}>
                                {option.selected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-2 h-2 rounded-full bg-white"
                                    />
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white/80">Option {option.id}</span>
                                <span className="font-medium">{option.text}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                    <motion.button
                        whileHover={{ scale: 1.05, x: -2 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs font-medium hover:bg-white/10 transition-colors"
                    >
                        ← Trước
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05, x: 2 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-shadow"
                    >
                        Tiếp theo →
                    </motion.button>
                </div>
            </motion.div>
        </div>
    );
};

export default ExamVisual;
