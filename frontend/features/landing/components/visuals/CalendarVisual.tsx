'use client';

import React from 'react';
import { motion } from 'framer-motion';

const EVENTS = [
    { day: 1, name: 'NHẬT ANH', type: 'red' },
    { day: 2, name: 'HOÀNG MY', type: 'red' },
    { day: 2, name: 'BÀI TẬP', type: 'red' },
    { day: 3, name: 'HOÀNG MY', type: 'red' },
    { day: 3, name: 'BÀI TẬP', type: 'red' },
    { day: 3, name: 'HẢN BÌNH', type: 'red' },
    { day: 4, name: 'BÀI TẬP', type: 'green' },
    { day: 5, name: 'MINH PHƯƠNG', type: 'orange' },
    { day: 8, name: 'NHẬT ANH', type: 'orange' },
    { day: 10, name: 'HOÀNG MY', type: 'red' },
    { day: 11, name: 'BÀI TẬP', type: 'green' },
    { day: 12, name: 'MINH PHƯƠNG', type: 'orange' },
    { day: 13, name: 'NHẬT ANH', type: 'orange' },
    { day: 15, name: 'NHẬT ANH', type: 'orange' },
    { day: 17, name: 'HOÀNG MY', type: 'green' },
    { day: 18, name: 'BÀI TẬP', type: 'green' },
    { day: 19, name: 'MINH PHƯƠNG', type: 'orange' },
    { day: 20, name: 'NHẬT ANH', type: 'orange' },
    { day: 22, name: 'NHẬT ANH', type: 'red' },
    { day: 24, name: 'HOÀNG MY', type: 'blue' },
    { day: 24, name: 'BÀI TẬP', type: 'green' },
    { day: 24, name: 'HẢN BÌNH', type: 'green' },
    { day: 26, name: 'MINH PHƯƠNG', type: 'blue' },
    { day: 27, name: 'NHẬT ANH', type: 'orange' },
    { day: 28, name: 'NHẬT ANH', type: 'orange' },
    { day: 29, name: 'NHẬT ANH', type: 'orange' },
    { day: 31, name: 'HOÀNG MY', type: 'red' },
    { day: 31, name: 'BÀI TẬP', type: 'red' },
    { day: 31, name: 'HẢN BÌNH', type: 'red' },
];

/**
 * CalendarVisual Component
 * Enhanced 3D calendar visualization with realistic session data and animations
 */
const CalendarVisual: React.FC = () => {
    return (
        <motion.div
            className="w-full h-[320px] md:h-[400px] bg-[#09090b] rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-col p-3 md:p-4 font-sans select-none"
            style={{ perspective: '1000px' }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
        >
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <div className="flex justify-between items-center mb-4 z-10">
                <motion.div
                    className="flex items-center gap-2 md:gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h3 className="text-lg md:text-xl font-black text-white tracking-tight flex items-end gap-1.5 md:gap-2 leading-none">
                        Tháng 12 <span className="text-white/40 text-sm md:text-lg">2026</span>
                    </h3>
                </motion.div>

                <div className="flex items-center gap-1.5 md:gap-2 scale-75 md:scale-90 origin-right">
                    {[
                        { label: 'Tổng', value: '22', style: 'text-blue-400', bg: '#1e293b' },
                        { label: 'Xong', value: '14', style: 'text-green-400', bg: '#052e16' },
                        { label: 'Thu', value: '4.8M', style: 'text-orange-400', bg: '#2a1b06' }
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg border border-white/5 flex flex-col items-center min-w-[50px] md:min-w-[70px] backdrop-blur-sm shadow-lg`}
                            style={{ backgroundColor: stat.bg }}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * i, duration: 0.4 }}
                            whileHover={{ y: -2, scale: 1.05, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                        >
                            <span className={`text-[7px] md:text-[8px] font-bold uppercase ${stat.style}`}>{stat.label}</span>
                            <span className={`text-xs md:text-sm font-black leading-none ${stat.style}`}>{stat.value}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <motion.div
                className="flex-1 grid grid-cols-7 grid-rows-[auto_1fr_1fr_1fr_1fr_1fr] gap-[1px] bg-white/5 border border-white/10 rounded-lg overflow-hidden shadow-inner"
                initial={{ opacity: 0, rotateX: 10 }}
                animate={{ opacity: 1, rotateX: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                {/* Headers */}
                {['CN', 'HAI', 'BA', 'TU', 'NAM', 'SAU', 'BAY'].map((d, i) => (
                    <motion.div
                        key={d}
                        className="bg-[#09090b] py-2 text-center text-[8px] font-bold text-red-500/70 uppercase tracking-widest"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                    >
                        {d}
                    </motion.div>
                ))}

                {/* Days */}
                {Array.from({ length: 35 }).map((_, i) => {
                    const day = i + 1;
                    const dayEvents = EVENTS.filter(e => e.day === day);
                    const isVisible = day > 0 && day <= 31;
                    const isToday = day === 22;

                    return (
                        <motion.div
                            key={i}
                            className={`bg-[#09090b] p-1 relative flex flex-col gap-1 group/cell transition-all duration-200 ${isToday ? 'bg-white/10 ring-1 ring-blue-500/30' : ''}`}
                            whileHover={{
                                backgroundColor: 'rgba(255,255,255,0.08)',
                                scale: 1.05,
                                zIndex: 10,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}
                            transition={{ duration: 0.2 }}
                        >
                            <span className={`text-[9px] font-medium ml-1 mt-0.5 ${day === 24 ? 'text-blue-500' : isToday ? 'text-white' : 'text-white/20'}`}>
                                {isVisible ? day : ''}
                            </span>

                            <div className="flex flex-col gap-0.5 overflow-hidden">
                                {isVisible && dayEvents.map((event, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.4 + (i * 0.01) + (idx * 0.05) }}
                                        whileHover={{ scale: 1.1, x: 2 }}
                                        className={`px-1.5 py-0.5 rounded-[2px] border text-[6px] font-bold truncate flex items-center gap-1 cursor-pointer
                                            ${event.type === 'red' ? 'bg-[#2a0a0a] border-red-500/30 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]' :
                                                event.type === 'orange' ? 'bg-[#2a1505] border-orange-500/30 text-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.2)]' :
                                                    event.type === 'green' ? 'bg-[#052e16] border-emerald-500/30 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]' :
                                                        'bg-[#0a152a] border-blue-500/30 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.2)]'}
                                        `}
                                    >
                                        <div className={`w-1 h-1 rounded-full ${event.type === 'red' ? 'bg-red-500' :
                                            event.type === 'orange' ? 'bg-orange-500' :
                                                event.type === 'green' ? 'bg-emerald-500' :
                                                    'bg-blue-500'
                                            }`}></div>
                                        {event.name}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </motion.div>
        </motion.div>
    );
};

export default CalendarVisual;
