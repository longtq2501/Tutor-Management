'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SessionManagerProps {
    children: React.ReactNode;
}

// Configuration: Times in milliseconds
const WARNING_TIME = 25 * 60 * 1000; // 25 minutes
const LOGOUT_TIME = 30 * 60 * 1000;  // 30 minutes
const CHECK_INTERVAL = 60 * 1000;    // 1 minute

export const SessionManager: React.FC<SessionManagerProps> = ({ children }) => {
    const router = useRouter();
    const [lastActivity, setLastActivity] = useState<number>(Date.now());
    const [showWarning, setShowWarning] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const handleLogout = useCallback(() => {
        // Clear storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        setShowWarning(false);
        router.push('/login');
        toast.info('Phiên đăng nhập đã hết hạn do bạn không hoạt động.');
    }, [router]);

    const resetInactivityTimer = useCallback(() => {
        setLastActivity(Date.now());
        if (showWarning) {
            setShowWarning(false);
        }
    }, [showWarning]);

    useEffect(() => {
        // Events to track user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

        const handleUserActivity = () => {
            resetInactivityTimer();
        };

        events.forEach(event => {
            window.addEventListener(event, handleUserActivity);
        });

        // Periodic check for inactivity
        intervalRef.current = setInterval(() => {
            const now = Date.now();
            const elapsed = now - lastActivity;

            if (elapsed >= LOGOUT_TIME) {
                handleLogout();
            } else if (elapsed >= WARNING_TIME && !showWarning) {
                setShowWarning(true);
            }
        }, CHECK_INTERVAL);

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleUserActivity);
            });
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [lastActivity, handleLogout, resetInactivityTimer, showWarning]);

    return (
        <>
            {children}

            <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Phiên đăng nhập sắp hết hạn</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn đã không hoạt động trong một thời gian dài.
                            Bạn sẽ được đăng xuất tự động sau 5 phút nữa để bảo mật tài khoản.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={resetInactivityTimer}>
                            Tiếp tục phiên làm việc
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
