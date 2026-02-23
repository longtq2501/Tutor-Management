'use client';

import { ModeToggle } from '@/components/shared/ModeToggle';
import { AdminSidebar } from './AdminSidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen admin-theme bg-[var(--admin-bg)] text-[var(--admin-text)]">
            <AdminSidebar collapsed={false} mobileOpen={false} onCloseMobile={function (): void {
                throw new Error('Function not implemented.');
            }} onToggleCollapse={function (): void {
                throw new Error('Function not implemented.');
            }} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <h1 className="font-bold tracking-tight">ADMIN PANEL</h1>
                        <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] font-mono text-slate-400 uppercase tracking-widest">v1.0.0</span>
                    </div>
                    <ModeToggle />
                </header>
                <main className="flex-1 overflow-auto p-8 bg-slate-900/50">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
