import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMediaStream } from '../useMediaStream';

// Create mutable track objects
let mockAudioTrack: Partial<MediaStreamTrack>;
let mockVideoTrack: Partial<MediaStreamTrack>;
let mockStream: Partial<MediaStream>;

beforeEach(() => {
    // Reset mutable tracks
    mockAudioTrack = {
        stop: vi.fn(),
        enabled: true,
        kind: 'audio'
    };
    mockVideoTrack = {
        stop: vi.fn(),
        enabled: true,
        kind: 'video'
    };

    mockStream = {
        getTracks: vi.fn(() => [mockAudioTrack as MediaStreamTrack, mockVideoTrack as MediaStreamTrack]),
        getAudioTracks: vi.fn(() => [mockAudioTrack as MediaStreamTrack]),
        getVideoTracks: vi.fn(() => [mockVideoTrack as MediaStreamTrack]),
    };

    vi.stubGlobal('navigator', {
        mediaDevices: {
            getUserMedia: vi.fn().mockResolvedValue(mockStream),
            enumerateDevices: vi.fn().mockResolvedValue([]),
        },
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('useMediaStream - Media Controls', () => {
    it('should toggle mic from unmuted to muted', async () => {
        const { result } = renderHook(() => useMediaStream());

        // Wait for initial load
        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Initial state: NOT muted, track enabled
        expect(result.current.isMicMuted).toBe(false);

        // Toggle to MUTE
        act(() => {
            result.current.toggleMic();
        });

        // After toggle: muted, track disabled
        expect(result.current.isMicMuted).toBe(true);
        expect(mockAudioTrack.enabled).toBe(false);
    });

    it('should toggle mic from muted back to unmuted', async () => {
        const { result } = renderHook(() => useMediaStream());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // First toggle: mute
        act(() => {
            result.current.toggleMic();
        });

        expect(result.current.isMicMuted).toBe(true);
        expect(mockAudioTrack.enabled).toBe(false);

        // Second toggle: unmute
        act(() => {
            result.current.toggleMic();
        });

        expect(result.current.isMicMuted).toBe(false);
        expect(mockAudioTrack.enabled).toBe(true);
    });

    it('should toggle camera correctly', async () => {
        const { result } = renderHook(() => useMediaStream());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Toggle to mute
        act(() => {
            result.current.toggleCamera();
        });

        expect(result.current.isCameraMuted).toBe(true);
        expect(mockVideoTrack.enabled).toBe(false);

        // Toggle to unmute
        act(() => {
            result.current.toggleCamera();
        });

        expect(result.current.isCameraMuted).toBe(false);
        expect(mockVideoTrack.enabled).toBe(true);
    });
});
