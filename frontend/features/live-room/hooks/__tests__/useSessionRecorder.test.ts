import { renderHook, act } from '@testing-library/react';
import { useSessionRecorder } from '../useSessionRecorder';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRecordingStream } from '@/lib/utils/mediaStreamUtils';

vi.mock('@/lib/utils/mediaStreamUtils', () => ({
    createRecordingStream: vi.fn(),
}));

describe('useSessionRecorder', () => {
    let mockMediaRecorder: {
        start: ReturnType<typeof vi.fn>;
        stop: ReturnType<typeof vi.fn>;
        state: string;
        ondataavailable: ((e: { data: { size: number } }) => void) | null;
        onstop: (() => void) | null;
    };
    let mockStream: MediaStream;
    let OriginalMediaRecorder: any;

    beforeEach(() => {
        OriginalMediaRecorder = global.MediaRecorder;
        
        // Mock MediaStream
        mockStream = {
            getVideoTracks: () => [{
                enabled: true,
                getSettings: () => ({ width: 1280, height: 720 })
            }],
            getAudioTracks: () => [],
            getTracks: () => [],
            removeTrack: vi.fn(),
            addTrack: vi.fn(),
        } as unknown as MediaStream;

        vi.mocked(createRecordingStream).mockResolvedValue(mockStream);
        
        mockMediaRecorder = {
            start: vi.fn().mockImplementation(() => { mockMediaRecorder.state = 'recording'; }),
            stop: vi.fn().mockImplementation(() => {
                mockMediaRecorder.state = 'inactive';
                if (mockMediaRecorder.onstop) {
                    mockMediaRecorder.onstop();
                }
            }),
            state: 'inactive',
            ondataavailable: null,
            onstop: null,
        };

        // Mock MediaRecorder using class to support 'new'
        class MockMediaRecorder {
            constructor() {
                return mockMediaRecorder;
            }
            static isTypeSupported = vi.fn().mockReturnValue(true);
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (global as any).MediaRecorder = MockMediaRecorder;

        // Mock URL.createObjectURL
        global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
        global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
        global.MediaRecorder = OriginalMediaRecorder;
        vi.clearAllMocks();
    });

    it('should initialize with balanced quality', () => {
        const { result } = renderHook(() => useSessionRecorder(mockStream));
        expect(result.current.quality).toBe('balanced');
        expect(result.current.isRecording).toBe(false);
    });

    it('should start recording', async () => {
        const { result } = renderHook(() => useSessionRecorder(mockStream));

        await act(async () => {
            await result.current.startRecording();
        });

        expect(result.current.isRecording).toBe(true);
    });

    it('should stop recording and set preview url', async () => {
        const { result } = renderHook(() => useSessionRecorder(mockStream));

        await act(async () => {
            await result.current.startRecording();
        });

        act(() => {
            result.current.stopRecording();
        });

        expect(result.current.isRecording).toBe(false);
    });

    it('should discard recording', async () => {
        const { result } = renderHook(() => useSessionRecorder(mockStream));

        await act(async () => {
            await result.current.startRecording();
        });

        // Test global mock Object assignment
        act(() => {
            if (mockMediaRecorder.ondataavailable) {
                mockMediaRecorder.ondataavailable({ data: { size: 100 } } as any);
            }
            result.current.stopRecording();
        });

        act(() => {
            result.current.discardRecording();
        });

        expect(result.current.previewUrl).toBeNull();
        expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    });
});
