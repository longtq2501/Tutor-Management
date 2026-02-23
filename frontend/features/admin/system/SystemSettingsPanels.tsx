'use client';

import { useState, useEffect } from 'react';
import { Save, Globe, DollarSign, Shield, Mail, Percent, Loader2, RefreshCcw } from 'lucide-react';
import { adminSystemApi } from '@/lib/services/admin-system';
import { toast } from 'sonner';

export function SystemSettingsPanels() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const data = await adminSystemApi.getSettings();
            setSettings(data);
        } catch (error) {
            toast.error('Không thể tải cấu hình hệ thống');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await adminSystemApi.updateSettings(settings);
            toast.success('Đã lưu cấu hình hệ thống thành công');
        } catch (error) {
            toast.error('Lưu cấu hình thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        fetchSettings();
        toast.info('Đã hoàn tác các thay đổi chưa lưu');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-60 gap-4 opacity-50">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--admin-accent)]" />
                <span className="text-xs font-bold uppercase tracking-widest">Đang tải cấu hình...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Settings */}
                <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl overflow-hidden shadow-xl shadow-black/20">
                    <div className="px-6 py-4 bg-[var(--admin-surface2)]/50 border-b border-[var(--admin-border)] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Globe className="h-5 w-5 text-blue-400" />
                            </div>
                            <h3 className="text-sm font-black text-[var(--admin-text)] uppercase tracking-wider">Cài Đặt Chung</h3>
                        </div>
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-[var(--admin-text3)] uppercase tracking-widest px-1">Tên Nền Tảng</label>
                            <input
                                type="text"
                                value={settings.SYSTEM_NAME || ''}
                                onChange={(e) => handleChange('SYSTEM_NAME', e.target.value)}
                                className="w-full h-10 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-xl px-4 text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-[var(--admin-text3)] uppercase tracking-widest px-1">Email Hỗ Trợ</label>
                            <input
                                type="email"
                                value={settings.SUPPORT_EMAIL || ''}
                                onChange={(e) => handleChange('SUPPORT_EMAIL', e.target.value)}
                                className="w-full h-10 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-xl px-4 text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-xl mt-2">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-[var(--admin-text)]">Chế độ bảo trì</span>
                                <span className="text-[10px] text-[var(--admin-text3)]">Tạm dừng truy cập người dùng</span>
                            </div>
                            <button
                                onClick={() => handleChange('MAINTENANCE_MODE', settings.MAINTENANCE_MODE === 'true' ? 'false' : 'true')}
                                className={`w-10 h-5 rounded-full relative transition-all ${settings.MAINTENANCE_MODE === 'true' ? 'bg-rose-500' : 'bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.MAINTENANCE_MODE === 'true' ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Finance Settings */}
                <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl overflow-hidden shadow-xl shadow-black/20">
                    <div className="px-6 py-4 bg-[var(--admin-surface2)]/50 border-b border-[var(--admin-border)] flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <DollarSign className="h-5 w-5 text-emerald-400" />
                        </div>
                        <h3 className="text-sm font-black text-[var(--admin-text)] uppercase tracking-wider">Cấu Hình Tài Chính</h3>
                    </div>
                    <div className="p-6 flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-[var(--admin-text3)] uppercase tracking-widest px-1">Chiết Khấu Hệ Thống (%)</label>
                            <div className="relative">
                                <Percent className="absolute right-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--admin-text3)]" />
                                <input
                                    type="number"
                                    value={settings.COMMISSION_RATE || ''}
                                    onChange={(e) => handleChange('COMMISSION_RATE', e.target.value)}
                                    className="w-full h-10 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-xl px-4 text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-[var(--admin-text3)] uppercase tracking-widest px-1">Hạn Mức Rút Tiền Tối Thiểu</label>
                            <input
                                type="text"
                                value={settings.MIN_WITHDRAWAL || ''}
                                onChange={(e) => handleChange('MIN_WITHDRAWAL', e.target.value)}
                                className="w-full h-10 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-xl px-4 text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-[var(--admin-text3)] uppercase tracking-widest px-1">Chu Kỳ Quyết Toán</label>
                            <select
                                value={settings.SETTLEMENT_CYCLE || 'WEEKLY'}
                                onChange={(e) => handleChange('SETTLEMENT_CYCLE', e.target.value)}
                                className="w-full h-10 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-xl px-4 text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                            >
                                <option value="WEEKLY">Hàng tuần (Thứ 2)</option>
                                <option value="MONTHLY">Hàng tháng (Ngày 1)</option>
                                <option value="INSTANT">Tức thì sau mỗi buổi</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Security & Auth */}
                <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl overflow-hidden shadow-xl shadow-black/20 lg:col-span-2">
                    <div className="px-6 py-4 bg-[var(--admin-surface2)]/50 border-b border-[var(--admin-border)] flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 rounded-lg">
                            <Shield className="h-5 w-5 text-violet-400" />
                        </div>
                        <h3 className="text-sm font-black text-[var(--admin-text)] uppercase tracking-wider">Bảo Mật & Xác Thực</h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-[var(--admin-text3)] uppercase tracking-widest px-1">Duyệt Gia Sư Tự Động</label>
                            <div className="flex items-center gap-3 h-10">
                                <button
                                    onClick={() => handleChange('AUTO_APPROVE_TUTOR', settings.AUTO_APPROVE_TUTOR === 'true' ? 'false' : 'true')}
                                    className={`w-10 h-5 rounded-full relative transition-all ${settings.AUTO_APPROVE_TUTOR === 'true' ? 'bg-[var(--admin-accent)]' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.AUTO_APPROVE_TUTOR === 'true' ? 'right-1' : 'left-1'}`} />
                                </button>
                                <span className="text-[10px] text-[var(--admin-text2)] font-black uppercase tracking-widest">
                                    {settings.AUTO_APPROVE_TUTOR === 'true' ? 'Đang Bật' : 'Đang Tắt'}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-black text-[var(--admin-text3)] uppercase tracking-widest px-1">Thời Gian Hết Hạn Token (Ngày)</label>
                            <select
                                value={settings.TOKEN_EXPIRATION_DAYS || '7'}
                                onChange={(e) => handleChange('TOKEN_EXPIRATION_DAYS', e.target.value)}
                                className="w-full h-10 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-xl px-4 text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                            >
                                <option value="1">1 Ngày</option>
                                <option value="7">7 Ngày</option>
                                <option value="30">30 Ngày</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
                <button
                    onClick={handleReset}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-xl text-xs font-bold text-[var(--admin-text2)] hover:text-[var(--admin-text)] transition-all disabled:opacity-50"
                >
                    <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>HOÀN TÁC</span>
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[var(--admin-accent)] text-[var(--admin-bg)] rounded-xl text-xs font-black shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>{saving ? 'ĐANG LƯU...' : 'LƯU CẤU HÌNH'}</span>
                </button>
            </div>
        </div>
    );
}
