'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface FeatureData {
    id: string;
    title: string;
    description: string;
    color: string;
    screenshot: string;
    screenshotAlt: string;
    metrics: string[];
}

const FeatureShowcase: React.FC = () => {
    const features: FeatureData[] = [
        {
            id: 'live-teaching',
            title: 'Live Teaching',
            color: '#4a9eff',
            description: 'Tổ chức lớp học trực tuyến ngay trong Tutor Pro với đầy đủ công cụ tương tác.',
            screenshot: '/screenshots/live-teaching.png',
            screenshotAlt: 'Giao diện phòng học trực tuyến',
            metrics: ['Độ trễ tải giao diện < 800ms', 'Giảm việc chuyển đổi qua lại giữa các nền tảng']
        },
        {
            id: 'calendar',
            title: 'Calendar',
            color: '#6366f1',
            description: 'Xem và quản lý lịch dạy theo ngày/tuần để tránh trùng lịch và sót buổi học.',
            screenshot: '/screenshots/calendar-view.png',
            screenshotAlt: 'Giao diện lịch dạy',
            metrics: ['Theo dõi lịch dạy trong một màn hình', 'Phát hiện xung đột lịch để xử lý sớm']
        },
        {
            id: 'lesson-lobby',
            title: 'Lesson Lobby',
            color: '#f59e0b',
            description: 'Quản lý bài giảng theo lộ trình, gồm nội dung và tài nguyên để dạy học liền mạch.',
            screenshot: '/screenshots/lesson-lobby-view.png',
            screenshotAlt: 'Giao diện bài giảng Lesson Lobby',
            metrics: ['Sắp xếp bài giảng theo chapter/buổi học', 'Truy cập nhanh nội dung cần dạy trong một màn hình']
        },
        {
            id: 'assessment',
            title: 'Assessment',
            color: '#9d4edd',
            description: 'Tổng hợp kết quả học tập để đánh giá tiến độ và điều chỉnh lộ trình học phù hợp.',
            screenshot: '/screenshots/assessment-view.png',
            screenshotAlt: 'Giao diện khảo thí và đánh giá',
            metrics: ['Cập nhật kết quả học tập nhanh cho từng học sinh', 'Hỗ trợ đánh giá theo buổi học và theo giai đoạn']
        },
        {
            id: 'finance',
            title: 'Finance',
            color: '#06ffa5',
            description: 'Theo dõi học phí đã thu/chưa thu và doanh thu để quản lý dòng tiền minh bạch.',
            screenshot: '/screenshots/finance-view.png',
            screenshotAlt: 'Giao diện quản lý tài chính',
            metrics: ['Theo dõi công nợ theo từng học sinh', 'Tổng hợp doanh thu theo chu kỳ dạy học']
        },
        {
            id: 'storage',
            title: 'Storage',
            color: '#ff0055',
            description: 'Lưu trữ tài nguyên học tập tập trung để tìm lại và chia sẻ tài liệu nhanh hơn.',
            screenshot: '/screenshots/storage-view.png',
            screenshotAlt: 'Giao diện tổng quan lưu trữ và quản lý',
            metrics: ['Tập trung dữ liệu trên một hệ thống duy nhất', 'Giảm thất lạc tài liệu trong quá trình dạy học']
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
        <section id="features" className="relative overflow-hidden px-6 py-28 md:py-32">

            {/* Background Decor */}
            <div className="pointer-events-none absolute left-0 top-[20%] h-[500px] w-[500px] rounded-full bg-sky-200/35 blur-[120px]"></div>
            <div className="pointer-events-none absolute bottom-[20%] right-0 h-[500px] w-[500px] rounded-full bg-indigo-200/25 blur-[120px]"></div>

            <div className="max-w-7xl mx-auto">
                <motion.div
                    className="text-center mb-24"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="mb-4 inline-block rounded-full border border-slate-200 bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-500 shadow-sm">
                        Feature Tour
                    </div>
                    <h2 className="mb-6 text-3xl font-black leading-[1.2] text-slate-900 md:text-6xl md:leading-[1.15]">
                        Mọi công cụ bạn cần <br />
                        <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">Trong một nền tảng duy nhất</span>
                    </h2>
                </motion.div>

                <motion.div
                    className="relative"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    <div className="flex flex-col gap-16 md:gap-20">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.id}
                                className="relative grid cursor-pointer grid-cols-1 gap-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_56px_rgba(14,116,144,0.16)] md:grid-cols-2 md:gap-10 md:p-8"
                                variants={itemVariants}
                            >
                                <div className={`${index % 2 === 0 ? 'md:order-1' : 'md:order-2'} relative`}>
                                    <div
                                        className="absolute inset-0 opacity-35 blur-[60px]"
                                        style={{ backgroundColor: feature.color }}
                                    ></div>
                                    <div className="relative aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
                                        <Image
                                            src={feature.screenshot}
                                            alt={feature.screenshotAlt}
                                            width={1400}
                                            height={840}
                                            className="h-full w-full object-cover object-top"
                                        />
                                    </div>
                                </div>

                                <div className={`${index % 2 === 0 ? 'md:order-2' : 'md:order-1'} flex flex-col justify-center`}>
                                    <div className="mb-4 flex items-center gap-3">
                                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: feature.color }}></span>
                                        <h3 className="text-3xl font-black leading-tight text-slate-900">{feature.title}</h3>
                                    </div>
                                    <p className="mb-5 text-slate-600 md:text-lg">{feature.description}</p>
                                    <ul className="space-y-2 text-sm text-slate-700 md:text-base">
                                        {feature.metrics.map((metric) => (
                                            <li key={metric} className="flex items-start gap-2">
                                                <span className="mt-1 text-emerald-500">✓</span>
                                                <span>{metric}</span>
                                            </li>
                                        ))}
                                    </ul>
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
