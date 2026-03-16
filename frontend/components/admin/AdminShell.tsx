'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopNav } from './AdminTopNav';

const SIDEBAR_STORAGE_KEY = 'admin-sidebar-collapsed';

interface AdminShellProps {
    children: React.ReactNode;
}

/** Syncs `data-admin-theme` on <html> with the current dark/light class
 *  so `admin.css` CSS variable overrides activate correctly. */
function useAdminThemeSync() {
    useEffect(() => {
        const apply = () => {
            const isDark = document.documentElement.classList.contains('dark');
            document.documentElement.setAttribute('data-admin-theme', isDark ? 'dark' : 'light');
        };

        // Apply on mount
        apply();

        // Watch for class changes from ModeToggle
        const observer = new MutationObserver(apply);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        return () => {
            observer.disconnect();
            document.documentElement.removeAttribute('data-admin-theme');
        };
    }, []);
}

export function AdminShell({ children }: AdminShellProps) {
    const pathname = usePathname();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useAdminThemeSync();

    useEffect(() => {
        setMounted(prev => prev !== true ? true : prev);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (stored !== null) {
            const shouldCollapse = stored === '1';
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsSidebarCollapsed(prev => prev !== shouldCollapse ? shouldCollapse : prev);
        }
    }, [mounted]);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem(SIDEBAR_STORAGE_KEY, isSidebarCollapsed ? '1' : '0');
    }, [isSidebarCollapsed, mounted]);

    const [lastPathname, setLastPathname] = useState(pathname);

    useEffect(() => {
        if (pathname !== lastPathname) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLastPathname(pathname);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsMobileSidebarOpen(prev => prev !== false ? false : prev);
        }
    }, [pathname, lastPathname]);

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
                <AdminTopNav onMenuClick={toggleSidebar} />

                <main className="mt-[52px] h-[calc(100vh-52px)] overflow-y-auto overflow-x-hidden p-5 lg:p-8">
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
