'use client';

import React from 'react';
import { motion } from 'framer-motion';
import CalendarVisual from './visuals/CalendarVisual';
import ExamVisual from './visuals/ExamVisual';
import FinanceVisual from './visuals/FinanceVisual';
import DocsVisual from './visuals/DocsVisual';
import LiveTeachingVisual from './visuals/LiveTeachingVisual';

interface FeatureData {
    id: string;
    title: string;
    icon: string;
    painPoint: string;
    solution: string;
    color: string;
    visual: React.ReactNode;
}

const FeatureShowcase: React.FC = () => {
    // Dữ liệu Demo UI từ component LiveDemo cũ, được tinh chỉnh lại cho layout mới
    const features: FeatureData[] = [
        {
            id: 'live-teaching',
            title: 'Lớp học Tương tác',
            icon: '📽️',
            color: '#4a9eff',
            painPoint: 'Dạy qua Zoom/Meet rời rạc, không có bảng viết chuyên dụng và khó kiểm soát thời gian dạy để thu phí?',
            solution: 'Phòng học tích hợp Bảng trắng AI, Chat thời gian thực và hệ thống Tự động tính học phí chính xác đến từng giây.',
            visual: <LiveTeachingVisual />
        },
        {
            id: 'calendar',
            title: 'Lịch dạy Thông minh',
            icon: '📅',
            color: '#6366f1',
            painPoint: 'Bạn đau đầu vì lịch dạy chồng chéo, quên lịch hoặc phải nhắn tin nhắc từng học sinh?',
            solution: 'Hệ thống tự động phát hiện trùng lịch, gợi ý giờ rảnh tối ưu và tự động gửi nhắc nhở qua Zalo/Email trước buổi học.',
            visual: <CalendarVisual />
        },
        {
            id: 'exam',
            title: 'Khảo thí & Chấm điểm',
            icon: '📝',
            color: '#9d4edd',
            painPoint: 'Mất hàng giờ đồng hồ mỗi tuần để soạn đề, trộn đề và chấm bài thủ công?',
            solution: 'Ngân hàng đề thi thông minh với 50.000+ câu hỏi. Chấm điểm tự động và phân tích biểu đồ năng lực học sinh ngay lập tức.',
            visual: <ExamVisual />
        },
        {
            id: 'finance',
            title: 'Quản lý Tài chính',
            icon: '💰',
            color: '#06ffa5',
            painPoint: 'Ngại ngùng khi phải nhắc phụ huynh đóng học phí? Khó theo dõi ai đã đóng, ai chưa?',
            solution: 'Tự động gửi thông báo học phí tinh tế. Báo cáo doanh thu trực quan giúp bạn nắm bắt dòng tiền chỉ trong 1 cái liếc mắt.',
            visual: <FinanceVisual />
        },
        {
            id: 'docs',
            title: 'Kho tài liệu 3D',
            icon: '📁',
            color: '#ff0055',
            painPoint: 'Tài liệu lưu trữ rải rác trên Drive, Máy tính, USB... mỗi lần tìm lại rất mất thời gian?',
            solution: 'Lưu trữ tập trung, phân loại theo thẻ (tag) thông minh. Chia sẻ cho học sinh chỉ với 1 cú click.',
            visual: <DocsVisual />
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.8,
                ease: [0.23, 1, 0.32, 1] as [number, number, number, number]
            }
        }
    };

    return (
        <section id="features" className="py-32 px-6 bg-[#050714] relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-[20%] left-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[20%] right-0 w-[500px] h-[500px] bg-purple-600/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="max-w-7xl mx-auto">
                <motion.div
                    className="text-center mb-24"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-block px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-bold tracking-widest uppercase text-white/50 mb-4">
                        Feature Tour
                    </div>
                    <h2 className="text-3xl md:text-6xl font-black mb-6 leading-[1.2] md:leading-[1.15]">
                        Mọi công cụ bạn cần <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4a9eff] to-[#06ffa5]">Trong một nền tảng duy nhất</span>
                    </h2>
                </motion.div>

                <motion.div
                    className="relative"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    {/* Central Connecting Line */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent hidden md:block"></div>

                    <div className="flex flex-col gap-32">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.id}
                                className="relative flex flex-col md:flex-row items-center gap-10 md:gap-20 group"
                                variants={itemVariants}
                            >

                                {/* Connector Dot (Desktop) */}
                                <div
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#050714] z-20 hidden md:block transition-all duration-500 group-hover:scale-150"
                                    style={{ backgroundColor: feature.color, boxShadow: `0 0 20px ${feature.color}` }}
                                ></div>

                                {/* Left Side: UI Simulation */}
                                <div className={`w-full md:w-1/2 relative ${index % 2 === 0 ? 'md:order-1' : 'md:order-2'}`}>
                                    {/* Glowing Backlight behind visual */}
                                    <div
                                        className="absolute inset-0 blur-[60px] opacity-20 transition-opacity duration-700 group-hover:opacity-40"
                                        style={{ backgroundColor: feature.color }}
                                    ></div>

                                    <div className="relative transform transition-transform duration-700 group-hover:scale-[1.02] group-hover:-translate-y-2">
                                        {/* Window Controls Decoration */}
                                        <div className="absolute top-4 left-4 z-20 flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                                        </div>
                                        {feature.visual}
                                    </div>
                                </div>

                                {/* Right Side: Description */}
                                <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:order-2 md:pl-10' : 'md:order-1 md:pr-10 md:text-right'}`}>
                                    <div className={`flex items-center gap-3 mb-4 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                                        <div
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-premium border border-white/10 glass transition-transform group-hover:scale-110"
                                        >
                                            {feature.icon}
                                        </div>
                                        <h3 className="text-3xl font-black leading-tight">{feature.title}</h3>
                                    </div>

                                    <div className="space-y-4 md:space-y-6">
                                        <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl border border-red-500/10 bg-red-500/5 relative group/pain">
                                            <div className="text-[10px] font-bold uppercase tracking-widest text-red-500/50 mb-1 flex items-center gap-2">
                                                <span className="text-sm">😫</span> Vấn đề cũ
                                            </div>
                                            <p className="text-white/60 text-sm md:text-base leading-relaxed">{feature.painPoint}</p>
                                        </div>

                                        <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl border border-[#4a9eff]/20 bg-[#4a9eff]/5 relative overflow-hidden group/sol">
                                            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: feature.color }}></div>
                                            <div className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-2" style={{ color: feature.color }}>
                                                <span className="text-sm">✨</span> Giải pháp Tutor Pro
                                            </div>
                                            <p className="text-white text-base md:text-lg font-medium leading-[1.5] md:leading-[1.4]">{feature.solution}</p>
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default FeatureShowcase;
