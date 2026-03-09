'use client';

import { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../services/notification';
import { useSSE } from '../hooks/useSSE';
import { toast } from 'sonner';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationList } from './NotificationList';

/**
 * UI Component for the notification bell icon.
 * 
 * Displays an unread count badge and triggers a popover with the detailed
 * notification list. Subscribes to real-time updates via SSE.
 */
export const NotificationBell = () => {
    const queryClient = useQueryClient();

    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: notificationService.getUnreadCount,
        refetchInterval: 60000, // Poll every minute as fallback
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNotification = useCallback((notification: any) => {
        console.debug('SSE Notification received:', notification);
        // Invalidate both count and list to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['notifications'] });

        // Show toast
        toast.info(notification.title, {
            description: notification.content,
        });
    }, [queryClient]);

    const markAllAsReadMutation = useMutation({
        mutationFn: notificationService.markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    return (
        <Popover onOpenChange={(open) => open && markAllAsReadMutation.mutate()}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9 lg:h-10 lg:w-10 rounded-full">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold border-2 border-background"
                            variant="destructive"
                        >
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 sm:w-96 p-0 mr-4 border-muted shadow-2xl" align="end">
                <NotificationList />
            </PopoverContent>
        </Popover>
    );
};
