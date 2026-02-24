import { DashboardHeader } from '@/contexts/UIContext';
import { AdminUsersList } from '@/features/admin/users/AdminUsersList';

export default function UsersPage() {
    return (
        <div className="space-y-6 p-6">
            <DashboardHeader
                title="Người Dùng"
                subtitle="Quản lý tài khoản, vai trò và trạng thái hoạt động của người dùng trong hệ thống."
            />
            <AdminUsersList />
        </div>
    );
}
