'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AvatarUpload } from '@/components/shared/AvatarUpload';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Save, User, Mail, Shield, Hash, Bell, Lock, CreditCard, Building2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VIETNAM_BANKS } from '@/lib/constants/banks';

const profileSchema = z.object({
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(50, 'Họ tên không được vượt quá 50 ký tự'),
    bankName: z.string().min(2, 'Tên ngân hàng quá ngắn').max(50, 'Tên ngân hàng quá dài').optional().or(z.literal('')),
    accountNumber: z.string()
        .regex(/^\d+$/, 'Số tài khoản chỉ được chứa chữ số')
        .min(6, 'Số tài khoản quá ngắn')
        .max(20, 'Số tài khoản quá dài')
        .optional()
        .or(z.literal('')),
    accountName: z.string()
        .regex(/^[A-Z ]+$/, 'Tên chủ tài khoản phải viết hoa, không dấu')
        .min(5, 'Tên chủ tài khoản quá ngắn')
        .max(50, 'Tên chủ tài khoản quá dài')
        .optional()
        .or(z.literal('')),
    bankCode: z.string()
        .regex(/^\d+$/, 'Mã ngân hàng chỉ được chứa chữ số')
        .min(3, 'Mã ngân hàng quá ngắn')
        .max(10, 'Mã ngân hàng quá dài')
        .optional()
        .or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

type SettingsSection = 'profile' | 'password' | 'notifications';

const SIDEBAR_ITEMS: { id: SettingsSection; label: string; icon: LucideIcon }[] = [
    { id: 'profile', label: 'Thông tin cá nhân', icon: User },
    { id: 'password', label: 'Mật khẩu', icon: Lock },
    { id: 'notifications', label: 'Thông báo', icon: Bell },
];

function PasswordChangeForm({ onSubmit, isLoading }: { onSubmit: (data: PasswordFormValues) => Promise<void>; isLoading: boolean }) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
    });

    const handleFormSubmit = async (data: PasswordFormValues) => {
        await onSubmit(data);
        reset();
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-md">
            <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Mật khẩu hiện tại
                </Label>
                <Input
                    id="currentPassword"
                    type="password"
                    {...register('currentPassword')}
                    placeholder="Nhập mật khẩu hiện tại"
                    className={cn(
                        'h-11',
                        errors.currentPassword && 'border-destructive focus-visible:ring-destructive'
                    )}
                    disabled={isLoading}
                />
                {errors.currentPassword && (
                    <p className="text-xs font-medium text-destructive mt-1">
                        {errors.currentPassword.message}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Mật khẩu mới
                </Label>
                <Input
                    id="newPassword"
                    type="password"
                    {...register('newPassword')}
                    placeholder="Nhập mật khẩu mới"
                    className={cn(
                        'h-11',
                        errors.newPassword && 'border-destructive focus-visible:ring-destructive'
                    )}
                    disabled={isLoading}
                />
                {errors.newPassword && (
                    <p className="text-xs font-medium text-destructive mt-1">
                        {errors.newPassword.message}
                    </p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    Xác nhận mật khẩu mới
                </Label>
                <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    placeholder="Nhập lại mật khẩu mới"
                    className={cn(
                        'h-11',
                        errors.confirmPassword && 'border-destructive focus-visible:ring-destructive'
                    )}
                    disabled={isLoading}
                />
                {errors.confirmPassword && (
                    <p className="text-xs font-medium text-destructive mt-1">
                        {errors.confirmPassword.message}
                    </p>
                )}
            </div>

            <Button
                type="submit"
                className="h-11 px-8 font-medium"
                disabled={isLoading}
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang đổi...
                    </>
                ) : (
                    <>
                        <Lock className="mr-2 h-4 w-4" />
                        Đổi mật khẩu
                    </>
                )}
            </Button>
        </form>
    );
}

export default function ProfilePage() {
    const { user, loading, updateProfile, changePassword } = useAuth();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const {
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        formState: { errors },
    } = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: user?.fullName || '',
            bankName: user?.bankName || '',
            accountNumber: user?.accountNumber || '',
            accountName: user?.accountName || '',
            bankCode: user?.bankCode || '',
        },
    });

    useEffect(() => {
        if (user) {
            reset({
                fullName: user.fullName || '',
                bankName: user.bankName || '',
                accountNumber: user.accountNumber || '',
                accountName: user.accountName || '',
                bankCode: user.bankCode || '',
            });
        }
    }, [user, reset]);

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const selectedBankCode = watch('bankCode');

    const onSubmit = async (data: ProfileFormValues) => {
        try {
            setIsSaving(true);
            await updateProfile(data);
            reset(data);
            toast.success('Cập nhật thông tin thành công');
        } catch (error: unknown) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordChange = async (data: PasswordFormValues) => {
        try {
            setIsChangingPassword(true);
            await changePassword(data);
            toast.success('Đổi mật khẩu thành công');
        } catch (error: unknown) {
            const message = (error as { message?: string })?.message || 'Có lỗi xảy ra khi đổi mật khẩu';
            toast.error(message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 w-full max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                {/* Sidebar */}
                <aside className="lg:w-56 flex-shrink-0">
                    <nav className="space-y-1">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-4">
                            Cài đặt
                        </h2>
                        {SIDEBAR_ITEMS.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setActiveSection(item.id)}
                                    className={cn(
                                        'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors',
                                        activeSection === item.id
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                    )}
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* Content */}
                <main className="flex-1 min-w-0 space-y-10">
                    {activeSection === 'profile' && (
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                                    Thông tin cá nhân
                                </h3>
                                <p className="text-muted-foreground mt-1">
                                    Quản lý ảnh đại diện và thông tin tài khoản
                                </p>
                            </div>

                            <div className="border-t border-border/60 pt-8">
                                <div className="flex flex-col sm:flex-row gap-10 sm:gap-14">
                                    <div className="flex flex-col items-center sm:items-start space-y-3">
                                        <AvatarUpload size="xl" className="ring-2 ring-border/50" />
                                        <div className="text-center sm:text-left">
                                            <p className="text-sm font-semibold text-foreground">Ảnh đại diện</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 max-w-[220px]">
                                                Kéo chỉnh vị trí trong khung tròn rồi lưu
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-8">
                                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                            {/* Basic Info */}
                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="fullName" className="text-sm font-medium flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        Họ và tên
                                                    </Label>
                                                    <Input
                                                        id="fullName"
                                                        {...register('fullName')}
                                                        placeholder="Nhập họ và tên của bạn"
                                                        className={cn(
                                                            'h-11 w-full max-w-md xl:max-w-lg',
                                                            errors.fullName && 'border-destructive focus-visible:ring-destructive'
                                                        )}
                                                        disabled={isSaving}
                                                    />
                                                    {errors.fullName && (
                                                        <p className="text-xs font-medium text-destructive mt-1">
                                                            {errors.fullName.message}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Account Info Read-only */}
                                            <div className="border-t border-border/40 pt-6 space-y-4">
                                                <h4 className="text-sm font-semibold text-foreground">Thông tin đăng nhập</h4>
                                                <div className="grid gap-4 sm:grid-cols-2 w-full max-w-xl xl:max-w-2xl">
                                                    <div className="space-y-2">
                                                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <Mail className="h-4 w-4" />
                                                            Email
                                                        </Label>
                                                        <p className="px-3 py-2 rounded-md bg-muted/40 text-foreground font-medium text-sm">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <Shield className="h-4 w-4" />
                                                            Vai trò
                                                        </Label>
                                                        <p className="px-3 py-2 rounded-md bg-muted/40 text-foreground font-medium text-sm capitalize">
                                                            {user.role}
                                                        </p>
                                                    </div>
                                                    {user.studentId && (
                                                        <div className="space-y-2">
                                                            <Label className="text-sm text-muted-foreground flex items-center gap-2">
                                                                <Hash className="h-4 w-4" />
                                                                Mã học sinh
                                                            </Label>
                                                            <p className="px-3 py-2 rounded-md bg-muted/40 text-foreground font-medium text-sm">
                                                                #{user.studentId}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Payment Info Section - Only for TUTOR and ADMIN */}
                                            {user.role !== 'STUDENT' && (
                                            <div className="border-t border-border/60 pt-8 space-y-6">
                                                <div>
                                                    <h4 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                                                        <CreditCard className="h-5 w-5 text-primary" />
                                                        Thông tin thanh toán
                                                    </h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Thông tin này sẽ được sử dụng để cá nhân hóa báo giá gửi đến học sinh.
                                                    </p>
                                                </div>

                                                <div className="grid gap-6 sm:grid-cols-2 max-w-2xl xl:max-w-3xl">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="bankSelect" className="text-sm font-medium flex items-center gap-2">
                                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                                            Chọn ngân hàng
                                                        </Label>
                                                        <Select
                                                            value={selectedBankCode}
                                                            onValueChange={(value) => {
                                                                const bank = VIETNAM_BANKS.find(b => b.code === value);
                                                                if (bank) {
                                                                    setValue('bankCode', bank.code);
                                                                    setValue('bankName', bank.shortName);
                                                                }
                                                            }}
                                                            disabled={isSaving}
                                                        >
                                                            <SelectTrigger id="bankSelect" className={cn(
                                                                'h-11',
                                                                errors.bankCode && 'border-destructive'
                                                            )}>
                                                                <SelectValue placeholder="Chọn ngân hàng của bạn" />
                                                            </SelectTrigger>
                                                            <SelectContent className="max-h-[300px]">
                                                                {VIETNAM_BANKS.map((bank) => (
                                                                    <SelectItem key={bank.code} value={bank.code}>
                                                                        <div className="flex flex-col text-left">
                                                                            <span className="font-medium">{bank.shortName}</span>
                                                                            <span className="text-[10px] text-muted-foreground line-clamp-1">{bank.name}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        {errors.bankCode && (
                                                            <p className="text-xs font-medium text-destructive mt-1">
                                                                {errors.bankCode.message}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2">
                                                        <Label htmlFor="accountNumber" className="text-sm font-medium flex items-center gap-2">
                                                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                                                            Số tài khoản
                                                        </Label>
                                                        <Input
                                                            id="accountNumber"
                                                            {...register('accountNumber')}
                                                            placeholder="Nhập số tài khoản"
                                                            className={cn(
                                                                'h-11',
                                                                errors.accountNumber && 'border-destructive focus-visible:ring-destructive'
                                                            )}
                                                            disabled={isSaving}
                                                        />
                                                        {errors.accountNumber && (
                                                            <p className="text-xs font-medium text-destructive mt-1">
                                                                {errors.accountNumber.message}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="sm:col-span-2 space-y-2">
                                                        <Label htmlFor="accountName" className="text-sm font-medium flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            Tên chủ tài khoản
                                                        </Label>
                                                        <Input
                                                            id="accountName"
                                                            {...register('accountName', {
                                                                onChange: (e) => {
                                                                    e.target.value = e.target.value.toUpperCase();
                                                                }
                                                            })}
                                                            placeholder="Nhập tên chủ tài khoản (viết hoa không dấu)"
                                                            className={cn(
                                                                'h-11',
                                                                errors.accountName && 'border-destructive focus-visible:ring-destructive'
                                                            )}
                                                            disabled={isSaving}
                                                        />
                                                        {errors.accountName && (
                                                            <p className="text-xs font-medium text-destructive mt-1">
                                                                {errors.accountName.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            )}

                                            <div className="pt-4">
                                                <Button
                                                    type="submit"
                                                    className="h-11 px-8 font-medium"
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Đang lưu...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Save className="mr-2 h-4 w-4" />
                                                            Lưu thay đổi
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'password' && (
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                                    Đổi mật khẩu
                                </h3>
                                <p className="text-muted-foreground mt-1">
                                    Cập nhật mật khẩu đăng nhập của bạn
                                </p>
                            </div>
                            <div className="border-t border-border/60 pt-8">
                                <PasswordChangeForm
                                    onSubmit={handlePasswordChange}
                                    isLoading={isChangingPassword}
                                />
                            </div>
                        </div>
                    )}

                    {activeSection === 'notifications' && (
                        <div className="space-y-10">
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight text-foreground">
                                    Thông báo
                                </h3>
                                <p className="text-muted-foreground mt-1">
                                    Tùy chọn nhận thông báo (tính năng đang phát triển)
                                </p>
                            </div>
                            <div className="border-t border-border/60 pt-8">
                                <p className="text-sm text-muted-foreground">Cài đặt thông báo sẽ được bổ sung sau.</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
