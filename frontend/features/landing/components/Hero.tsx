import React from 'react';
import { useRouter } from 'next/navigation';
import HeroDashboardPreview from './visuals/HeroDashboardPreview';

/**
 * Hero Component
 * The main landing section featuring the dashboard preview.
 * 
 * @returns {JSX.Element} The Hero section
 */
const Hero: React.FC = () => {
    const router = useRouter();
    return (
        <section className="relative w-full min-h-[100svh] overflow-hidden bg-transparent">
            {/* Background Ambience & Spotlight */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute left-1/2 top-[-30%] h-[78%] w-full -translate-x-1/2 rounded-full bg-gradient-to-b from-sky-200/80 via-sky-100/30 to-transparent blur-[100px]"></div>

                <div className="absolute left-[-8%] top-1/4 h-[36%] w-[36%] animate-float rounded-full bg-cyan-200/45 blur-[120px]"></div>
                <div className="absolute bottom-[12%] right-[-10%] h-[34%] w-[34%] animate-float rounded-full bg-indigo-200/35 blur-[130px] [animation-delay:2s]"></div>

                {/* Noise Overlay */}
                <div className="absolute inset-0 bg-noise opacity-[0.02]"></div>
            </div>

            <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-14 pt-24 text-center pointer-events-none sm:px-6 sm:pt-28 md:pb-16 md:pt-24">

                {/* Badge */}
                <div className="mb-8 inline-flex cursor-default items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm pointer-events-auto backdrop-blur sm:mb-10 sm:px-5 sm:py-2.5 sm:text-sm">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.45)]"></span>
                    Nền tảng quản lý gia sư 1-1 đang phát triển
                </div>

                {/* Headline */}
                <h1 className="mb-5 select-none text-4xl font-black leading-[0.98] tracking-tighter text-slate-900 xs:text-5xl sm:mb-6 sm:text-7xl sm:leading-[0.95] md:mb-8 md:text-8xl lg:text-9xl">
                    <span className="block">TUTOR</span>
                    <span className="block bg-gradient-to-r from-sky-600 via-cyan-500 to-indigo-500 bg-clip-text pb-4 text-transparent animate-gradient-x">
                        PRO
                    </span>
                </h1>

                {/* Description */}
                <p className="mb-10 max-w-3xl text-base font-medium leading-relaxed text-slate-600 pointer-events-auto sm:mb-12 sm:text-lg md:text-2xl">
                    Giải pháp toàn diện giúp gia sư 1-1 <span className="font-semibold text-slate-900">quản lý chuyên nghiệp</span>,
                    giảm rủi ro <span className="font-semibold text-emerald-600">quên thu phí</span> và
                    <span className="font-semibold text-indigo-600"> tiết kiệm thời gian vận hành</span> mỗi tuần.
                </p>

                {/* Buttons */}
                <div className="mb-10 flex w-full flex-col items-center justify-center gap-3 pointer-events-auto sm:mb-12 sm:flex-row sm:gap-4 md:mb-16">
                    <button
                        onClick={() => router.push('/register')}
                        className="flex w-full cursor-pointer items-center justify-center rounded-2xl bg-sky-500 px-8 py-4 text-base font-black tracking-widest text-white shadow-[0_16px_36px_rgba(14,165,233,0.35)] transition-all duration-200 hover:bg-sky-600 active:scale-95 sm:w-auto sm:px-12 sm:py-5 sm:text-lg md:text-xl"
                    >
                        BẮT ĐẦU NGAY
                    </button>
                    <button
                        onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full cursor-pointer rounded-2xl border border-slate-300 bg-white px-8 py-4 text-base font-bold text-slate-700 transition-all duration-200 hover:border-slate-400 hover:bg-slate-50 sm:w-auto sm:px-12 sm:py-5 sm:text-lg md:text-xl"
                    >
                        KHÁM PHÁ
                    </button>
                </div>

                <HeroDashboardPreview />

                {/* Scroll Indicator */}
                <div
                    className="mt-8 hidden cursor-pointer flex-col items-center gap-2 animate-pulse pointer-events-auto md:flex"
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Cuộn để khám phá</span>
                    <div className="h-12 w-px bg-gradient-to-b from-slate-400 to-transparent"></div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
