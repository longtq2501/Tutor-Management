'use client';

import React from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = [
    { name: 'Ngữ pháp', count: '31 tài liệu', icon: '📚', gradient: 'from-purple-500 to-purple-700', shadow: 'shadow-purple-500/30' },
    { name: 'Từ vựng', count: '3 tài liệu', icon: '📗', gradient: 'from-green-500 to-green-700', shadow: 'shadow-green-500/30' },
    { name: 'Đề thi', count: '4 tài liệu', icon: '📙', gradient: 'from-orange-500 to-orange-700', shadow: 'shadow-orange-500/30' },
    { name: 'IELTS', count: '1 tài liệu', icon: '💜', gradient: 'from-pink-500 to-pink-700', shadow: 'shadow-pink-500/30' },
];

/**
 * DocsVisual Component
 * Enhanced document library interface with category-based organization
 */
const DocsVisual: React.FC = () => {
    return (
        <div className="w-full h-[350px] md:h-[400px] bg-[#09090b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-col p-4 md:p-6 font-sans select-none">
            {/* Isometric Grid Background */}
            <div
                className="absolute inset-0 opacity-[0.02] pointer-events-none"
                style={{
                    backgroundImage: 'linear-gradient(30deg, #fff 12%, transparent 12.5%, transparent 87%, #fff 87.5%, #fff), linear-gradient(150deg, #fff 12%, transparent 12.5%, transparent 87%, #fff 87.5%, #fff), linear-gradient(30deg, #fff 12%, transparent 12.5%, transparent 87%, #fff 87.5%, #fff), linear-gradient(150deg, #fff 12%, transparent 12.5%, transparent 87%, #fff 87.5%, #fff), linear-gradient(60deg, #fff 25%, transparent 25.5%, transparent 75%, #fff 75%, #fff), linear-gradient(60deg, #fff 25%, transparent 25.5%, transparent 75%, #fff 75%, #fff)',
                    backgroundSize: '40px 70px',
                    transform: 'scale(2)'
                }}
            ></div>

            {/* Ambient Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 z-10"
            >
                <h3 className="text-white font-black text-lg mb-1">Kho Tài Liệu Tiếng Anh</h3>
                <p className="text-white/40 text-xs">Quản lý tài liệu theo danh mục để dễ tìm sau này</p>
            </motion.div>

            {/* Stats and Search */}
            <div className="flex flex-col md:flex-row gap-3 mb-4 z-10">
                {/* Search Bar */}
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex-1 glass rounded-xl border-white/10 bg-white/5 px-4 py-2 flex items-center gap-2"
                >
                    <span className="text-white/40 text-sm">🔍</span>
                    <input
                        type="text"
                        placeholder="Tìm kiếm tài liệu..."
                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                        readOnly
                    />
                </motion.div>

                {/* Stat Cards - Hidden on mobile */}
                <div className="hidden md:flex gap-3">
                    {[
                        { label: 'Tổng tài liệu', value: '43', icon: '📄', style: 'text-blue-400', labelStyle: 'text-blue-400/70', bg: 'bg-gradient-to-br from-blue-500/10 to-blue-600/5' },
                        { label: 'Lượt tải xuống', value: '32', icon: '⬇️', style: 'text-green-400', labelStyle: 'text-green-400/70', bg: 'bg-gradient-to-br from-green-500/10 to-green-600/5' },
                        { label: 'Dung lượng', value: '5.63 MB', icon: '💾', style: 'text-purple-400', labelStyle: 'text-purple-400/70', bg: 'bg-gradient-to-br from-purple-500/10 to-purple-600/5' }
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * (i + 1) }}
                            whileHover={{ y: -2, scale: 1.05 }}
                            className={`glass px-4 py-2 rounded-xl border-white/10 ${stat.bg} flex flex-col items-center min-w-[90px]`}
                        >
                            <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-sm">{stat.icon}</span>
                                <span className={`text-[8px] uppercase tracking-wider font-bold ${stat.labelStyle}`}>{stat.label}</span>
                            </div>
                            <div className={`text-base font-black ${stat.style}`}>{stat.value}</div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Category Grid */}
            <div className="flex-1 grid grid-cols-2 gap-3 z-10 overflow-hidden">
                {CATEGORIES.map((category, i) => (
                    <motion.div
                        key={category.name}
                        initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
                        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                        transition={{ delay: 0.3 + i * 0.08, duration: 0.4 }}
                        whileHover={{
                            scale: 1.05,
                            y: -8,
                            rotateX: -5,
                            rotateY: 5,
                            boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                        }}
                        className={`glass rounded-2xl border-white/10 p-4 cursor-pointer transition-all bg-gradient-to-br ${category.gradient} ${category.shadow} shadow-lg relative overflow-hidden group`}
                        style={{ perspective: '1000px' }}
                    >
                        {/* Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                        {/* Content */}
                        <div className="relative z-10 flex items-center gap-3">
                            <motion.div
                                whileHover={{ rotate: 12, scale: 1.2 }}
                                className="text-4xl"
                            >
                                {category.icon}
                            </motion.div>
                            <div className="flex-1">
                                <div className="text-white font-bold text-base mb-0.5">{category.name}</div>
                                <div className="text-white/60 text-xs">{category.count}</div>
                            </div>
                            <motion.div
                                whileHover={{ x: 2 }}
                                className="text-white/40 text-xl"
                            >
                                →
                            </motion.div>
                        </div>

                        {/* Badge */}
                        {parseInt(category.count) > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5 + i * 0.08 }}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-[10px] font-bold"
                            >
                                {parseInt(category.count)}
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Add Button */}
            <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="mt-4 w-full glass rounded-xl border-white/10 bg-white/5 py-3 text-white/60 text-sm font-medium hover:bg-white/10 transition-colors flex items-center justify-center gap-2 z-10"
            >
                <span className="text-lg">+</span>
                Thêm danh mục mới
            </motion.button>
        </div>
    );
};

export default DocsVisual;
