'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
    useCallback,
} from 'react';
import SockJS from 'sockjs-client';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';

interface WebSocketContextValue {
    isConnected: boolean;
    /**
     * Increments on every successful (re)connect.
     * Consumers should include this in useEffect dependency arrays
     * to ensure subscriptions are re-established after reconnection.
     */
    connectionId: number;
    sendMessage: (destination: string, payload: unknown) => void;
    subscribe: (destination: string, callback: (message: unknown) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

interface WebSocketProviderProps {
    roomId: string;
    token: string;
    children: ReactNode;
}

/**
 * Provider for WebSocket connection using SockJS and @stomp/stompjs.
 *
 * Fix 1 (Bug 2 - Reconnect): Exposes `connectionId` which increments on every
 *   successful connect/reconnect, allowing consumers to re-subscribe reliably.
 *
 * Fix 2 (Bug 2 - Stale Subs): Clears subscriptionsRef on close/reconnect so
 *   stale STOMP subscription handles are never reused.
 *
 * Fix 3 (Bug 2 - Duplicate Subs): subscribe() unsubscribes any existing
 *   subscription on the same destination before creating a new one.
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ roomId, token, children }) => {
    const [isConnected, setIsConnected] = useState(false);

    // ✅ Fix 1: connectionId lets consumers detect reconnects
    const [connectionId, setConnectionId] = useState(0);

    const stompClientRef = useRef<Client | null>(null);
    const subscriptionsRef = useRef<Map<string, StompSubscription>>(new Map());

    useEffect(() => {
        const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');

        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws/room`),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            debug: (str) => {
                if (process.env.NODE_ENV !== 'production') {
                    console.log(str);
                }
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = (frame) => {
            console.log('[WebSocket] Connected:', frame);
            // ✅ Fix 2: Clear stale handles — consumers will re-subscribe via connectionId change
            subscriptionsRef.current.clear();
            setIsConnected(true);
            // ✅ Fix 1: Signal reconnect to all consumers
            setConnectionId(prev => prev + 1);
        };

        client.onStompError = (frame) => {
            console.error('[WebSocket] Broker error:', frame.headers['message'], frame.body);
            setIsConnected(false);
        };

        client.onWebSocketClose = () => {
            console.log('[WebSocket] Connection closed');
            // ✅ Fix 2: Purge stale subscription handles on disconnect
            subscriptionsRef.current.clear();
            setIsConnected(false);
        };

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.deactivate();
                subscriptionsRef.current.clear();
                setIsConnected(false);
            }
        };
    }, [token]);

    const sendMessage = useCallback((destination: string, payload: unknown) => {
        if (stompClientRef.current?.connected) {
            stompClientRef.current.publish({
                destination,
                body: JSON.stringify(payload),
            });
        } else {
            console.warn('[WebSocket] Cannot send message: not connected');
        }
    }, []);
    // NOTE: No isConnected dependency — we check stompClient.connected directly
    // to avoid recreating sendMessage on every connect/disconnect cycle.

    const subscribe = useCallback(
        (destination: string, callback: (message: unknown) => void) => {
            if (!stompClientRef.current || !isConnected) {
                console.warn('[WebSocket] Cannot subscribe: not connected to', destination);
                return () => { };
            }

            // ✅ Fix 3: Replace any existing subscription on this destination
            const existing = subscriptionsRef.current.get(destination);
            if (existing) {
                console.log(`[WebSocket] Replacing existing subscription: ${destination}`);
                existing.unsubscribe();
                subscriptionsRef.current.delete(destination);
            }

            const subscription = stompClientRef.current.subscribe(
                destination,
                (msg: IMessage) => {
                    try {
                        const body = JSON.parse(msg.body);
                        callback(body);
                    } catch (e) {
                        console.error('[WebSocket] Failed to parse message body:', e);
                    }
                }
            );

            subscriptionsRef.current.set(destination, subscription);

            return () => {
                subscription.unsubscribe();
                subscriptionsRef.current.delete(destination);
            };
        },
        [isConnected]
    );

    const value = React.useMemo(
        () => ({ isConnected, connectionId, sendMessage, subscribe }),
        [isConnected, connectionId, sendMessage, subscribe]
    );

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};