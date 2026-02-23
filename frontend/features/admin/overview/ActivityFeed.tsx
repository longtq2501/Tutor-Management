'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    UserPlus,
    Crown,
    FileUp,
    Lock,
    CreditCard,
    AlertCircle
} from 'lucide-react';
import { adminStatsApi } from '@/lib/services/admin-stats';
import type { ActivityLog } from '@/lib/types/admin';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const activityConfig: Record<string, { icon: React.ElementType; color: string }> = {
    'TUTOR_REGISTER': { icon: UserPlus, color: 'var(--admin-green)' },
    'TUTOR_TIER_UPGRADE': { icon: Crown, color: 'var(--admin-accent)' },
    'TUTOR_STATUS_TOGGLE': { icon: Lock, color: 'var(--admin-red)' },
    'DOCUMENT_UPLOAD': { icon: FileUp, color: 'var(--admin-accent)' },
    'PAYMENT_CONFIRMED': { icon: CreditCard, color: 'var(--admin-green)' },
    'DEFAULT': { icon: AlertCircle, color: 'var(--admin-text3)' }
};

export function ActivityFeed() {
    const router = useRouter();
    const [activities, setActivities] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    const handleViewAllActivity = () => {
        router.push('/system');
    };

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const data = await adminStatsApi.getActivityLog(0, 5);
                setActivities(data.content);
            } catch (error) {
                console.error('Failed to fetch activities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    return (
        <div className="flex-1 bg-[var(--admin-surface)] border border-[var(--admin-border)] rounded-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-[var(--admin-border)]">
                <h3 className="text-lg font-bold text-[var(--admin-text)]">Hoạt Động Gần Đây</h3>
                <p className="text-xs text-[var(--admin-text3)] uppercase tracking-widest font-medium">Nhật ký hệ thống</p>
            </div>

            <div className="flex flex-col flex-1 divide-y divide-[var(--admin-border)]">
                {loading ? (
                    <div className="p-8 text-center text-xs text-[var(--admin-text3)]">Đang tải hoạt động...</div>
                ) : activities.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[var(--admin-text3)]">Chưa có hoạt động nào.</div>
                ) : (
                    activities.map((activity) => {
                        const config = activityConfig[activity.type] || activityConfig['DEFAULT'];
                        const Icon = config.icon;

                        return (
                            <div key={activity.id} className="p-4 flex items-start gap-4 hover:bg-[var(--admin-surface2)]/30 transition-colors group">
                                <div
                                    className="p-2 rounded-lg bg-[var(--admin-surface2)] group-hover:scale-110 transition-transform"
                                    style={{ color: config.color }}
                                >
                                    <Icon className="h-4 w-4" />
                                </div>

                                <div className="flex flex-col gap-1 flex-1">
                                    <p className="text-xs font-medium text-[var(--admin-text2)] leading-tight">
                                        {activity.description}
                                    </p>
                                    <span className="text-[10px] text-[var(--admin-text3)] font-medium">
                                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: vi })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-4 border-t border-[var(--admin-border)] bg-[var(--admin-surface2)]/30">
                <button
                    onClick={handleViewAllActivity}
                    className="w-full text-[10px] font-bold text-[var(--admin-accent)] hover:text-[var(--admin-accent)]/80 uppercase tracking-widest transition-colors"
                >
                    Xem tất cả hoạt động
                </button>
            </div>
        </div>
    );
}
