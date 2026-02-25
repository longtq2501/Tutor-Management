'use client';

import { useState, useEffect } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { adminStudentsApi } from '@/lib/services/admin-students';
import { toast } from 'sonner';
import type { AdminStudent } from '@/lib/types/admin';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Phone, Mail, MapPin, Calendar, CreditCard, User } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface StudentDetailsDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    studentId: number | null;
}

export function StudentDetailsDrawer({
    isOpen,
    onClose,
    studentId,
}: StudentDetailsDrawerProps) {
    const [student, setStudent] = useState<AdminStudent | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchStudent = async () => {
            if (studentId) {
                setLoading(true);
                try {
                    const data = await adminStudentsApi.getById(studentId);
                    setStudent(data);
                } catch (error) {
                    toast.error('Không thể tải chi tiết học sinh');
                    onClose();
                } finally {
                    setLoading(false);
                }
            }
        };

        if (isOpen) {
            fetchStudent();
        }
    }, [isOpen, studentId]);

    if (!student && loading) {
        return (
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetContent className="sm:max-w-[500px] admin-glass border-[var(--admin-border)]">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Chi tiết học sinh</SheetTitle>
                    </SheetHeader>
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--admin-accent)]" />
                    </div>
                </SheetContent>
            </Sheet>
        );
    }

    if (!student) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-[500px] admin-glass border-[var(--admin-border)] overflow-y-auto">
                <SheetHeader className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[var(--admin-accent)]/10 flex items-center justify-center border border-[var(--admin-accent)]/20 shadow-[0_0_20px_rgba(99,102,241,0.1)]">
                            <GraduationCap className="h-8 w-8 text-[var(--admin-accent)]" />
                        </div>
                        <div>
                            <SheetTitle className="text-2xl font-black text-[var(--admin-text)] uppercase tracking-tight">
                                {student.name}
                            </SheetTitle>
                            <Badge variant={student.active ? "default" : "secondary"} className={student.active ? "bg-[var(--admin-green)]/10 text-[var(--admin-green)] border-[var(--admin-green)]/20" : ""}>
                                {student.active ? 'Đang theo học' : 'Đã nghỉ'}
                            </Badge>
                        </div>
                    </div>
                </SheetHeader>

                <div className="space-y-8">
                    {/* Thông tin liên hệ */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-[var(--admin-text3)] uppercase tracking-widest flex items-center gap-2">
                            <Phone className="h-3 w-3" /> THÔNG TIN LIÊN HỆ
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="p-4 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[var(--admin-text3)]">Số điện thoại</span>
                                    <span className="font-bold text-[var(--admin-text)]">{student.phone || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-[var(--admin-text3)]">Email</span>
                                    <span className="font-bold text-[var(--admin-text)]">{student.accountEmail || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Phụ huynh */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-[var(--admin-text3)] uppercase tracking-widest flex items-center gap-2">
                            <User className="h-3 w-3" /> PHỤ HUYNH
                        </h3>
                        {student.parentName ? (
                            <div className="p-4 rounded-xl bg-[var(--admin-surface2)] border border-[var(--admin-accent)]/20 space-y-3">
                                <div className="font-black text-[var(--admin-accent)] uppercase tracking-tight">{student.parentName}</div>
                                <div className="text-sm text-[var(--admin-text2)]">{student.parentPhone}</div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-sm text-[var(--admin-text3)] italic">
                                Chưa liên kết thông tin phụ huynh
                            </div>
                        )}
                    </section>

                    {/* Học tập */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-[var(--admin-text3)] uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="h-3 w-3" /> HỌC TẬP & TÀI CHÍNH
                        </h3>
                        <div className="grid grid-cols-1 gap-3">
                            <div className="p-4 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] space-y-4">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-[var(--admin-text3)] uppercase">LỊCH HỌC CỐ ĐỊNH</div>
                                        <div className="text-sm font-black text-[var(--admin-text)]">{student.schedule}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-[var(--admin-text3)] uppercase">HỌC PHÍ / GIỜ</div>
                                        <div className="text-sm font-black text-[var(--admin-accent)]">{formatCurrency(student.pricePerHour)}</div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-[var(--admin-border)] flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="text-[10px] font-bold text-[var(--admin-text3)] uppercase">DƯ NỢ HIỆN TẠI</div>
                                        <div className={`text-xl font-black ${student.totalDebt > 0 ? 'text-[var(--admin-red)]' : 'text-[var(--admin-green)]'}`}>
                                            {formatCurrency(student.totalDebt)}
                                        </div>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-[var(--admin-surface2)] flex items-center justify-center">
                                        <CreditCard className="h-5 w-5 text-[var(--admin-text3)]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Gia sư phụ trách */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black text-[var(--admin-text3)] uppercase tracking-widest">GIA SƯ PHỤ TRÁCH</h3>
                        <div className="p-4 rounded-xl bg-[var(--admin-accent)]/[0.03] border border-[var(--admin-accent)]/10">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[var(--admin-accent)]/10 flex items-center justify-center font-bold text-[var(--admin-accent)] text-xs">
                                    {student.tutorName?.charAt(0) || 'G'}
                                </div>
                                <div className="flex flex-col">
                                    <div className="text-xs font-black text-[var(--admin-text)]">{student.tutorName || 'CHƯA GÁN'}</div>
                                    <div className="text-[10px] text-[var(--admin-text3)]">ID: {student.tutorId || 'N/A'}</div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </SheetContent>
        </Sheet>
    );
}
