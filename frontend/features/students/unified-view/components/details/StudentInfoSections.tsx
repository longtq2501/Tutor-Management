"use client";

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn, formatCurrency } from '@/lib/utils';
import {
    Calendar,
    Edit2,
    ExternalLink,
    Mail,
    Phone,
    ShieldCheck,
    UserCircle
} from 'lucide-react';
import type { Student } from '@/lib/types';
import React from 'react';

const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={cn("block uppercase tracking-widest text-[10px] sm:text-xs font-bold", className)}>
        {children}
    </span>
);

interface StudentInfoSectionsProps {
    student: Student;
    onEdit: (student: Student) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onEditParent?: (parent: any) => void;
}

export function StudentInfoSections({ student, onEdit, onEditParent }: StudentInfoSectionsProps) {
    return (
        <div className="space-y-8">
            {/* Account Information */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Tài khoản & Bảo mật</h4>
                </div>
                <div className="bg-muted/30 rounded-2xl p-5 border border-border/50">
                    <div className="flex flex-col gap-4">
                        <div className="space-y-1">
                            <Label className="text-muted-foreground">EMAIL ĐĂNG NHẬP</Label>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-primary" />
                                </div>
                                <span className="font-mono text-base font-medium break-all">
                                    {student.accountEmail || 'Chưa thiết lập tài khoản'}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full sm:w-fit h-10 rounded-xl gap-2 font-bold border-2 hover:bg-primary/5 border-primary/20 transition-all active:scale-95"
                            onClick={() => onEdit(student)}
                        >
                            <Edit2 className="w-4 h-4" />
                            {student.accountEmail ? 'Đổi mật khẩu / Email' : 'Cấp tài khoản'}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Academic & Parent Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {/* Academic Details */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Thông tin học tập</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">SĐT cá nhân:</span>
                            <span className="font-bold flex items-center gap-2 text-foreground">
                                <Phone className="w-3.5 h-3.5" />
                                {student.phone || 'N/A'}
                            </span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Học phí / giờ:</span>
                            <span className="font-bold text-foreground text-lg">
                                {formatCurrency(student.pricePerHour)}
                            </span>
                        </div>
                        <Separator />
                        <div className="flex flex-col gap-1.5 text-sm">
                            <span className="text-muted-foreground">Lịch học cố định:</span>
                            <span className="font-bold p-3 bg-muted/40 rounded-xl border border-border text-primary leading-relaxed">
                                {student.schedule || 'Chưa có lịch cố định'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Parent Details */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <UserCircle className="w-5 h-5 text-purple-500" />
                            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Phụ huynh liên kết</h4>
                        </div>
                        {onEditParent && (student.parent || student.parentId) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-primary gap-1 font-bold text-xs hover:bg-primary/10"
                                onClick={() => onEditParent(student.parent || {
                                    id: student.parentId,
                                    name: student.parentName,
                                    email: student.parentEmail,
                                    phone: student.parentPhone
                                })}
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                Sửa
                            </Button>
                        )}
                    </div>
                    {(student.parent || student.parentName) ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Họ và tên:</span>
                                <span className="font-bold text-foreground uppercase tracking-wide">
                                    {student.parent?.name || student.parentName}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Số điện thoại:</span>
                                <span className="font-bold text-foreground">
                                    {student.parent?.phone || student.parentPhone || 'N/A'}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Email:</span>
                                <span className="font-bold text-foreground truncate max-w-[200px]">
                                    {student.parent?.email || student.parentEmail || 'N/A'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-muted/20 border border-dashed rounded-2xl">
                            <p className="text-sm text-muted-foreground italic">Chưa liên kết phụ huynh</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
