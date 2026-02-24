import { DashboardHeader } from '@/contexts/UIContext';
import { RoleManager } from '@/features/admin/roles/RoleManager';

export default function PermissionsPage() {
    return (
        <div className="space-y-6 p-6">
            <DashboardHeader
                title="Phân quyền & Vai trò"
                subtitle="Thiết lập quyền hạn cụ thể cho từng vai trò người dùng trong hệ thống."
            />
            <RoleManager />
        </div>
    );
}
