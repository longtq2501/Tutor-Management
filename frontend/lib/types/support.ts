export interface SupportMessage {
    id: number;
    conversationId: number;
    senderId: number;
    senderRole: 'TUTOR' | 'STUDENT' | 'ADMIN';
    senderName: string;
    content: string;
    type: 'TEXT' | 'BUG_REPORT' | 'FEATURE_REQUEST';
    isRead: boolean;
    createdAt: string;
}

export interface SupportConversation {
    id: number;
    userId: number;
    userName: string;
    userRole: string;
    status: 'OPEN' | 'RESOLVED';
    unreadCountAdmin: number;
    lastMessageAt: string | null;
    lastMessage: SupportMessage | null;
}

export interface SupportMessageRequest {
    content: string;
    type?: 'TEXT' | 'BUG_REPORT' | 'FEATURE_REQUEST';
}
