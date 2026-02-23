'use client';

import { Eye, Edit2, MoreHorizontal, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { tutorsApi } from '@/lib/services/tutor';
import type { Tutor } from '@/lib/types/tutor';
import { toast } from 'sonner';

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
            } catch (err: any) {
                console.error('Failed to fetch tutors:', err);
                // Log detailed error info for debugging
                if (err.response) {
                    console.error('Error status:', err.response.status);
                    console.error('Error data:', err.response.data);
                    console.error('Error headers:', err.response.headers);
                } else if (err.request) {
                    console.error('No response received:', err.request);
                } else {
                    console.error('Error message:', err.message);
                }

                // Show specific error message if available
                const errorMessage = err.response?.data?.message || 'Không thể tải danh sách gia sư';
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
        <div className="flex-1 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[var(--admin-border)] flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-[var(--admin-text)]">Gia Sư Mới</h3>
                    <p className="text-xs text-[var(--admin-text3)] uppercase tracking-widest font-medium">Danh sách đăng ký gần đây</p>
                </div>
                <button onClick={() => router.push('/tutors')} className="px-3 py-1.5 text-sm font-medium text-[var(--admin-accent)] hover:bg-[var(--admin-accent)]/10 rounded-lg transition-colors">
                    Xem tất cả
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--admin-surface2)]/50">
                            <th className="px-6 py-4 text-[10px] font-bold text-[var(--admin-text3)] uppercase tracking-widest">Gia Sư</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[var(--admin-text3)] uppercase tracking-widest">Học Sinh</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[var(--admin-text3)] uppercase tracking-widest">Tier</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[var(--admin-text3)] uppercase tracking-widest">Trạng Thái</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[var(--admin-text3)] uppercase tracking-widest text-right">Thao Tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--admin-border)]">
                        {loading ? (
                            // Skeleton loading state - 5 placeholder rows
                            Array.from({ length: 5 }).map((_, idx) => (
                                <tr key={`skeleton-${idx}`} className="group hover:bg-[var(--admin-surface2)]/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-[var(--admin-surface2)] animate-pulse" />
                                            <div className="flex flex-col gap-2 flex-1">
                                                <div className="h-4 w-24 bg-[var(--admin-surface2)] rounded animate-pulse" />
                                                <div className="h-3 w-32 bg-[var(--admin-surface2)] rounded animate-pulse" />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 w-12 bg-[var(--admin-surface2)] rounded animate-pulse" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-6 w-12 bg-[var(--admin-surface2)] rounded animate-pulse" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="h-4 w-16 bg-[var(--admin-surface2)] rounded animate-pulse" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <div className="w-9 h-9 rounded-lg bg-[var(--admin-surface2)] animate-pulse" />
                                            <div className="w-9 h-9 rounded-lg bg-[var(--admin-surface2)] animate-pulse" />
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : error ? (
                            // Error state
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <p className="text-sm font-medium text-[var(--admin-red)]">{error}</p>
                                        <button
                                            onClick={() => {
                                                setError(null);
                                                setLoading(true);
                                                const fetchTutors = async () => {
                                                    try {
                                                        const data = await tutorsApi.getAll(0, 5);
                                                        setTutors(data.content || []);
                                                    } catch (err) {
                                                        console.error('Failed to fetch tutors:', err);
                                                        setError('Không thể tải danh sách gia sư');
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                };
                                                fetchTutors();
                                            }}
                                            className="text-xs text-[var(--admin-accent)] hover:underline"
                                        >
                                            Thử lại
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : tutors.length === 0 ? (
                            // Empty state
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center">
                                    <p className="text-sm text-[var(--admin-text3)]">Không có dữ liệu gia sư</p>
                                </td>
                            </tr>
                        ) : (
                            // Data rows
                            tutors.map((tutor) => {
                                const status = getStatusStyles(tutor.subscriptionStatus);
                                const avatarStyle = getAvatarColor(tutor.fullName);

                                return (
                                    <tr key={tutor.id} className="group hover:bg-[var(--admin-surface2)]/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {tutor.avatarUrl ? (
                                                    <img
                                                        src={tutor.avatarUrl}
                                                        alt={tutor.fullName}
                                                        className="w-9 h-9 rounded-lg object-cover border border-[var(--admin-border)]"
                                                    />
                                                ) : (
                                                    <div
                                                        className={`w-9 h-9 rounded-lg border flex items-center justify-center font-bold text-xs ${avatarStyle}`}
                                                    >
                                                        {getInitials(tutor.fullName)}
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[var(--admin-text)] group-hover:text-[var(--admin-accent)] transition-colors">
                                                        {tutor.fullName}
                                                    </span>
                                                    <span className="text-[11px] text-[var(--admin-text3)]">{tutor.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-medium text-[var(--admin-text2)]">{tutor.studentCount}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {tutor.subscriptionPlan === 'PREMIUM' ? (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-violet-400 border border-violet-500/30">
                                                    PRO
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-black bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                                    FREE
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                <span className={`text-[11px] font-medium ${status.text}`}>{status.label}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleViewTutor(tutor.id)}
                                                    className="p-2 text-[var(--admin-text3)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface3)] rounded-lg transition-all"
                                                    title="View tutor details"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(tutor)}
                                                    className="p-2 text-[var(--admin-text3)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface3)] rounded-lg transition-all"
                                                    title="Edit tutor information"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingTutor && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-[var(--admin-text)]">Chỉnh Sửa Gia Sư</h2>
                            <button
                                onClick={handleCloseEdit}
                                className="p-1 hover:bg-[var(--admin-surface2)] rounded-lg transition-colors text-[var(--admin-text3)]"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-[var(--admin-text3)] uppercase tracking-widest">Tên Gia Sư</label>
                                <input
                                    type="text"
                                    value={editFormData.fullName}
                                    onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-lg text-[var(--admin-text)] placeholder-[var(--admin-text3)] focus:outline-none focus:border-[var(--admin-accent)]"
                                    placeholder="Full name"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[var(--admin-text3)] uppercase tracking-widest">Email</label>
                                <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-lg text-[var(--admin-text)] placeholder-[var(--admin-text3)] focus:outline-none focus:border-[var(--admin-accent)]"
                                    placeholder="Email address"
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <button
                                    onClick={handleCloseEdit}
                                    className="flex-1 px-4 py-2 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-lg text-sm font-medium text-[var(--admin-text2)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface3)] transition-all"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleEditSubmit}
                                    className="flex-1 px-4 py-2 bg-[var(--admin-accent)] rounded-lg text-sm font-bold text-[var(--admin-bg)] hover:scale-105 transition-all"
                                >
                                    Lưu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
