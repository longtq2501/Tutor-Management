import api from './axios-instance';
import type { WindowResponse } from '@/lib/types/common';
import type {
    OnlineSessionResponse,
    JoinRoomResponse,
    RoomStatsResponse,
    GlobalStatsResponse,
    CreateOnlineSessionRequest,
    UpdateRecordingMetadataRequest
} from '@/lib/types/onlineSession';

export const onlineSessionApi = {
    /**
     * GET ACTIVE SESSION FOR CURRENT USER
     * Used for the "Lobby" to proactively show join buttons.
     */
    getCurrentSession: async (): Promise<OnlineSessionResponse | null> => {
        const response = await api.get('/online-sessions/current');
        return response.data.data;
    },

    /**
     * GET ALL MY SESSIONS (LOBBY)
     * Uses cursor-based pagination.
     */
    getMySessions: async (cursor?: string, size: number = 10): Promise<WindowResponse<OnlineSessionResponse>> => {
        const response = await api.get('/online-sessions/my-sessions', {
            params: { cursor, size }
        });
        return response.data.data;
    },

    /**
     * CREATE A NEW ONLINE SESSION
     * Accessible by TUTOR and ADMIN roles.
     * @param {CreateOnlineSessionRequest} data - Session creation details
     * @returns {Promise<OnlineSessionResponse>} The created session details
     */
    createSession: async (data: CreateOnlineSessionRequest): Promise<OnlineSessionResponse> => {
        const response = await api.post('/online-sessions', data);
        return response.data.data;
    },

    /**
     * JOIN AN ONLINE SESSION
     * Returns JWT token and WebRTC configuration.
     * @param {string} roomId - Unique identifier for the room
     * @returns {Promise<JoinRoomResponse>} Token and room configuration
     */
    joinRoom: async (roomId: string): Promise<JoinRoomResponse> => {
        const response = await api.post(`/online-sessions/${roomId}/join`);
        return response.data.data;
    },

    /**
     * RETRIEVE STATISTICS FOR A SPECIFIC SESSION
     * @param {string} roomId - Unique identifier for the room
     * @returns {Promise<RoomStatsResponse>} Room statistics
     */
    /**
     * RETRIEVE STATISTICS FOR A SPECIFIC SESSION
     * @param {string} roomId - Unique identifier for the room
     * @param {object} options - Request options
     * @param {AbortSignal} [options.signal] - AbortSignal for cancellation
     * @returns {Promise<RoomStatsResponse>} Room statistics
     */
    getRoomStats: async (roomId: string, options?: { signal?: AbortSignal }): Promise<RoomStatsResponse> => {
        const response = await api.get(`/online-sessions/${roomId}/stats`, { signal: options?.signal });
        return response.data.data;
    },

    /**
     * RETRIEVE GLOBAL STATISTICS ACROSS ALL SESSIONS
     * ADMIN role only.
     * @returns {Promise<GlobalStatsResponse>} Global statistics
     */
    getGlobalStats: async (): Promise<GlobalStatsResponse> => {
        const response = await api.get('/online-sessions/stats');
        return response.data.data;
    },

    /**
     * END AN ONLINE SESSION MANUALLY
     * @param {string} roomId - Unique identifier for the room
     * @returns {Promise<OnlineSessionResponse>} Updated session details
     */
    /**
     * UPDATES RECORDING METADATA AFTER DOWNLOAD
     * @param {string} roomId - Unique identifier for the room
     * @param {any} data - Recording metadata details (duration, size)
     * @returns {Promise<OnlineSessionResponse>} Updated session details
     */
    updateRecordingMetadata: async (roomId: string, data: UpdateRecordingMetadataRequest): Promise<OnlineSessionResponse> => {
        const response = await api.post(`/online-sessions/${roomId}/recording-metadata`, data);
        return response.data.data;
    },

    /**
     * RETRIEVE ALL WHITEBOARD STROKES FOR A SESSION
     * @param {string} roomId - Unique identifier for the room
     * @returns {Promise<any[]>} List of strokes
     */
    getWhiteboardStrokes: async (roomId: string): Promise<unknown[]> => {
        const response = await api.get(`/online-sessions/${roomId}/whiteboard`);
        return response.data.data;
    },
};
