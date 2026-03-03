'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    GraduationCap,
    Calendar,
    FolderClosed,
    Settings,
    ShieldCheck,
    History,
    ChevronLeft,
    ChevronRight,
    Tornado,
    UserCog
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const navSections: NavSection[] = [
    {
        title: 'Hệ Thống',
        items: [
            { label: 'Overview', href: '/overview', icon: LayoutDashboard },
        ]
    },
    {
        title: 'Quản Lý',
        items: [
            { label: 'Gia Sư', href: '/tutors', icon: Users },
            { label: 'Học Sinh', href: '/students', icon: GraduationCap },
            { label: 'Người Dùng', href: '/users', icon: UserCog },
            { label: 'Lịch Dạy', href: '/sessions', icon: Calendar },
            { label: 'Tài Liệu', href: '/documents', icon: FolderClosed },
        ]
    },
    {
        title: 'Bảo Mật & Hệ Thống',
        items: [
            { label: 'Phân Quyền', href: '/permissions', icon: ShieldCheck },
            { label: 'Nhật Ký Hoạt Động', href: '/audit-logs', icon: History },
            { label: 'Cài Đặt', href: '/system', icon: Settings },
        ]
    }
];

interface AdminSidebarProps {
    collapsed: boolean;
    mobileOpen: boolean;
    onCloseMobile: () => void;
    onToggleCollapse: () => void;
}

export function AdminSidebar({
    collapsed,
    onToggleCollapse,
    mobileOpen,
    onCloseMobile
}: AdminSidebarProps) {
    const pathname = usePathname();

    const SidebarContent = (
        <div className="flex flex-col h-full bg-[var(--admin-surface)] border-r border-[var(--admin-border)] transition-all duration-300">
            {/* Logo area */}
            <div className="h-[52px] px-4 flex items-center justify-between border-b border-[var(--admin-border)]">
                <div className={`flex items-center gap-3 overflow-hidden ${collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'} transition-all`}>
                    <Tornado className="h-6 w-6 text-[var(--admin-accent)] shrink-0" />
                    <span className="font-black text-lg tracking-tighter whitespace-nowrap">TUTOR <span className="text-[var(--admin-accent)]">PRO</span></span>
                </div>
                {collapsed && (
                    <Tornado className="h-6 w-6 text-[var(--admin-accent)] mx-auto" />
                )}

                <button
                    onClick={onToggleCollapse}
                    className="hidden lg:flex h-6 w-6 rounded-md bg-[var(--admin-surface2)] border border-[var(--admin-border)] items-center justify-center hover:text-[var(--admin-accent)] transition-colors"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Navigation links */}
            <div className="flex-1 overflow-y-auto py-4 px-2 custom-scrollbar">
                <TooltipProvider delayDuration={0}>
                    {navSections.map((section, sIdx) => (
                        <div key={sIdx} className="mb-6 last:mb-0">
                            {!collapsed && (
                                <h3 className="px-3 text-[10px] font-bold text-[var(--admin-text3)] uppercase tracking-[0.2em] mb-3">
                                    {section.title}
                                </h3>
                            )}
                            {collapsed && (
                                <div className="h-px bg-[var(--admin-border)] mx-2 mb-3" />
                            )}
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                    const Icon = item.icon;

                                    return (
                                        <Tooltip key={item.href}>
                                            <TooltipTrigger asChild>
                                                <Link
                                                    href={item.href}
                                                    onClick={onCloseMobile}
                                                    className={`
                                                        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative
                                                        ${isActive
                                                            ? 'bg-[var(--admin-accent)] text-white shadow-lg shadow-[var(--admin-accent)]/20'
                                                            : 'text-[var(--admin-text2)] hover:bg-[var(--admin-surface2)] hover:text-[var(--admin-text)]'
                                                        }
                                                    `}
                                                >
                                                    <Icon className={`h-5 w-5 shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
                                                    {!collapsed && (
                                                        <span className="text-sm font-medium tracking-tight whitespace-nowrap overflow-hidden">
                                                            {item.label}
                                                        </span>
                                                    )}
                                                    {isActive && collapsed && (
                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                                                    )}
                                                </Link>
                                            </TooltipTrigger>
                                            {collapsed && (
                                                <TooltipContent side="right" className="bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text)] font-semibold">
                                                    {item.label}
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </TooltipProvider>
            </div>

            {/* Bottom Footer */}
            {!collapsed && (
                <div className="p-4 border-t border-[var(--admin-border)] flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-[var(--admin-text3)]">VERSION 1.0.0</p>
                    <p className="text-[10px] text-[var(--admin-text3)] whitespace-nowrap">&copy; 2026 Tutor Management</p>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className={`fixed top-0 left-0 bottom-0 z-50 hidden lg:block transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
                {SidebarContent}
            </aside>

            {/* Mobile Sidebar */}
            <aside className={`fixed top-0 left-0 bottom-0 z-50 w-64 transform lg:hidden transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {SidebarContent}
            </aside>
        </>
    );
}
