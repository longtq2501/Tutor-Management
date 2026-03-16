'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Bell } from 'lucide-react';
import { notificationService } from '../services/notification';
import { NotificationIcon } from './NotificationIcon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';


/**
 * Displays a scrollable list of system notifications.
 * 
 * Includes functionality to mark individual items or all items as read,
 * with real-time state synchronization via React Query.
 */
export const NotificationList = () => {
    const queryClient = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications', 'list'],
        queryFn: notificationService.getNotifications,
    });

    const markAsReadMutation = useMutation({
        mutationFn: notificationService.markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllAsReadMutation = useMutation({
        mutationFn: notificationService.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    /**
     * Helper to format the relative time of a notification.
     */
    const getFormattedTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        if (date > now) return 'vừa xong';
        return formatDistanceToNow(date, { addSuffix: true, locale: vi });
    };

    if (isLoading) {
        return (
            <div className="space-y-4 p-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const hasUnread = notifications.some(notification => !notification.isRead);

    return (
        <div className="flex flex-col h-[450px] w-full bg-popover text-popover-foreground rounded-2xl border-2 border-border/80 shadow-xl overflow-hidden">
            {/* Header section with bulk action */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border/80 shrink-0 bg-background/80 backdrop-blur-sm">
                <h3 className="font-bold text-sm flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    Thông báo
                </h3>
                {hasUnread && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-primary hover:text-primary/80 px-2 font-medium"
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={markAllAsReadMutation.isPending}
                    >
                        Đánh dấu tất cả đã đọc
                    </Button>
                )}
            </div>

            <ScrollArea className="flex-1 overflow-y-auto bg-muted/20">
                <div className="p-2 space-y-2">
                    {notifications.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
                            <div className="h-14 w-14 rounded-full border-2 border-dashed border-border flex items-center justify-center bg-background/60">
                                <Bell className="h-7 w-7 opacity-30" />
                            </div>
                            Không có thông báo nào mới
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={cn(
                                    "p-4 flex items-start gap-4 rounded-xl border-2 transition-all duration-200 cursor-pointer relative",
                                    "hover:-translate-y-[1px] hover:shadow-sm",
                                    notification.isRead
                                        ? "border-border/70 bg-background/70 hover:bg-background"
                                        : "bg-primary/5 border-primary/40 hover:bg-primary/10"
                                )}
                                onClick={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
                            >
                                <div className="mt-1 shrink-0 p-2 rounded-full bg-background border-2 border-border/70 shadow-sm">
                                    <NotificationIcon type={notification.type} />
                                </div>
                                <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className={cn(
                                            "text-sm font-semibold leading-tight",
                                            !notification.isRead ? "text-foreground" : "text-muted-foreground"
                                        )}>
                                            {notification.title}
                                        </p>
                                        {!notification.isRead && (
                                            <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                        {notification.content}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground pt-1 flex items-center gap-1 font-medium italic">
                                        {getFormattedTime(notification.createdAt)}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
