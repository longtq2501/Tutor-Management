'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Notification } from '../types';

const INITIAL_RECONNECT_INTERVAL = 2000;
const MAX_RECONNECT_INTERVAL = 30000;

interface UseSSEReturn {
    connected: boolean;
    error: string | null;
}

/**
 * Custom hook for establishing and managing a Server-Sent Events (SSE) connection.
 * 
 * Handles real-time notification streaming with automatic reconnection logic,
 * exponential backoff, and browser online-state detection.
 * 
 * @param onNotification Optional callback executed whenever a new notification is pushed.
 * @returns Connection state and any encountered errors.
 */
export const useSSE = (onNotification?: (notification: Notification) => void): UseSSEReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const retryAttemptsRef = useRef(0);

    /**
     * Initiates the SSE connection to the backend.
     */
    const establishConnection = useCallback(function doConnect() {
        if (typeof window === 'undefined') return;

        // Cleanup any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            setConnectionError('Authentication token missing');
            return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
        const sanitizedUrl = apiUrl.replace(/\/$/, '');
        const apiBase = sanitizedUrl.endsWith('/api') ? sanitizedUrl : `${sanitizedUrl}/api`;
        const streamEndpoint = `${apiBase}/notifications/stream?token=${accessToken}`;

        // Close existing stream before opening a new one
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        console.debug('Initializing SSE stream:', streamEndpoint.split('?')[0]);
        const stream = new EventSource(streamEndpoint);
        eventSourceRef.current = stream;

        stream.onopen = () => {
            console.info('SSE stream established successfully');
            setIsConnected(true);
            setConnectionError(null);
            retryAttemptsRef.current = 0;
        };

        // Listen for new notification payloads
        stream.addEventListener('notification', (event) => {
            try {
                const payload = JSON.parse(event.data) as Notification;
                console.debug('Real-time notification received:', payload);
                if (onNotification) {
                    onNotification(payload);
                }
            } catch (err) {
                console.error('Failed to parse SSE notification payload:', err);
            }
        });

        // Backend confirmation event
        stream.addEventListener('connected', (event) => {
            console.debug('Server connection confirmation:', event.data);
        });

        // Periodic heartbeat to prevent idle disconnects
        stream.addEventListener('heartbeat', () => {
            console.debug('SSE heartbeat received');
        });

        stream.onerror = () => {
            console.warn('SSE stream interrupted, attempting recovery...');
            setIsConnected(false);
            stream.close();

            // Exponential backoff strategy for reconnection
            const backoffDelay = Math.min(
                INITIAL_RECONNECT_INTERVAL * Math.pow(1.5, retryAttemptsRef.current),
                MAX_RECONNECT_INTERVAL
            );

            retryAttemptsRef.current += 1;
            console.log(`Retrying SSE connection in ${Math.round(backoffDelay)}ms (Attempt ${retryAttemptsRef.current})`);

            reconnectTimeoutRef.current = setTimeout(() => {
                doConnect();
            }, backoffDelay);
        };
    }, [onNotification]);

    useEffect(() => {
        establishConnection();

        /**
         * Forces immediate reconnection when the browser regains internet access.
         */
        const handleBrowserOnline = () => {
            console.info('Internet restored - re-establishing SSE stream');
            retryAttemptsRef.current = 0;
            establishConnection();
        };

        window.addEventListener('online', handleBrowserOnline);

        return () => {
            window.removeEventListener('online', handleBrowserOnline);
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [establishConnection]);

    return { connected: isConnected, error: connectionError };
};
