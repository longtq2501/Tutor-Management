'use client';

import {
    Search,
    Bell,
    ChevronRight,
    User,
    LogOut,
    Camera,
    Menu
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ModeToggle } from '@/components/shared/ModeToggle';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

const routeMap: Record<string, string> = {
    '/overview': 'Overview',
    '/tutors': 'Gia Sư',
    '/students': 'Học Sinh',
    '/sessions': 'Lịch Dạy',
    '/documents': 'Tài Liệu',
    '/system': 'Hệ Thống',
    '/permissions': 'Phân Quyền',
    '/audit': 'Audit Logs',
    '/settings': 'Cài Đặt',
};

export function AdminTopNav({ onMenuClick }: { onMenuClick?: () => void }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout, updateAvatar } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const currentPage = routeMap[pathname] || 'Dashboard';

    const handleAvatarClick = () => {
        if (isUploading) return;
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Vui lòng chọn file ảnh hợp lệ');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File ảnh không được vượt quá 5MB');
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading('Đang tải ảnh lên...');
        try {
            await updateAvatar(file);
            toast.success('Cập nhật ảnh đại diện thành công', { id: toastId });
        } catch (error) {
            console.error('Avatar upload failed:', error);
            toast.error('Cập nhật ảnh đại diện thất bại', { id: toastId });
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push('/login');
            toast.success('Đã đăng xuất');
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error('Đăng xuất thất bại');
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 lg:left-16 h-[52px] admin-glass z-40 px-4 lg:px-6 flex items-center justify-between">
            {/* Left: Mobile Menu + Breadcrumb */}
            <div className="flex items-center gap-3">
                {/* Hamburger — mobile only */}
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 text-[var(--admin-text3)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface2)] rounded-lg transition-all"
                    aria-label="Mở menu"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2 text-xs font-medium">
                    <span className="text-[var(--admin-text3)] uppercase tracking-wider hidden sm:inline">Admin</span>
                    <ChevronRight className="h-3 w-3 text-[var(--admin-text3)] hidden sm:inline" />
                    <span className="text-[var(--admin-text)]">{currentPage}</span>
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-6">
                {/* Search Bar - UI Only */}
                <div className="relative group hidden md:block">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="h-3.5 w-3.5 text-[var(--admin-text3)] group-focus-within:text-[var(--admin-accent)] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm nhanh..."
                        className="w-64 h-8 bg-[var(--admin-surface2)] border border-[var(--admin-border)] rounded-lg pl-9 pr-12 text-xs text-[var(--admin-text)] focus:outline-none focus:border-[var(--admin-accent)] focus:ring-1 focus:ring-[var(--admin-accent-dim)] transition-all"
                        readOnly
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                        <kbd className="h-5 px-1.5 bg-[var(--admin-surface3)] border border-[var(--admin-border2)] rounded text-[10px] text-[var(--admin-text3)] font-sans">
                            ⌘K
                        </kbd>
                    </div>
                </div>

                {/* Theme Toggle */}
                <ModeToggle />

                {/* Notifications */}
                <button className="relative p-1.5 text-[var(--admin-text3)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface2)] rounded-lg transition-all">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--admin-accent)] rounded-full border-2 border-[var(--admin-surface)]" />
                </button>

                {/* Avatar with Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 pl-2 border-l border-[var(--admin-border)] hover:opacity-80 transition-opacity">
                            <Avatar className="h-8 w-8 rounded-lg border border-[var(--admin-accent)]/30">
                                <AvatarImage src={user?.avatarUrl} alt={user?.fullName} className="object-cover" />
                                <AvatarFallback className="bg-[var(--admin-accent-dim)] text-[var(--admin-accent)] text-xs font-bold">
                                    {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || <User className="h-4 w-4" />}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[var(--admin-surface)] border border-[var(--admin-border)] shadow-xl p-1">
                        <DropdownMenuLabel className="flex flex-col gap-1 px-3 py-3 border-b border-[var(--admin-border)] mb-1">
                            <p className="text-sm font-semibold text-[var(--admin-text)] leading-none">{user?.fullName || 'User'}</p>
                            <p className="text-[10px] text-[var(--admin-text3)] truncate mt-1">{user?.email || ''}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={handleAvatarClick}
                            disabled={isUploading}
                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg text-[var(--admin-text2)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface2)] focus:bg-[var(--admin-surface2)] focus:text-[var(--admin-text)] transition-all disabled:opacity-50"
                        >
                            <Camera className="h-4 w-4 shrink-0" />
                            <span className="text-xs font-bold">Đổi ảnh đại diện</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[var(--admin-border)] my-1" />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg text-red-500 hover:text-white hover:bg-red-500 focus:bg-red-500 focus:text-white transition-all"
                        >
                            <LogOut className="h-4 w-4 shrink-0" />
                            <span className="text-xs font-bold">Đăng xuất</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Hidden File Input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                />
            </div>
        </header>
    );
}
