import { DashboardHeader } from '@/contexts/UIContext';
import { AuditLogViewer } from '@/features/admin/audit-logs/AuditLogViewer';

export default function AuditLogsPage() {
    return (
        <div className="space-y-6 p-6">
            <DashboardHeader
                title="Nhật ký Hoạt động"
                subtitle="Theo dõi và kiểm tra các thao tác quan trọng thực hiện bởi quản trị viên."
            />
            <AuditLogViewer />
        </div>
    );
}
