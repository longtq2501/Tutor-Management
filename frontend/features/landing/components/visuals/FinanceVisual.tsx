'use client';

import React from 'react';
import { motion } from 'framer-motion';

const STUDENTS = [
    { name: 'BẢO HÂN', grade: '8 buổi', sessions: '2 giờ', progress: 75, amount: '1.800.000 đ', remaining: '320.000 đ' },
    { name: 'HẢN BÌNH', grade: '8 buổi', sessions: '2 giờ', progress: 68, amount: '1.200.000 đ', remaining: '480.000 đ' },
    { name: 'HOÀNG MY', grade: '8 buổi', sessions: '16 giờ', progress: 82, amount: '1.232.000 đ', remaining: '72.000 đ' },
    { name: 'MINH PHƯƠNG', grade: '8 buổi', sessions: '2 giờ', progress: 45, amount: '616.000 đ', remaining: '72.000 đ' },
    { name: 'NHẬT ANH', grade: '8 buổi', sessions: '16 giờ', progress: 90, amount: '1.232.000 đ', remaining: '72.000 đ' },
];

/**
 * FinanceVisual Component
 * Enhanced financial management interface with student payment tracking
 */
const FinanceVisual: React.FC = () => {
    return (
        <div className="w-full h-[450px] md:h-[400px] bg-[#09090b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-col p-4 md:p-6 font-sans select-none">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/5 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
            >
                <h3 className="text-white font-black text-lg mb-1">Quản Lý Tài Chính</h3>
                <p className="text-white/40 text-xs">Theo dõi doanh thu, công nợ và trạng thái thanh toán</p>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 z-10">
                {[
                    { label: 'Tổng Doanh Thu / Nợ', value: '6.080.000 đ', icon: '💰', style: 'text-emerald-400', labelStyle: 'text-emerald-400/70', bg: 'from-emerald-500/20 to-emerald-600/10' },
                    { label: 'Tổng số Buổi', value: '32', subtext: 'tất cả học sinh', icon: '📊', style: 'text-blue-400', labelStyle: 'text-blue-400/70', bg: 'from-blue-500/20 to-blue-600/10' },
                    { label: 'Học Sinh', value: '5', subtext: 'đã hoàn thành', icon: '👥', style: 'text-purple-400', labelStyle: 'text-purple-400/70', bg: 'from-purple-500/20 to-purple-600/10' },
                    { label: 'Trạng Thái', value: 'Cần Xử Lý', icon: '⚠️', style: 'text-orange-400', labelStyle: 'text-orange-400/70', bg: 'from-orange-500/20 to-orange-600/10' }
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: -10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.1 * i, duration: 0.3 }}
                        whileHover={{ y: -4, scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                        className={`glass p-2 md:p-3 rounded-xl border-white/10 bg-gradient-to-br ${stat.bg} backdrop-blur-sm`}
                    >
                        <div className="flex items-center gap-1.5 md:gap-2 mb-0.5 md:mb-1">
                            <span className="text-base md:text-lg">{stat.icon}</span>
                            <span className={`text-[8px] md:text-[9px] uppercase tracking-wider font-bold ${stat.labelStyle}`}>{stat.label}</span>
                        </div>
                        <div className={`text-sm md:text-base font-black ${stat.style}`}>{stat.value}</div>
                        {stat.subtext && <div className="text-[7px] md:text-[8px] text-white/30 md:mt-0.5">{stat.subtext}</div>}
                    </motion.div>
                ))}
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-hidden">
                <div className="space-y-2">
                    {STUDENTS.map((student, i) => (
                        <motion.div
                            key={student.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 + i * 0.08 }}
                            whileHover={{
                                scale: 1.02,
                                x: 4,
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                boxShadow: '0 4px 20px rgba(236,72,153,0.2)'
                            }}
                            className="glass p-3 rounded-xl border-white/5 bg-white/[0.02] cursor-pointer transition-all group"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-white font-bold text-sm">{student.name}</div>
                                        <div className="text-white/40 text-[10px]">{student.grade} • {student.sessions}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-pink-400 font-black text-sm">{student.amount}</div>
                                    <div className="text-white/30 text-[9px]">{student.remaining} đã đóng</div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="relative">
                                <div className="flex justify-between text-[9px] mb-1">
                                    <span className="text-white/40">Tiến độ thanh toán</span>
                                    <span className="text-pink-400 font-bold">{student.progress}% đã nộp TT</span>
                                </div>
                                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${student.progress}%` }}
                                        transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FinanceVisual;
