'use client';

import { useRouter } from 'next/navigation';
import Hero from './Hero';
import dynamic from 'next/dynamic';

import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, GraduationCap, ShieldCheck, Clock3, BadgeCheck } from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { label: 'Tính năng', href: '/features' },
    { label: 'Bảng giá', href: '/pricing' },
];

const highlightItems = [
    {
        title: 'Lập lịch nhanh',
        value: '< 800ms',
        desc: 'Tạo lịch hàng loạt cho nhiều học sinh trong một thao tác.',
    },
    {
        title: 'Thông báo thời gian thực',
        value: '< 500ms',
        desc: 'Cập nhật lịch học, bài tập và trạng thái học phí ngay trên giao diện.',
    },
    {
        title: 'AI Feedback',
        value: '< 300ms',
        desc: 'Gợi ý nhận xét buổi học theo ngữ cảnh bằng tiếng Việt tự nhiên.',
    },
    {
        title: 'Lớp học trực tuyến',
        value: '< 200ms',
        desc: 'Tương tác gần như realtime với whiteboard và room đồng bộ.',
    },
];

const trustItems = [
    { name: 'SSE Realtime', icon: Clock3, text: 'Cập nhật sự kiện gần như ngay lập tức' },
    { name: 'VietQR Invoice', icon: ShieldCheck, text: 'Đối soát học phí tự động, minh bạch' },
    { name: 'WebRTC Live Room', icon: BadgeCheck, text: 'Lớp học trực tuyến độ trễ thấp, ổn định' },
];

const FeatureShowcase = dynamic(() => import('./FeatureShowcase'), {
    ssr: true,
});

const LandingPageContent: React.FC = () => {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 selection:bg-sky-200/70">
            <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
                <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center gap-2 group cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        onClick={() => router.push('/')}
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-200 bg-white/85 shadow-sm transition-all group-hover:border-sky-400">
                            <GraduationCap className="w-5 h-5 text-sky-700" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-slate-900">
                            Tutor Pro
                        </span>
                    </motion.div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-1.5 shadow-[0_10px_30px_rgba(14,116,144,0.08)] backdrop-blur">
                        {navItems.map((item) => (
                            <button
                                key={item.label}
                                className="cursor-pointer rounded-xl px-5 py-2 text-sm font-bold text-slate-600 transition-all duration-200 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
                                onClick={() => router.push(item.href)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-3">
                            <button
                                onClick={() => router.push('/register')}
                                className="pointer-events-auto cursor-pointer rounded-xl bg-sky-500 px-8 py-2.5 text-sm font-black text-white shadow-[0_12px_26px_rgba(14,165,233,0.3)] transition-all duration-200 hover:bg-sky-600"
                            >
                                Bắt đầu ngay
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-700 shadow-sm"
                        >
                            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-20 left-4 right-4 md:hidden pointer-events-auto"
                        >
                            <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
                                {navItems.map((item) => (
                                    <button
                                        key={item.label}
                                        className="w-full cursor-pointer border-b border-slate-100 py-4 text-left text-lg font-bold text-slate-700 last:border-0"
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push(item.href);
                                        }}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                                <div className="flex flex-col gap-3 mt-4">
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push('/register');
                                        }}
                                        className="w-full cursor-pointer rounded-2xl bg-sky-500 py-4 font-black text-white shadow-[0_10px_24px_rgba(14,165,233,0.28)]"
                                    >
                                        Bắt đầu ngay
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <main>
                <Hero />

                <section className="px-6 pb-20">
                    <div className="mx-auto max-w-7xl">
                        <div className="mb-8 flex items-end justify-between gap-4">
                            <div>
                                <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-700">Điểm nổi bật</p>
                                <h2 className="text-3xl font-black text-slate-900 md:text-4xl">Hiệu năng & trải nghiệm thực chiến</h2>
                            </div>
                            <button
                                onClick={() => router.push('/features')}
                                className="hidden cursor-pointer rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 md:inline-flex"
                            >
                                Xem chi tiết tính năng
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {highlightItems.map((item) => (
                                <motion.article
                                    key={item.title}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_14px_35px_rgba(15,23,42,0.07)]"
                                >
                                    <p className="text-sm font-bold text-slate-500">{item.title}</p>
                                    <p className="mt-2 text-3xl font-black text-sky-600">{item.value}</p>
                                    <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.desc}</p>
                                </motion.article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Unified Feature Showcase Section */}
                <FeatureShowcase />

                <section className="px-6 pb-20">
                    <div className="mx-auto max-w-7xl">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {trustItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <article
                                        key={item.name}
                                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)]"
                                    >
                                        <div className="mb-3 flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                                                <Icon size={18} />
                                            </div>
                                            <p className="font-black text-slate-900">{item.name}</p>
                                        </div>
                                        <p className="text-sm text-slate-600">{item.text}</p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Testimonials Simulation */}
                <section className="bg-white px-6 py-24">
                    <div className="max-w-7xl mx-auto text-center mb-16">
                        <h2 className="mb-6 text-4xl font-black text-slate-900 md:text-5xl">Phản hồi từ người dùng thật</h2>
                        <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-left shadow-[0_22px_50px_rgba(15,23,42,0.08)]">
                            <div className="mb-5 flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-lg font-black text-sky-700">
                                    QL
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">Thầy Quỳnh Long</p>
                                    <p className="text-sm text-slate-500">Gia sư Tiếng Anh</p>
                                </div>
                            </div>
                            <p className="text-lg leading-relaxed text-slate-700">
                                "Tutor Pro giúp tôi tiết kiệm 5-10 giờ mỗi tuần cho việc quản lý lịch dạy và thu phí, để tập trung hơn vào chất lượng buổi học."
                            </p>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#ecfeff_100%)] px-4 py-20 md:py-32">
                    <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/35 blur-[110px] md:h-[760px] md:w-[760px]"></div>

                    <div className="max-w-5xl mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="relative overflow-hidden rounded-[40px] border border-slate-200 bg-white p-8 shadow-[0_28px_70px_rgba(15,23,42,0.12)] md:p-20"
                        >
                            {/* Decorative noise */}
                            <div className="pointer-events-none absolute inset-0 opacity-[0.03] bg-noise"></div>

                            <h2 className="mb-6 text-4xl font-black leading-[1.1] text-slate-900 md:mb-10 md:text-7xl md:leading-tight">
                                Sẵn sàng nâng tầm <br />
                                <span className="bg-gradient-to-r from-sky-600 to-cyan-500 bg-clip-text text-transparent">Sự nghiệp gia sư?</span>
                            </h2>

                            <p className="mx-auto mb-8 max-w-2xl text-base font-medium text-slate-600 md:mb-12 md:text-xl">
                                Dành cho gia sư 1-1 muốn quản lý lịch dạy, tài chính và lớp học trực tuyến trên một nền tảng duy nhất.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
                                <button
                                    onClick={() => router.push('/register')}
                                    className="w-full cursor-pointer rounded-2xl bg-sky-500 px-10 py-5 text-lg font-black text-white shadow-[0_20px_40px_rgba(14,165,233,0.32)] transition-all duration-200 hover:bg-sky-600 active:scale-95 sm:w-auto md:px-12 md:py-6 md:text-xl"
                                >
                                    BẮT ĐẦU MIỄN PHÍ
                                </button>
                                <button
                                    onClick={() => router.push('/pricing')}
                                    className="w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-10 py-5 text-lg font-bold text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 sm:w-auto md:px-12 md:py-6 md:text-xl"
                                >
                                    XEM BẢNG GIÁ
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default LandingPageContent;
