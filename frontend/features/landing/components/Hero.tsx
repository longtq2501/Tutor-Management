import React from 'react';
import { useRouter } from 'next/navigation';
import SplineVisual from './visuals/SplineVisual';

/**
 * Hero Component
 * The main landing section featuring a smooth 3D background visual.
 * 
 * @returns {JSX.Element} The Hero section
 */
const Hero: React.FC = () => {
    const router = useRouter();
    return (
        <div className="relative w-full min-h-screen overflow-hidden flex flex-col items-center justify-center bg-[#050714]">
            {/* Background Ambience & Spotlight */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                {/* Central Top Spotlight */}
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-full h-[80%] bg-gradient-to-b from-primary/20 via-transparent to-transparent blur-[120px] rounded-full"></div>

                {/* Floating Side Blurs */}
                <div className="absolute top-1/4 left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[150px] rounded-full animate-float"></div>
                <div className="absolute bottom-1/4 right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[150px] rounded-full animate-float [animation-delay:2s]"></div>

                {/* Noise Overlay */}
                <div className="absolute inset-0 bg-noise opacity-[0.03] mix-blend-overlay"></div>
            </div>

            {/* 
        3D Model Layer - Absolute Center a
        - Z-index: 0 (Behind text)
        - Managed by SplineVisual with placeholder support
      */}
            <div className="absolute inset-0 z-0 flex items-center justify-center">
                <SplineVisual />
            </div>

            {/* 
        Content Layer - Centered & Overlay
        - Z-index: 10 (On top of 3D)
        - pointer-events-none on container: Allows mouse to pass through empty space to hover 3D model
        - pointer-events-auto on buttons/text: Re-enables interaction for specific elements
      */}
            <div className="relative z-10 w-full max-w-5xl mx-auto px-6 flex flex-col items-center text-center pointer-events-none mt-[-5vh]">

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-premium bg-white/5 text-sm font-medium text-white/80 mb-10 animate-float pointer-events-auto cursor-default backdrop-blur-md shadow-premium">
                    <span className="flex h-2 w-2 rounded-full bg-[#06ffa5] shadow-[0_0_10px_#06ffa5]"></span>
                    Hệ sinh thái quản lý gia sư 4.0 số 1 Việt Nam
                </div>

                {/* Headline */}
                <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-6 md:mb-8 leading-[1] sm:leading-[0.95] tracking-tighter select-none drop-shadow-2xl">
                    <span className="block text-white">TUTOR</span>
                    <span className="bg-gradient-to-r from-primary via-[#06ffa5] to-[#9d4edd] bg-clip-text text-transparent animate-gradient-x block pb-4">
                        PRO
                    </span>
                </h1>

                {/* Description */}
                <p className="text-xl md:text-2xl text-white/80 font-light max-w-2xl mb-12 leading-relaxed pointer-events-auto drop-shadow-lg">
                    Giải pháp toàn diện giúp gia sư 1-1 <span className="font-semibold text-white">quản lý chuyên nghiệp</span>,
                    loại bỏ rủi ro <span className="text-[#06ffa5] font-medium">quên thu phí</span> và
                    <span className="text-[#9d4edd] font-medium"> tăng thu nhập 150%</span> nhờ AI.
                </p>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full mb-12 md:mb-16 pointer-events-auto">
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full sm:w-auto px-12 py-5 bg-[#4a9eff] text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(74,158,255,0.4)] flex items-center justify-center text-lg md:text-xl tracking-widest"
                    >
                        BẮT ĐẦU NGAY
                    </button>
                    <button
                        onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full sm:w-auto px-12 py-5 glass border-white/20 text-white font-bold rounded-2xl hover:bg-white/10 transition-all backdrop-blur-md text-lg md:text-xl"
                    >
                        KHÁM PHÁ
                    </button>
                </div>

                {/* Floating Stats Bar */}
                <div className="hidden md:grid grid-cols-4 divide-x divide-white/10 border-premium bg-white/5 rounded-3xl p-6 pointer-events-auto backdrop-blur-xl shadow-premium animate-fade-in-up">
                    {[
                        { label: 'Gia sư tin dùng', value: '500+' },
                        { label: 'Học sinh active', value: '12K+' },
                        { label: 'Kho tài liệu', value: '50K+' },
                        { label: 'Đánh giá', value: '4.9/5' }
                    ].map((stat, i) => (
                        <div key={i} className="px-8 flex flex-col items-center group/stat">
                            <div className="text-3xl font-black text-white mb-1 group-hover/stat:scale-110 transition-transform duration-300">{stat.value}</div>
                            <div className="text-xs uppercase tracking-widest text-white/50 font-bold">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse pointer-events-auto cursor-pointer" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold">Cuộn để khám phá</span>
                    <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent"></div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
