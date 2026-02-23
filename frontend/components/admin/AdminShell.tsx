'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopNav } from './AdminTopNav';

const SIDEBAR_STORAGE_KEY = 'admin-sidebar-collapsed';

interface AdminShellProps {
    children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
    const pathname = usePathname();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (stored !== null) {
            setIsSidebarCollapsed(stored === '1');
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem(SIDEBAR_STORAGE_KEY, isSidebarCollapsed ? '1' : '0');
    }, [isSidebarCollapsed, mounted]);

    const [lastPathname, setLastPathname] = useState(pathname);

    if (pathname !== lastPathname) {
        setLastPathname(pathname);
        setIsMobileSidebarOpen(false);
    }

    const toggleSidebar = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsMobileSidebarOpen((prev) => !prev);
            return;
        }
        setIsSidebarCollapsed((prev) => !prev);
    };

    const closeMobileSidebar = () => {
        setIsMobileSidebarOpen(false);
    };

    if (!mounted) {
        return <div className="admin-theme min-h-screen bg-[var(--admin-bg)]" />;
    }

    return (
        <div className="admin-theme min-h-screen bg-[var(--admin-bg)] transition-colors duration-300">
            <AdminSidebar
                collapsed={isSidebarCollapsed}
                mobileOpen={isMobileSidebarOpen}
                onCloseMobile={closeMobileSidebar}
                onToggleCollapse={toggleSidebar}
            />

            <div
                className={`flex flex-col flex-1 transition-[padding] duration-300 ${isSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
                    }`}
            >
                <AdminTopNav />

                <main className="mt-[52px] h-[calc(100vh-52px)] overflow-y-auto p-5 lg:p-8">
                    <div className="max-w-[1440px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
                    onClick={closeMobileSidebar}
                />
            )}
        </div>
    );
}
