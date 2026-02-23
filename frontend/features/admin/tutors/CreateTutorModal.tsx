'use client';

import { useState } from 'react';
import { Eye, EyeOff, X, Loader2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { tutorsApi } from '@/lib/services/tutor';
import { toast } from 'sonner';

interface CreateTutorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface FormErrors {
    fullName?: string;
    email?: string;
    password?: string;
    phone?: string;
}

export function CreateTutorModal({ isOpen, onClose, onSuccess }: CreateTutorModalProps) {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        subscriptionPlan: 'BASIC',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateField = (name: string, value: string): string | undefined => {
        switch (name) {
            case 'fullName':
                if (!value.trim()) {
                    return 'Họ và tên là bắt buộc';
                }
                if (value.trim().length < 2) {
                    return 'Họ và tên phải có ít nhất 2 ký tự';
                }
                return undefined;

            case 'email':
                if (!value.trim()) {
                    return 'Email là bắt buộc';
                }
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    return 'Email không hợp lệ';
                }
                return undefined;

            case 'password':
                if (!value) {
                    return 'Mật khẩu là bắt buộc';
                }
                if (value.length < 8) {
                    return 'Mật khẩu phải có ít nhất 8 ký tự';
                }
                return undefined;

            case 'phone':
                // Phone is optional but if provided should be valid
                if (value && !/^\d{10,}$/.test(value.replace(/\D/g, ''))) {
                    return 'Số điện thoại không hợp lệ';
                }
                return undefined;

            default:
                return undefined;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => {
                if (error) {
                    return { ...prev, [name]: error };
                } else {
                    const newErrors = { ...prev };
                    delete newErrors[name as keyof FormErrors];
                    return newErrors;
                }
            });
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));

        const error = validateField(name, value);
        setErrors(prev => {
            if (error) {
                return { ...prev, [name]: error };
            } else {
                const newErrors = { ...prev };
                delete newErrors[name as keyof FormErrors];
                return newErrors;
            }
        });
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        const fullNameError = validateField('fullName', formData.fullName);
        const emailError = validateField('email', formData.email);
        const passwordError = validateField('password', formData.password);
        const phoneError = validateField('phone', formData.phone);

        if (fullNameError) newErrors.fullName = fullNameError;
        if (emailError) newErrors.email = emailError;
        if (passwordError) newErrors.password = passwordError;
        if (phoneError) newErrors.phone = phoneError;

        setErrors(newErrors);
        setTouched({
            fullName: true,
            email: true,
            password: true,
            phone: true,
        });

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        try {
            await tutorsApi.create({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                subscriptionPlan: formData.subscriptionPlan,
            });

            toast.success('Đã tạo gia sư mới');
            resetForm();
            onClose();
            onSuccess?.();
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Không thể tạo gia sư';
            toast.error(message);
            console.error('Create tutor error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            fullName: '',
            email: '',
            password: '',
            phone: '',
            subscriptionPlan: 'BASIC',
        });
        setErrors({});
        setTouched({});
        setShowPassword(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="bg-[var(--admin-surface)] border border-[var(--admin-border)] max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-[var(--admin-text)]">
                        Thêm Gia Sư Mới
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Họ và tên */}
                    <div>
                        <label className="text-xs font-bold text-[var(--admin-text3)] uppercase tracking-widest">
                            Họ và Tên
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="Nhập họ và tên"
                            className="w-full mt-1 px-3 py-2 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-lg text-[var(--admin-text)] placeholder-[var(--admin-text3)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                        />
                        {errors.fullName && (
                            <p className="text-xs text-[var(--admin-red)] mt-1">{errors.fullName}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-xs font-bold text-[var(--admin-text3)] uppercase tracking-widest">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="example@email.com"
                            className="w-full mt-1 px-3 py-2 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-lg text-[var(--admin-text)] placeholder-[var(--admin-text3)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                        />
                        {errors.email && (
                            <p className="text-xs text-[var(--admin-red)] mt-1">{errors.email}</p>
                        )}
                    </div>

                    {/* Mật khẩu */}
                    <div>
                        <label className="text-xs font-bold text-[var(--admin-text3)] uppercase tracking-widest">
                            Mật Khẩu
                        </label>
                        <div className="relative mt-1">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
                                className="w-full px-3 py-2 pr-10 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-lg text-[var(--admin-text)] placeholder-[var(--admin-text3)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-text3)] hover:text-[var(--admin-text)] transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-xs text-[var(--admin-red)] mt-1">{errors.password}</p>
                        )}
                    </div>

                    {/* Số điện thoại */}
                    <div>
                        <label className="text-xs font-bold text-[var(--admin-text3)] uppercase tracking-widest">
                            Số Điện Thoại (Tùy chọn)
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder="0123456789"
                            className="w-full mt-1 px-3 py-2 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-lg text-[var(--admin-text)] placeholder-[var(--admin-text3)] focus:outline-none focus:border-[var(--admin-accent)] transition-all"
                        />
                        {errors.phone && (
                            <p className="text-xs text-[var(--admin-red)] mt-1">{errors.phone}</p>
                        )}
                    </div>

                    {/* Gói cước */}
                    <div>
                        <label className="text-xs font-bold text-[var(--admin-text3)] uppercase tracking-widest">
                            Gói Cước
                        </label>
                        <Select value={formData.subscriptionPlan} onValueChange={(value) => setFormData(prev => ({ ...prev, subscriptionPlan: value }))}>
                            <SelectTrigger className="w-full mt-1 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-lg text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] transition-all">
                                <SelectValue placeholder="Chọn gói cước" />
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                                <SelectItem value="BASIC">FREE</SelectItem>
                                <SelectItem value="PREMIUM">PRO</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-lg text-sm font-medium text-[var(--admin-text2)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface3)] transition-all disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-4 py-2 bg-[var(--admin-accent)] rounded-lg text-sm font-bold text-[var(--admin-bg)] hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isLoading ? 'Đang tạo...' : 'Tạo Gia Sư'}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
