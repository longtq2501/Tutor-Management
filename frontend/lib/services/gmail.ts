import api from './axios-instance';

export interface GmailStatusResponse {
  connected: boolean;
  email: string;
}

export interface GmailDisconnectResponse {
  disconnected: boolean;
}

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const cleanBaseUrl = rawBaseUrl.replace(/\/$/, '');

export const buildGmailConnectUrl = (): string => {
  if (typeof window === 'undefined') {
    return `${cleanBaseUrl}/api/tutor/gmail/connect`;
  }

  const token = localStorage.getItem('accessToken');
  if (!token) {
    return `${cleanBaseUrl}/api/tutor/gmail/connect`;
  }

  return `${cleanBaseUrl}/api/tutor/gmail/connect?token=${encodeURIComponent(token)}`;
};

export const gmailApi = {
  getStatus: async (): Promise<GmailStatusResponse> => {
    const response = await api.get('/tutor/gmail-status');
    return response.data;
  },

  disconnect: async (): Promise<GmailDisconnectResponse> => {
    const response = await api.delete('/tutor/gmail/disconnect');
    return response.data;
  },
};
