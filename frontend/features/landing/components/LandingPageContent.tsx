'use client';

import { useRouter } from 'next/navigation';
import Hero from './Hero';
import dynamic from 'next/dynamic';

import Footer from './Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, GraduationCap } from 'lucide-react';
import { useState } from 'react';

const FeatureShowcase = dynamic(() => import('./FeatureShowcase'), {
    ssr: true,
});

const LandingPageContent: React.FC = () => {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-primary/30 overflow-x-hidden">
            <nav className="fixed top-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none">
                <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">
                    {/* Logo */}
                    <motion.div
                        className="flex items-center gap-2 group cursor-pointer"
                        whileHover={{ scale: 1.05 }}
                        onClick={() => router.push('/')}
                    >
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 group-hover:border-primary/40 transition-all shadow-glow-sm">
                            <GraduationCap className="w-6 h-6 text-primary" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white/90">
                            Tutor Pro
                        </span>
                    </motion.div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-2 glass p-1.5 rounded-2xl border-white/10 shadow-premium">
                        {['Tính năng', 'Giải pháp', 'Bảng giá', 'Tài liệu'].map((item) => (
                            <button
                                key={item}
                                className="px-5 py-2 text-sm font-bold text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-3">
                            <button
                                onClick={() => router.push('/login')}
                                className="px-8 py-2.5 bg-primary text-white text-sm font-black rounded-xl hover:scale-105 transition-all shadow-glow shadow-primary/20 pointer-events-auto"
                            >
                                Bắt đầu ngay
                            </button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden w-10 h-10 flex items-center justify-center glass rounded-xl border-white/10 text-white"
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
                            <div className="glass p-6 rounded-3xl border-white/10 shadow-glow flex flex-col gap-4">
                                {['Tính năng', 'Giải pháp', 'Bảng giá', 'Tài liệu'].map((item) => (
                                    <button
                                        key={item}
                                        className="w-full py-4 text-left text-lg font-bold text-white/80 border-b border-white/5 last:border-0"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {item}
                                    </button>
                                ))}
                                <div className="flex flex-col gap-3 mt-4">
                                    <button
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            router.push('/login');
                                        }}
                                        className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-glow"
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

                {/* Unified Feature Showcase Section */}
                <FeatureShowcase />

                {/* Testimonials Simulation */}
                <section className="py-24 px-6 bg-[#0a101f]">
                    <div className="max-w-7xl mx-auto text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Được tin dùng bởi <span className="text-[#4a9eff]">500+ Gia sư</span></h2>
                        <div className="flex flex-wrap justify-center gap-12 mt-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
                            <span className="text-2xl font-bold">VNU UNIVERSITY</span>
                            <span className="text-2xl font-bold">USTH EDU</span>
                            <span className="text-2xl font-bold">FTU GLOBAL</span>
                            <span className="text-2xl font-bold">NEU SMART</span>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 md:py-32 px-4 relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>

                    <div className="max-w-5xl mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="glass p-8 md:p-20 rounded-[40px] border-white/10 shadow-glow overflow-hidden relative"
                        >
                            {/* Decorative noise */}
                            <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none"></div>

                            <h2 className="text-4xl md:text-7xl font-black mb-6 md:mb-10 leading-[1.1] md:leading-tight">
                                Sẵn sàng nâng tầm <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#06ffa5]">Sự nghiệp gia sư?</span>
                            </h2>

                            <p className="text-white/50 text-base md:text-xl mb-8 md:mb-12 max-w-2xl mx-auto font-medium">
                                Gia nhập cộng đồng 10.000+ gia sư hiện đại đang sử dụng Tutor Pro để tối ưu hóa việc dạy và tăng thu nhập.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
                                <button className="w-full sm:w-auto px-10 md:px-12 py-5 md:py-6 bg-primary text-white text-lg md:text-xl font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-glow-lg">
                                    BẮT ĐẦU MIỄN PHÍ
                                </button>
                                <button className="w-full sm:w-auto px-10 md:px-12 py-5 md:py-6 glass border-white/20 text-white text-lg md:text-xl font-bold rounded-2xl hover:bg-white/10 transition-all backdrop-blur-md">
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
