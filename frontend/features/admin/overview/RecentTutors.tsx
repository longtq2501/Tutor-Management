'use client';

import { Eye, Edit2, X, Users, ShieldCheck, Mail, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { tutorsApi } from '@/lib/services/tutor';
import type { Tutor } from '@/lib/types/tutor';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

const getAvatarColor = (name: string) => {
    const colors = [
        'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'bg-purple-500/20 text-purple-400 border-purple-500/30',
        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        'bg-amber-500/20 text-amber-400 border-amber-500/30',
        'bg-rose-500/20 text-rose-400 border-rose-500/30',
    ];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
};

const getStatusStyles = (status: string) => {
    switch (status) {
        case 'ACTIVE': return { dot: 'bg-[var(--admin-green)]', text: 'text-[var(--admin-green)]', label: 'Hoạt động' };
        case 'INACTIVE': return { dot: 'bg-[var(--admin-text3)]', text: 'text-[var(--admin-text3)]', label: 'Ngoại tuyến' };
        case 'SUSPENDED': return { dot: 'bg-[var(--admin-red)]', text: 'text-[var(--admin-red)]', label: 'Đã khoá' };
        default: return { dot: 'bg-gray-500', text: 'text-gray-500', label: status };
    }
};

const getInitials = (name: string) => {
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

export function RecentTutors() {
    const router = useRouter();
    const [tutors, setTutors] = useState<Tutor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingTutor, setEditingTutor] = useState<Tutor | null>(null);
    const [editFormData, setEditFormData] = useState({ fullName: '', email: '' });

    useEffect(() => {
        const fetchTutors = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await tutorsApi.getAll(0, 5);
                setTutors(data.content || []);
            } catch (err: unknown) {
                console.error('Failed to fetch tutors:', err);
                // Log detailed error info for debugging
                if (axios.isAxiosError(err)) {
                    if (err.response) {
                        console.error('Error status:', err.response.status);
                        console.error('Error data:', err.response.data);
                        console.error('Error headers:', err.response.headers);
                    } else if (err.request) {
                        console.error('No response received:', err.request);
                    }
                } else if (err instanceof Error) {
                    console.error('Error message:', err.message);
                }

                // Show specific error message if available
                let errorMessage = 'Không thể tải danh sách gia sư';
                if (axios.isAxiosError(err)) {
                    errorMessage = err.response?.data?.message || errorMessage;
                }
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchTutors();
    }, []);

    const handleViewTutor = (tutorId: number) => {
        router.push(`/tutors?id=${tutorId}`);
    };

    const handleEditClick = (tutor: Tutor) => {
        setEditingTutor(tutor);
        setEditFormData({ fullName: tutor.fullName, email: tutor.email });
    };

    const handleCloseEdit = () => {
        setEditingTutor(null);
        setEditFormData({ fullName: '', email: '' });
    };

    const handleEditSubmit = () => {
        // TODO: Call API to update tutor
        console.log('Updating tutor:', editingTutor?.id, editFormData);
        handleCloseEdit();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1 glass border-premium rounded-3xl flex flex-col overflow-hidden shadow-premium backdrop-blur-xl"
        >
            <div className="p-8 border-b border-border/50 flex items-center justify-between">
                <div className="flex flex-col gap-1.5 border-l-4 border-primary pl-4">
                    <h3 className="text-xl font-black text-foreground tracking-tight">Gia Sư Mới</h3>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-black">Danh sách đăng ký gần đây</p>
                </div>
                <button
                    onClick={() => router.push('/tutors')}
                    className="group flex items-center gap-2 px-4 py-2 text-xs font-black text-primary hover:bg-primary/10 rounded-xl transition-all duration-300"
                >
                    Xem tất cả
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
            </div>

            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100/50 dark:bg-white/5 border-b border-border/30">
                            <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Gia Sư</th>
                            <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Học Sinh</th>
                            <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Tier</th>
                            <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Trạng Thái</th>
                            <th className="px-8 py-5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-right">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={`skeleton-${idx}`} className="group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
                                            <div className="space-y-2 flex-1">
                                                <Skeleton className="h-4 w-32 rounded-full" />
                                                <Skeleton className="h-3 w-48 rounded-full" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <Skeleton className="h-4 w-8 rounded-full" />
                                    </td>
                                    <td className="px-8 py-5">
                                        <Skeleton className="h-6 w-12 rounded-lg" />
                                    </td>
                                    <td className="px-8 py-5">
                                        <Skeleton className="h-4 w-20 rounded-full" />
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center justify-end gap-2">
                                            <Skeleton className="w-10 h-10 rounded-xl" />
                                            <Skeleton className="w-10 h-10 rounded-xl" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : error ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex flex-col items-center gap-4 max-w-xs mx-auto"
                                    >
                                        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                                            <X className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-foreground">{error}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Vui lòng kiểm tra lại kết nối hoặc thử lại sau.</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setError(null);
                                                setLoading(true);
                                                tutorsApi.getAll(0, 5)
                                                    .then(data => setTutors(data.content || []))
                                                    .catch(() => setError('Không thể tải danh sách gia sư'))
                                                    .finally(() => setLoading(false));
                                            }}
                                            className="px-6 py-2 bg-primary text-white text-[11px] font-black rounded-xl hover:scale-105 transition-all shadow-glow-sm shadow-primary/30 uppercase tracking-widest"
                                        >
                                            Thử lại
                                        </button>
                                    </motion.div>
                                </td>
                            </tr>
                        ) : tutors.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-8 py-20 text-center">
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center gap-4 text-muted-foreground/30"
                                    >
                                        <Users className="w-16 h-16" />
                                        <p className="text-sm font-black uppercase tracking-[0.2em]">Không có dữ liệu gia sư</p>
                                    </motion.div>
                                </td>
                            </tr>
                        ) : (
                            tutors.map((tutor, idx) => {
                                const status = getStatusStyles(tutor.subscriptionStatus);
                                const avatarStyle = getAvatarColor(tutor.fullName);

                                return (
                                    <motion.tr
                                        key={tutor.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 * idx }}
                                        className="group hover:bg-primary/[0.03] transition-all duration-300 cursor-default"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="relative group-hover:scale-110 transition-transform duration-500">
                                                    {tutor.avatarUrl ? (
                                                        <img
                                                            src={tutor.avatarUrl}
                                                            alt={tutor.fullName}
                                                            className="w-11 h-11 rounded-xl object-cover border-2 border-border/20 shadow-glow-sm group-hover:border-primary transition-colors"
                                                        />
                                                    ) : (
                                                        <div className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center font-black text-sm shadow-glow-sm group-hover:border-primary transition-all ${avatarStyle}`}>
                                                            {getInitials(tutor.fullName)}
                                                        </div>
                                                    )}
                                                    {tutor.subscriptionStatus === 'ACTIVE' && (
                                                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-glow-sm shadow-green-500/50" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors duration-300">
                                                        {tutor.fullName}
                                                    </span>
                                                    <span className="text-[11px] font-black text-muted-foreground/70 uppercase tracking-widest">{tutor.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                                                <span className="text-sm font-black text-foreground tabular-nums">{tutor.studentCount}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            {tutor.subscriptionPlan === 'PREMIUM' ? (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 text-violet-500 border border-violet-500/20 shadow-glow-sm shadow-fuchsia-500/10">
                                                    <ShieldCheck className="w-3 h-3" />
                                                    PRO MAX
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-slate-100 dark:bg-white/5 text-muted-foreground border border-border/50">
                                                    BASIC
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-2 h-2 rounded-full shadow-glow-sm ${status.dot}`} style={{ boxShadow: `0 0 8px ${status.dot.replace('bg-', '')}` }} />
                                                <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${status.text}`}>{status.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewTutor(tutor.id)}
                                                    className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary bg-slate-100 dark:bg-white/5 hover:bg-primary/10 border border-transparent hover:border-primary/20 rounded-xl transition-all duration-300 group/btn"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4.5 w-4.5 group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(tutor)}
                                                    className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-amber-500 bg-slate-100 dark:bg-white/5 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 rounded-xl transition-all duration-300 group/btn"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 className="h-4.5 w-4.5 group-hover/btn:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {editingTutor && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass border-premium rounded-[2.5rem] p-10 w-full max-w-lg shadow-premium overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

                            <div className="flex items-start justify-between mb-10 relative">
                                <div className="flex flex-col gap-2 border-l-4 border-primary pl-6">
                                    <h2 className="text-2xl font-black text-foreground tracking-tight">Chỉnh Sửa Gia Sư</h2>
                                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground/60">Cập nhật hồ sơ thành viên</p>
                                </div>
                                <button
                                    onClick={handleCloseEdit}
                                    className="w-12 h-12 rounded-2xl bg-white dark:bg-white/5 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-all duration-300 group"
                                >
                                    <X className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
                                </button>
                            </div>

                            <div className="space-y-8 relative">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] ml-1">Tên Gia Sư</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            value={editFormData.fullName}
                                            onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                                            className="w-full h-14 pl-14 pr-6 bg-slate-100 dark:bg-white/5 border border-border/50 rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                            placeholder="Họ và tên"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] ml-1">Email</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            value={editFormData.email}
                                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                            className="w-full h-14 pl-14 pr-6 bg-slate-100 dark:bg-white/5 border border-border/50 rounded-2xl text-sm font-bold text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                                            placeholder="Địa chỉ email"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        onClick={handleCloseEdit}
                                        className="flex-1 h-14 bg-slate-100 dark:bg-white/5 border border-border/50 rounded-2xl text-[11px] font-black text-muted-foreground hover:text-foreground transition-all duration-300 uppercase tracking-widest shadow-premium"
                                    >
                                        Hủy bỏ
                                    </button>
                                    <button
                                        onClick={handleEditSubmit}
                                        className="flex-[1.5] h-14 bg-primary text-white rounded-2xl text-[11px] font-black hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 uppercase tracking-[0.2em] shadow-glow-md shadow-primary/30"
                                    >
                                        Lưu thay đổi
                                    </button>
                                </div>
                            </div>

                            {/* Background Accent */}
                            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
