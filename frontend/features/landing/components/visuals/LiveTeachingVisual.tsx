'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * LiveTeachingVisual Component
 * A premium mockup UI representing the interactive Live Teaching module.
 * Showcases whiteboard, chat, recording, and real-time billing.
 */
const LiveTeachingVisual: React.FC = () => {
    return (
        <div className="w-full h-[300px] md:h-[400px] bg-slate-950 rounded-2xl border border-white/10 shadow-2xl overflow-hidden relative flex flex-col">
            {/* Header / Toolbar */}
            <div className="h-10 border-b border-white/10 bg-white/5 flex items-center px-4 justify-between z-10">
                <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                    <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="text-[9px] md:text-[10px] font-bold text-red-400 uppercase tracking-tighter">REC 00:45:12</span>
                    </div>
                    <div className="h-4 w-px bg-white/10 flex-shrink-0"></div>
                    <span className="text-[9px] md:text-[10px] text-white/60 font-medium truncate">Toán học 12</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-primary text-[10px] font-bold">
                        150.000đ / h
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main: Whiteboard Mockup */}
                <div className="flex-1 bg-slate-900/50 relative p-4 md:p-6">
                    <div className="absolute inset-0 grid grid-cols-8 md:grid-cols-12 grid-rows-8 md:grid-rows-12 opacity-10 pointer-events-none">
                        {Array.from({ length: 64 }).map((_, i) => (
                            <div key={i} className="border-[0.5px] border-white/20"></div>
                        ))}
                    </div>

                    {/* Mock Drawing */}
                    <svg className="w-full h-full relative z-10 opacity-80" viewBox="0 0 400 300">
                        <motion.path
                            d="M50,150 Q100,50 200,150 T350,150"
                            fill="none"
                            stroke="#4a9eff"
                            strokeWidth="3"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                        />
                        <circle cx="100" cy="50" r="4" fill="#ff0055" />
                        <text x="110" y="45" fill="white" fontSize="12" className="font-bold">Cực đại</text>
                        <circle cx="200" cy="150" r="4" fill="#06ffa5" />
                        <text x="210" y="145" fill="white" fontSize="12" className="font-bold">Điểm uốn</text>
                    </svg>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 glass p-1 md:p-1.5 rounded-xl border-white/10">
                        {[
                            { icon: '✏️', label: 'P' },
                            { icon: '📐', label: 'R' },
                            { icon: '🧹', label: 'C' }
                        ].map((tool, i) => (
                            <div key={i} className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-lg text-[8px] md:text-sm ${i === 0 ? 'bg-primary text-white' : 'hover:bg-white/5 font-bold'}`}>
                                {tool.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar: Chat Mockup - Hidden on mobile */}
                <div className="hidden md:flex w-1/3 border-l border-white/10 bg-black/40 flex-col">
                    <div className="p-3 border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        Trò chuyện (2)
                    </div>
                    <div className="flex-1 p-3 space-y-3 overflow-hidden">
                        <div className="space-y-1">
                            <div className="text-[9px] font-bold text-primary">GIA SƯ</div>
                            <div className="text-[10px] bg-primary/10 border border-primary/20 p-2 rounded-lg rounded-tl-none">
                                Em đã hiểu cách tính đạo hàm tại điểm uốn chưa?
                            </div>
                        </div>
                        <div className="space-y-1 text-right">
                            <div className="text-[9px] font-bold text-green-400">HỌC SINH</div>
                            <div className="text-[10px] bg-white/5 border border-white/10 p-2 rounded-lg rounded-tr-none inline-block">
                                Em hiểu rồi ạ! Rất trực quan.
                            </div>
                        </div>
                    </div>
                    <div className="p-2 border-t border-white/10">
                        <div className="bg-white/5 rounded-full px-3 py-1.5 text-[10px] text-white/30 italic">
                            Nhập tin nhắn...
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom: Real-time Billing Tracker */}
            <div className="bg-primary/90 text-white px-3 md:px-4 py-1.5 md:py-2 flex justify-between items-center z-20">
                <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest hidden sm:inline">BILLABLE TIME</span>
                    <span className="font-mono font-bold text-xs md:text-sm">00:45:12</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest hidden sm:inline">ACCUMULATED</span>
                    <span className="font-mono font-bold text-xs md:text-sm">113.000đ</span>
                </div>
            </div>
        </div>
    );
};

export default LiveTeachingVisual;
