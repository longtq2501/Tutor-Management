'use client';

import { useUI } from '@/contexts/UIContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { ChevronLeft, GraduationCap } from 'lucide-react';
import React, { memo, useEffect, useState } from 'react';

// Types (Giữ nguyên)
export type View = 'dashboard' | 'students' | 'monthly' | 'documents' | 'parents' | 'unpaid' | 'calendar' | 'homework' | 'lessons' | 'exercises' | 'finance' | 'tutors' | 'live-room' | 'settings';
export type NavItem = { id: View; label: string; icon: React.ElementType };

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    navItems: NavItem[];
}

// Cấu hình Spring Animation cho cảm giác "Premium"
const SPRING_CONFIG = { type: "spring", stiffness: 300, damping: 30, mass: 1 } as const;

export const Sidebar = memo(({ currentView, setCurrentView, navItems }: SidebarProps) => {
    const { isSidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed } = useUI();
    const { user } = useAuth();
    const [isMobile, setIsMobile] = useState(false);
    const [isLargeDesktop, setIsLargeDesktop] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            const largeDesktop = window.innerWidth >= 1920;
            setIsMobile(mobile);
            setIsLargeDesktop(largeDesktop);
            if (!mobile && isSidebarOpen) setSidebarOpen(false);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [isSidebarOpen, setSidebarOpen]);

    const handleNavClick = (view: View) => {
        setCurrentView(view);
        if (isMobile) setSidebarOpen(false);
    };

    const effectiveCollapsed = isMobile ? false : isCollapsed;

    // Responsive widths: Smaller for laptop/tablet, larger for big desktop
    const expandedWidth = isLargeDesktop ? 280 : 220; // 220px for laptop, 280px for 29" desktop
    const collapsedWidth = isLargeDesktop ? 80 : 64;  // 64px for laptop, 80px for 29" desktop

    return (
        <>
            {/* Mobile Overlay - Làm mờ nền cực mượt */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSidebarOpen(false)}
                        className="fixed inset-0 bg-background/80 backdrop-blur-md z-[45] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <LayoutGroup>
                <motion.aside
                    layout
                    initial={false}
                    animate={{
                        width: effectiveCollapsed ? collapsedWidth : expandedWidth,
                        x: isMobile && !isSidebarOpen ? -expandedWidth : 0,
                    }}
                    transition={SPRING_CONFIG}
                    className={cn(
                        "fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-card border-r border-border shadow-sm",
                        "lg:sticky lg:h-screen", // Tối ưu cho Next.js Layout
                        effectiveCollapsed ? "items-center" : "items-stretch"
                    )}
                >
                    {/* Nút Toggle Desktop - Thiết kế Floating độc đáo */}
                    {!isMobile && (
                        <motion.button
                            layout
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="absolute -right-3 top-10 h-6 w-6 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-xl hover:scale-110 transition-transform z-50"
                        >
                            <motion.div animate={{ rotate: effectiveCollapsed ? 180 : 0 }} transition={SPRING_CONFIG}>
                                <ChevronLeft size={14} strokeWidth={3} />
                            </motion.div>
                        </motion.button>
                    )}

                    {/* Logo Header - Smooth Scaling */}
                    <div className="h-20 flex items-center px-6 mb-2 overflow-hidden shrink-0">
                        <div className="flex items-center gap-4 min-w-max">
                            <motion.div
                                layout
                                className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-xl text-primary"
                            >
                                <GraduationCap size={24} />
                            </motion.div>

                            {!effectiveCollapsed && (
                                <motion.span
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="font-bold text-xl tracking-tight whitespace-nowrap"
                                >
                                    Tutor Pro
                                </motion.span>
                            )}
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar">
                        {navItems.map((item) => {
                            const isActive = currentView === item.id;
                            const Icon = item.icon;

                            return (
                                <motion.button
                                    key={item.id}
                                    layout
                                    onClick={() => handleNavClick(item.id)}
                                    className={cn(
                                        "relative flex items-center w-full rounded-2xl transition-colors group h-14",
                                        isActive ? "text-primary" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                                        // Khi đóng: w-14 h-14 tạo thành hình vuông. Khi mở: px-4 và w-full
                                        effectiveCollapsed ? "justify-center w-14 mx-auto" : "px-4 w-full"
                                    )}
                                >
                                    {/* Active Indicator Background */}
                                    <AnimatePresence>
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-bg"
                                                // Sử dụng inset-1.5 để tạo khoảng cách đều 4 cạnh
                                                className="absolute inset-1.5 bg-primary/10 rounded-xl z-0"
                                                transition={SPRING_CONFIG}
                                            />
                                        )}
                                    </AnimatePresence>

                                    {/* Icon Container - Đảm bảo luôn nằm giữa và không bị méo */}
                                    <motion.div
                                        layout="position"
                                        className="relative z-10 flex justify-center items-center shrink-0"
                                        style={{ width: 24, height: 24 }} // Cố định khung icon
                                    >
                                        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    </motion.div>

                                    {/* Label */}
                                    <AnimatePresence mode="popLayout">
                                        {!effectiveCollapsed && (
                                            <motion.span
                                                layout="position"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                                className="relative z-10 ml-4 font-semibold whitespace-nowrap overflow-hidden"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </motion.button>
                            );
                        })}
                    </nav>

                    {/* Footer / Profile slot (hiện tại bỏ trống để tránh UI dư thừa) */}
                    <div className="mt-auto p-4 border-t border-border" />
                </motion.aside>
            </LayoutGroup>
        </>
    );
});

Sidebar.displayName = 'Sidebar';