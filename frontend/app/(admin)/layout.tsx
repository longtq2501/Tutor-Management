import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { AdminShell } from '@/components/admin/AdminShell';
import { UIProvider } from '@/contexts/UIContext';
import './admin.css';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRoles={['ADMIN']}>
            <UIProvider>
                <AdminShell>{children}</AdminShell>
            </UIProvider>
        </ProtectedRoute>
    );
}

