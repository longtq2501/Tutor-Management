'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface UIContextType {
    isSidebarOpen: boolean;
    setSidebarOpen: (isOpen: boolean) => void;
    isCollapsed: boolean;
    setIsCollapsed: (isCollapsed: boolean) => void;
    activeDialogs: number;
    openDialog: () => void;
    closeDialog: () => void;
    // Dynamic Header
    headerTitle: string;
    setHeaderTitle: (title: string) => void;
    headerSubtitle: string | null;
    setHeaderSubtitle: (subtitle: string | null) => void;
    headerActions: React.ReactNode | null;
    setHeaderActions: (actions: React.ReactNode | null) => void;
    // Portal Slots
    titleSlot: HTMLElement | null;
    setTitleSlot: (slot: HTMLElement | null) => void;
    actionsSlot: HTMLElement | null;
    setActionsSlot: (slot: HTMLElement | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeDialogs, setActiveDialogs] = useState(0);

    const openDialog = () => setActiveDialogs(prev => prev + 1);
    const closeDialog = () => setActiveDialogs(prev => Math.max(0, prev - 1));

    // Update global CSS variable for sidebar width
    React.useEffect(() => {
        const handleResize = () => {
            const isLargeDesktop = window.innerWidth >= 1920;
            const isMobile = window.innerWidth < 1024;

            let width = 0;
            if (isMobile) {
                width = 0;
            } else if (isCollapsed) {
                width = isLargeDesktop ? 80 : 64;
            } else {
                width = isLargeDesktop ? 280 : 220;
            }
            document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isCollapsed]);

    // Portal Slots for Header
    const [titleSlot, setTitleSlot] = useState<HTMLElement | null>(null);
    const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);

    return (
        <UIContext.Provider value={{
            isSidebarOpen,
            setSidebarOpen,
            isCollapsed,
            setIsCollapsed,
            activeDialogs,
            openDialog,
            closeDialog,
            headerTitle: '', // Deprecated
            setHeaderTitle: () => { }, // Deprecated
            headerSubtitle: null, // Deprecated
            setHeaderSubtitle: () => { }, // Deprecated
            headerActions: null, // Deprecated
            setHeaderActions: () => { }, // Deprecated
            titleSlot,
            setTitleSlot,
            actionsSlot,
            setActionsSlot
        }}>
            {children}
        </UIContext.Provider>
    );
}

export function useUI() {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
}

/**
 * Slot component placed in the layout where features will inject their content
 */
export function HeaderSlot({ id }: { id: 'title' | 'actions' }) {
    const { setTitleSlot, setActionsSlot } = useUI();
    return (
        <div
            ref={(el) => {
                if (id === 'title') setTitleSlot(el);
                if (id === 'actions') setActionsSlot(el);
            }}
            className="h-full min-w-0"
        />
    );
}

/**
 * Portal component used by features to inject content into the layout slots
 */
export function HeaderPortal({ children, to }: { children: React.ReactNode; to: 'title' | 'actions' }) {
    const { titleSlot, actionsSlot } = useUI();
    const slot = to === 'title' ? titleSlot : actionsSlot;

    if (!slot) return null;
    return createPortal(children, slot);
}

/**
 * Component to be used by features to project their header content into the layout
 */
export function DashboardHeader({ title, subtitle, actions }: { title: string; subtitle?: string | null; actions?: React.ReactNode }) {
    return (
        <>
            <HeaderPortal to="title">
                <div className="flex-1 min-w-[120px] sm:min-w-[180px] animate-in fade-in slide-in-from-left-4 duration-500 py-1">
                    <h1 className="text-lg sm:text-xl lg:text-2xl 2xl:text-4xl 3xl:text-6xl font-black tracking-tight leading-[1.1] bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent break-words sm:whitespace-normal">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[10px] sm:text-xs lg:text-sm 2xl:text-lg 3xl:text-2xl text-muted-foreground mt-0.5 sm:mt-1 max-w-2xl 2xl:max-w-4xl font-medium line-clamp-1 sm:line-clamp-none opacity-80">
                            {subtitle}
                        </p>
                    )}
                </div>
            </HeaderPortal>
            {actions && (
                <HeaderPortal to="actions">
                    <div className="flex items-center justify-end gap-1.5 sm:gap-3 animate-in fade-in slide-in-from-right-4 duration-500 w-auto min-w-0 flex-shrink-1">
                        {actions}
                    </div>
                </HeaderPortal>
            )}
        </>
    );
}

// Keep useHeader for backward compatibility but mark as deprecated
export function useHeader() {
    // This is now handled by DashboardHeader component using Portals
}
