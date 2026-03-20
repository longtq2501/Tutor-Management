'use client';

import { useUI } from '@/contexts/UIContext';
import {
    getSidebarCollapsedWidth,
    getSidebarExpandedWidth,
    isMobileViewport,
    resolveSidebarDensity,
    SIDEBAR_DENSITY_PRESETS,
    type ResponsiveDensity,
} from '@/lib/ui/responsive';
import { cn } from '@/lib/utils';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { ChevronLeft, GraduationCap } from 'lucide-react';
import React, { memo, useEffect, useMemo, useState } from 'react';

// Types (Giữ nguyên)
export type View = 'dashboard' | 'students' | 'monthly' | 'documents' | 'parents' | 'unpaid' | 'calendar' | 'homework' | 'lessons' | 'exercises' | 'finance' | 'reports' | 'tutors' | 'live-room' | 'settings';
export type NavItem = { id: View; label: string; icon: React.ElementType };
type NavSection = 'hoc-vu' | 'giang-day' | 'danh-gia' | 'van-hanh' | 'khac';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    navItems: NavItem[];
    isLocked?: boolean;
}

// Cấu hình Spring Animation cho cảm giác "Premium"
const SPRING_CONFIG = { type: "spring", stiffness: 300, damping: 30, mass: 1 } as const;

const SECTION_ORDER: NavSection[] = ['van-hanh', 'hoc-vu', 'giang-day', 'danh-gia', 'khac'];

const SECTION_TITLES: Record<NavSection, string> = {
    'hoc-vu': 'HỌC VỤ',
    'giang-day': 'GIẢNG DẠY',
    'danh-gia': 'ĐÁNH GIÁ',
    'van-hanh': 'VẬN HÀNH',
    'khac': 'KHÁC',
};

const SECTION_BY_VIEW: Record<View, NavSection> = {
    students: 'hoc-vu',
    parents: 'hoc-vu',
    tutors: 'hoc-vu',
    'live-room': 'hoc-vu',

    lessons: 'giang-day',
    documents: 'giang-day',
    calendar: 'giang-day',
    homework: 'giang-day',

    exercises: 'danh-gia',
    reports: 'danh-gia',

    dashboard: 'van-hanh',
    finance: 'van-hanh',
    monthly: 'van-hanh',
    unpaid: 'van-hanh',
    settings: 'van-hanh',
};

export const Sidebar = memo(({ currentView, setCurrentView, navItems, isLocked = false }: SidebarProps) => {
    const { isSidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed } = useUI();
    const [isMobile, setIsMobile] = useState(false);
    const [viewportWidth, setViewportWidth] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);

    useEffect(() => {
        const checkMobile = () => {
            const mobile = isMobileViewport(window.innerWidth);
            setIsMobile(mobile);
            setViewportWidth(window.innerWidth);
            setViewportHeight(window.innerHeight);
            if (!mobile && isSidebarOpen) setSidebarOpen(false);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [isSidebarOpen, setSidebarOpen]);

    const handleNavClick = (view: View) => {
        if (isLocked) return;
        setCurrentView(view);
        if (isMobile) setSidebarOpen(false);
    };

    const effectiveCollapsed = isMobile ? false : isCollapsed;

    const getTourDataAttr = (view: View): string | undefined => {
        if (view === 'calendar') return 'nav-calendar';
        if (view === 'finance') return 'nav-finance';
        if (view === 'reports') return 'nav-reports';
        if (view === 'live-room') return 'nav-live-teaching';
        if (view === 'documents') return 'nav-materials';
        if (view === 'lessons') return 'nav-lecture';
        if (view === 'exercises') return 'nav-assessment';
        return undefined;
    };

    const groupedNavItems = useMemo(() => {
        return SECTION_ORDER
            .map((section) => ({
                section,
                title: SECTION_TITLES[section],
                items: navItems.filter((item) => (SECTION_BY_VIEW[item.id] ?? 'khac') === section),
            }))
            .filter((group) => group.items.length > 0);
    }, [navItems]);

    const responsiveConfig = useMemo(() => {
        const expandedWidth = getSidebarExpandedWidth(viewportWidth);
        const collapsedWidth = getSidebarCollapsedWidth(viewportWidth);
        const density: ResponsiveDensity = resolveSidebarDensity({
            itemCount: navItems.length,
            sectionCount: groupedNavItems.length,
            viewportHeight,
        });

        return {
            expandedWidth,
            collapsedWidth,
            density,
            ...SIDEBAR_DENSITY_PRESETS[density],
        };
    }, [groupedNavItems.length, navItems.length, viewportHeight, viewportWidth]);

    const renderNavButton = (item: NavItem) => {
        const isActive = currentView === item.id;
        const Icon = item.icon;

        return (
            <motion.button
                key={item.id}
                layout
                onClick={() => handleNavClick(item.id)}
                data-tour={getTourDataAttr(item.id)}
                className={cn(
                    "relative flex items-center w-full rounded-2xl transition-colors group",
                    responsiveConfig.navItemHeightClass,
                    isActive ? "text-primary" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                    effectiveCollapsed ? "justify-center w-14 mx-auto" : "px-4 w-full"
                )}
            >
                <AnimatePresence>
                    {isActive && (
                        <motion.div
                            layoutId="active-bg"
                            className="absolute inset-1.5 bg-primary/10 rounded-xl z-0"
                            transition={SPRING_CONFIG}
                        />
                    )}
                </AnimatePresence>

                <motion.div
                    layout="position"
                    className="relative z-10 flex justify-center items-center shrink-0"
                    style={{ width: 24, height: 24 }}
                >
                    <Icon size={responsiveConfig.iconSize} strokeWidth={isActive ? 2.5 : 2} />
                </motion.div>

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
    };

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
                        width: effectiveCollapsed ? responsiveConfig.collapsedWidth : responsiveConfig.expandedWidth,
                        x: isMobile && !isSidebarOpen ? -responsiveConfig.expandedWidth : 0,
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
                            disabled={isLocked}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="absolute -right-3 top-10 h-6 w-6 flex items-center justify-center bg-primary text-primary-foreground rounded-full shadow-xl hover:scale-110 transition-transform z-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <motion.div animate={{ rotate: effectiveCollapsed ? 180 : 0 }} transition={SPRING_CONFIG}>
                                <ChevronLeft size={14} strokeWidth={3} />
                            </motion.div>
                        </motion.button>
                    )}

                    {/* Logo Header - Smooth Scaling */}
                    <div className={cn('flex items-center overflow-hidden shrink-0', responsiveConfig.headerClass)}>
                        <div className="flex items-center gap-4 min-w-max">
                            <motion.div
                                layout
                                className="bg-primary/10 flex items-center justify-center rounded-xl text-primary"
                                style={{ width: responsiveConfig.logoBoxSize, height: responsiveConfig.logoBoxSize }}
                            >
                                <GraduationCap size={responsiveConfig.logoIconSize} />
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
                    <nav
                        data-tour="sidebar"
                        data-disabled={isLocked ? 'true' : 'false'}
                        className={cn(
                            'flex-1 px-3 overflow-y-auto no-scrollbar',
                            responsiveConfig.navVerticalPaddingClass,
                            isLocked && 'pointer-events-none'
                        )}
                    >
                        {effectiveCollapsed ? (
                            <div className="space-y-1">
                                {navItems.map((item) => renderNavButton(item))}
                            </div>
                        ) : (
                            <div className={cn(responsiveConfig.sectionGapClass, 'pb-2')}>
                                {groupedNavItems.map((group, index) => (
                                    <div key={group.section} className={cn(index > 0 && responsiveConfig.sectionTopPaddingClass, index > 0 && 'border-t border-border/70')}>
                                        <p className={cn('px-3 text-[11px] font-bold tracking-wider text-muted-foreground/70 uppercase', responsiveConfig.sectionTitlePaddingClass)}>
                                            {group.title}
                                        </p>
                                        <div className="space-y-1">
                                            {group.items.map((item) => renderNavButton(item))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </nav>

                    {/* Footer / Profile slot (hiện tại bỏ trống để tránh UI dư thừa) */}
                    <div className={cn('mt-auto border-t border-border', responsiveConfig.footerClass)} />
                </motion.aside>
            </LayoutGroup>
        </>
    );
});

Sidebar.displayName = 'Sidebar';