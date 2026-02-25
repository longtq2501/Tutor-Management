
import React from 'react';
import { GraduationCap } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="py-12 md:py-20 px-6 border-t border-white/5 bg-[#050714]">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded-lg text-primary border border-primary/20">
                                <GraduationCap size={18} />
                            </div>
                            <span className="text-xl font-bold tracking-tight">Tutor Pro</span>
                        </div>
                        <p className="text-white/50 text-sm leading-relaxed">
                            Kiến tạo tương lai giáo dục 1-1 tại Việt Nam bằng công nghệ và trí tuệ nhân tạo.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Nền tảng</h4>
                        <ul className="space-y-4 text-white/50 text-sm">
                            <li><a href="#" className="hover:text-[#4a9eff] transition-colors">Cho Gia sư</a></li>
                            <li><a href="#" className="hover:text-[#4a9eff] transition-colors">Cho Học sinh</a></li>
                            <li><a href="#" className="hover:text-[#4a9eff] transition-colors">Tính năng AI</a></li>
                            <li><a href="#" className="hover:text-[#4a9eff] transition-colors">Bảng giá</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Cộng đồng</h4>
                        <ul className="space-y-4 text-white/50 text-sm">
                            <li><a href="#" className="hover:text-[#4a9eff] transition-colors">Hội Gia sư 4.0</a></li>
                            <li><a href="#" className="hover:text-[#4a9eff] transition-colors">Blog chia sẻ</a></li>
                            <li><a href="#" className="hover:text-[#4a9eff] transition-colors">Tài liệu miễn phí</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6">Liên hệ</h4>
                        <ul className="space-y-4 text-white/50 text-sm">
                            <li>Email: contact@tutorpro.vn</li>
                            <li>Hotline: 1900 6868</li>
                            <li>Văn phòng: Hà Nội & TP.HCM</li>
                        </ul>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-white/30 text-xs uppercase tracking-widest font-medium">
                    <p>© {new Date().getFullYear()} TUTOR PRO VIETNAM. ALL RIGHTS RESERVED.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
