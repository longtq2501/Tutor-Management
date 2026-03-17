
import React from 'react';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="border-t border-slate-200 bg-slate-50/80 px-6 py-12 md:py-20">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200 bg-white text-sky-700">
                                <GraduationCap size={18} />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-slate-900">Tutor Pro</span>
                        </div>
                        <p className="text-sm leading-relaxed text-slate-600">
                            Kiến tạo tương lai giáo dục 1-1 tại Việt Nam bằng công nghệ và trí tuệ nhân tạo.
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-6 font-bold text-slate-900">Nền tảng</h4>
                        <ul className="space-y-4 text-sm text-slate-600">
                            <li><Link href="/features" className="transition-colors hover:text-sky-700">Tính năng</Link></li>
                            <li><Link href="/pricing" className="transition-colors hover:text-sky-700">Bảng giá</Link></li>
                            <li><a href="https://github.com/longtq2501/Tutor-Pro" target="_blank" rel="noreferrer" className="transition-colors hover:text-sky-700">GitHub</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-6 font-bold text-slate-900">Liên hệ</h4>
                        <ul className="space-y-4 text-sm text-slate-600">
                            <li>Email: tonquynhlong05@gmail.com</li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-between gap-6 border-t border-slate-200 pt-12 text-xs font-medium uppercase tracking-widest text-slate-400 md:flex-row">
                    <p>© {new Date().getFullYear()} TUTOR PRO VIETNAM. ALL RIGHTS RESERVED.</p>
                    <div className="flex gap-8">
                        <a href="#" className="transition-colors hover:text-slate-700">Privacy Policy</a>
                        <a href="#" className="transition-colors hover:text-slate-700">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
