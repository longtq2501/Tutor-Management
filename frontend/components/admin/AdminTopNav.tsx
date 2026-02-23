'use client';

import {
    Search,
    Bell,
    ChevronRight,
    User,
    LogOut,
    Camera
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

export function AdminTopNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const currentPage = routeMap[pathname] || 'Dashboard';

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            // TODO: Implement avatar upload
            // const response = await authService.updateAvatar(file);
            // Update user context with new avatar URL
            console.log('Avatar upload:', file);
        } catch (error) {
            console.error('Avatar upload failed:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleLogout = async () => {
        try {
            logout();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <header className="fixed top-0 left-16 right-0 h-[52px] admin-glass z-40 px-6 flex items-center justify-between">
            {/* Left: Breadcrumb */}
            <div className="flex items-center gap-2 text-xs font-medium">
                <span className="text-[var(--admin-text3)] uppercase tracking-wider">Admin</span>
                <ChevronRight className="h-3 w-3 text-[var(--admin-text3)]" />
                <span className="text-[var(--admin-text)]">{currentPage}</span>
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
                            {user?.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={user.fullName}
                                    className="w-8 h-8 rounded-lg object-cover border border-[var(--admin-accent)]/30"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-[var(--admin-accent-dim)] border border-[var(--admin-accent)]/30 flex items-center justify-center text-[var(--admin-accent)] text-xs font-bold">
                                    {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || <User className="h-4 w-4" />}
                                </div>
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[var(--admin-surface)] border border-[var(--admin-border)]">
                        <DropdownMenuLabel className="flex flex-col gap-1 px-3 py-3 border-b border-[var(--admin-border)]">
                            <p className="text-sm font-semibold text-[var(--admin-text)]">{user?.fullName || 'User'}</p>
                            <p className="text-xs text-[var(--admin-text3)]">{user?.email || ''}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={handleAvatarClick}
                            disabled={isUploading}
                            className="flex items-center gap-3 px-3 py-2 cursor-pointer text-[var(--admin-text2)] hover:text-[var(--admin-text)] hover:bg-[var(--admin-surface2)] focus:bg-[var(--admin-surface2)] disabled:opacity-50"
                        >
                            <Camera className="h-4 w-4" />
                            <span className="text-sm text-[#fff]">Đổi avatar</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-[var(--admin-border)] my-1" />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-2 cursor-pointer text-[var(--admin-red)] hover:text-[var(--admin-red)] hover:bg-[var(--admin-red)]/10 focus:bg-[var(--admin-red)]/10"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm text-[#fff]">Đăng xuất</span>
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
