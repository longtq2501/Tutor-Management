'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { SupportMessage, SupportMessageRequest } from '@/lib/types/support';

interface UseFeedbackChatOptions {
    conversationId: number | null;
    /** Seed messages from the REST history load before STOMP is connected. */
    initialMessages?: SupportMessage[];
    /** Called when a new message arrives via STOMP. */
    onNewMessage?: (msg: SupportMessage) => void;
}

interface UseFeedbackChatReturn {
    isConnected: boolean;
    sendMessage: (req: SupportMessageRequest) => void;
}

/**
 * Manages a STOMP connection for a single support conversation.
 *
 * Connects using the main app JWT (not the room-scoped token).
 * Subscribes to `/topic/support/{conversationId}` and publishes to
 * `/app/support/{conversationId}/send`.
 */
export function useFeedbackChat({
    conversationId,
    onNewMessage,
}: UseFeedbackChatOptions): UseFeedbackChatReturn {
    const [isConnected, setIsConnected] = useState(false);
    const stompClientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (conversationId == null) return;

        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/$/, '');

        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws/room`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = () => {
            setIsConnected(true);
            client.subscribe(`/topic/support/${conversationId}`, (frame) => {
                try {
                    const msg: SupportMessage = JSON.parse(frame.body);
                    onNewMessage?.(msg);
                } catch {
                    console.error('[SupportChat] Failed to parse message:', frame.body);
                }
            });
        };

        client.onDisconnect = () => setIsConnected(false);
        client.onStompError = (frame) =>
            console.error('[SupportChat] STOMP error:', frame.headers['message']);

        client.activate();
        stompClientRef.current = client;

        return () => {
            client.deactivate();
            stompClientRef.current = null;
            setIsConnected(false);
        };
    }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

    const sendMessage = useCallback(
        (req: SupportMessageRequest) => {
            const client = stompClientRef.current;
            if (!client?.connected || conversationId == null) return;
            client.publish({
                destination: `/app/support/${conversationId}/send`,
                body: JSON.stringify(req),
            });
        },
        [conversationId],
    );

    return { isConnected, sendMessage };
}
