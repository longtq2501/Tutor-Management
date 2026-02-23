import ProtectedRoute from '@/components/shared/ProtectedRoute';
import { AdminShell } from '@/components/admin/AdminShell';
import './admin.css';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute requiredRoles={['ADMIN']}>
            <AdminShell>{children}</AdminShell>
        </ProtectedRoute>
    );
}

