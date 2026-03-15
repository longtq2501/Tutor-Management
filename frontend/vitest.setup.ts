import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock MediaStream
global.MediaStream = vi.fn().mockImplementation(() => ({
    getTracks: vi.fn().mockReturnValue([]),
    getVideoTracks: vi.fn().mockReturnValue([]),
    getAudioTracks: vi.fn().mockReturnValue([]),
    addTrack: vi.fn(),
    removeTrack: vi.fn(),
}));

// Mock MediaRecorder
global.MediaRecorder = vi.fn().mockImplementation(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    ondataavailable: vi.fn(),
    onstop: vi.fn(),
    onerror: vi.fn(),
    state: 'inactive',
})) as any;

(global.MediaRecorder as any).isTypeSupported = vi.fn().mockReturnValue(true);

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
global.URL.revokeObjectURL = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        refresh: vi.fn(),
    }),
    usePathname: () => '',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
}));

// Mock navigator.mediaDevices
if (typeof navigator !== 'undefined') {
    const mockTrack = {
        kind: 'video',
        enabled: true,
        stop: vi.fn(),
        getSettings: vi.fn().mockReturnValue({ width: 1280, height: 720 }),
    };

    const mockMediaStream = {
        getTracks: vi.fn().mockReturnValue([mockTrack]),
        getVideoTracks: vi.fn().mockReturnValue([mockTrack]),
        getAudioTracks: vi.fn().mockReturnValue([]),
        addTrack: vi.fn(),
        removeTrack: vi.fn(),
    };

    Object.defineProperty(navigator, 'mediaDevices', {
        value: {
            getDisplayMedia: vi.fn().mockResolvedValue(mockMediaStream),
            getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
            enumerateDevices: vi.fn().mockResolvedValue([]),
        },
        configurable: true,
    });
}
