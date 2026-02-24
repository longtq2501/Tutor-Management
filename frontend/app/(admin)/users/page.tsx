import { DashboardHeader } from '@/contexts/UIContext';
import { AdminUserList } from '@/features/admin/users/AdminUserList';

export default function UsersPage() {
    return (
        <div className="space-y-6 p-6">
            <DashboardHeader
                title="Quản lý Người dùng"
                subtitle="Quản lý tài khoản, vai trò và trạng thái hoạt động của người dùng trong hệ thống."
            />
            <AdminUserList />
        </div>
    );
}
