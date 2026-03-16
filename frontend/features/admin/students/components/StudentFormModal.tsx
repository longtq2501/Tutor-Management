'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminStudentsApi } from '@/lib/services/admin-students';
import { parentsApi } from '@/lib/services/parent';
import { toast } from 'sonner';
import type { Parent } from '@/lib/types/student';
import axios from 'axios';

interface StudentFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    studentId?: number | null;
}

export function StudentFormModal({
    isOpen,
    onClose,
    onSuccess,
    studentId,
}: StudentFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [parents, setParents] = useState<Parent[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        schedule: '',
        pricePerHour: 0,
        notes: '',
        parentId: '' as string | number,
        startMonth: new Date().toISOString().slice(0, 7),
        active: true,
        createAccount: false,
        email: '',
        password: '',
    });

    const fetchParents = useCallback(async () => {
        try {
            const data = await parentsApi.getAll();
            setParents(data);
        } catch (error) {
            console.error('Failed to fetch parents:', error);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchParents();
        }
    }, [isOpen, fetchParents]);

    const fetchStudent = useCallback(async () => {
        if (studentId) {
            setLoading(true);
            try {
                const data = await adminStudentsApi.getById(studentId);
                setFormData({
                    name: data.name,
                    phone: data.phone || '',
                    schedule: data.schedule,
                    pricePerHour: data.pricePerHour,
                    notes: data.notes || '',
                    parentId: data.parentId || '',
                    startMonth: data.startMonth || new Date().toISOString().slice(0, 7),
                    active: data.active,
                    createAccount: false,
                    email: data.accountEmail || '',
                    password: '', // Don't fill password on edit
                });
            } catch {
                toast.error('Không thể tải thông tin học sinh');
                onClose();
            } finally {
                setLoading(false);
            }
        } else {
            setFormData({
                name: '',
                phone: '',
                schedule: '',
                pricePerHour: 0,
                notes: '',
                parentId: '',
                startMonth: new Date().toISOString().slice(0, 7),
                active: true,
                createAccount: false,
                email: '',
                password: '',
            });
        }
    }, [studentId, onClose]);

    useEffect(() => {
        if (isOpen) {
            fetchStudent();
        }
    }, [isOpen, fetchStudent]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                ...formData,
                parentId: formData.parentId === '' ? null : Number(formData.parentId),
            };

            if (studentId) {
                await adminStudentsApi.update(studentId, payload);
                toast.success('Cập nhật học sinh thành công');
            } else {
                await adminStudentsApi.create(payload);
                toast.success('Thêm mới học sinh thành công');
            }
            onSuccess();
            onClose();
        } catch (error: unknown) {
            let message = 'Có lỗi xảy ra';
            if (axios.isAxiosError(error)) {
                message = error.response?.data?.message || error.message || message;
            }
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto admin-theme admin-glass border-[var(--admin-border)]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black text-[var(--admin-text)]">
                        {studentId ? 'CHỈNH SỬA HỌC SINH' : 'THÊM MỚI HỌC SINH'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-[var(--admin-text2)]">HỌ TÊN HỌC SINH *</Label>
                            <Input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Nguyễn Văn A"
                                className="bg-[var(--admin-surface)] border-[var(--admin-border)] text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-[var(--admin-text2)]">SỐ ĐIỆN THOẠI</Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="0987xxxxxx"
                                className="bg-[var(--admin-surface)] border-[var(--admin-border)] text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-[var(--admin-text2)]">LỊCH HỌC *</Label>
                            <Input
                                required
                                value={formData.schedule}
                                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                                placeholder="Thứ 2-4-6 (19:00)"
                                className="bg-[var(--admin-surface)] border-[var(--admin-border)] text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-[var(--admin-text2)]">HỌC PHÍ / GIỜ *</Label>
                            <Input
                                required
                                type="number"
                                value={formData.pricePerHour}
                                onChange={(e) => setFormData({ ...formData, pricePerHour: Number(e.target.value) })}
                                className="bg-[var(--admin-surface)] border-[var(--admin-border)] text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-[var(--admin-text2)]">PHỤ HUYNH LIÊN KẾT</Label>
                        <select
                            className="w-full h-10 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-lg px-3 text-sm focus:outline-none focus:border-[var(--admin-accent)]"
                            value={formData.parentId}
                            onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                        >
                            <option value="">-- Chọn phụ huynh --</option>
                            {parents.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name} - {p.phone}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-[var(--admin-text2)]">GHI CHÚ</Label>
                        <textarea
                            className="w-full min-h-[80px] bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-xl p-3 text-sm focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Tình hình học tập, lưu ý đặc biệt..."
                        />
                    </div>

                    {!studentId && (
                        <div className="space-y-4 pt-2 border-t border-[var(--admin-border)]">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="createAccount"
                                    checked={formData.createAccount}
                                    onChange={(e) => setFormData({ ...formData, createAccount: e.target.checked })}
                                    className="accent-[var(--admin-accent)]"
                                />
                                <Label htmlFor="createAccount" className="text-xs font-bold cursor-pointer">TẠO TÀI KHOẢN ĐĂNG NHẬP</Label>
                            </div>

                            {formData.createAccount && (
                                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-[var(--admin-text2)]">EMAIL</Label>
                                        <Input
                                            type="email"
                                            required={formData.createAccount}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="bg-[var(--admin-surface)] border-[var(--admin-border)] text-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-bold text-[var(--admin-text2)]">MẬT KHẨU</Label>
                                        <Input
                                            type="password"
                                            required={formData.createAccount}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="bg-[var(--admin-surface)] border-[var(--admin-border)] text-sm"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="pt-6 border-t border-[var(--admin-border)] mt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-[var(--admin-text2)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface2)] font-bold transition-all"
                        >
                            HỦY BỎ
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="px-8 bg-[var(--admin-accent)] text-[var(--admin-bg)] font-black shadow-glow-md shadow-[var(--admin-accent)]/30 hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
                        >
                            {loading ? 'ĐANG XỬ LÝ...' : (studentId ? 'CẬP NHẬT' : 'TẠO MỚI')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
