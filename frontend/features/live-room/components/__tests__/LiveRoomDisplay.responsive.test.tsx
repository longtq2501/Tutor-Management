import { render, screen, fireEvent } from '@testing-library/react';
import { LiveRoomDisplay } from '../LiveRoomDisplay';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

// Mock all external dependencies to isolate the component logic
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn() }),
    useSearchParams: () => ({ get: vi.fn() })
}));
vi.mock('../../context/WebSocketContext', () => ({
    useWebSocket: () => ({ sendMessage: vi.fn() })
}));
vi.mock('../../context/RoomStateContext', () => ({
    useRoomState: () => ({
        state: { isConnected: true, connectionState: 'CONNECTED', error: null },
        actions: {
            setConnectionState: vi.fn(),
            setError: vi.fn()
        }
    })
}));
vi.mock('../../hooks/useLiveRoomMedia', () => ({
    useLiveRoomMedia: () => ({
        stream: null,
        isRecording: false,
        toggleMic: vi.fn(),
        toggleCamera: vi.fn(),
        startRecording: vi.fn(),
        stopRecording: vi.fn(),
        setQuality: vi.fn(),
        isSupported: true,
        retry: vi.fn()
    })
}));
vi.mock('../../hooks/useRoomStatus', () => ({
    useRoomStatus: () => ({ warning: null, secondsRemaining: null })
}));

vi.mock('../../hooks/useWebRTCSignaling', () => ({
    useWebRTCSignaling: () => ({
        peers: [], // Mock empty peers array so .find doesn't crash
        sendMessage: vi.fn(),
        rtcManagerRef: { current: null }
    })
}));

// Mock child components
vi.mock('../RoomHeader', () => ({ RoomHeader: () => <div>Header</div> }));
vi.mock('../InactivityWarning', () => ({ InactivityWarning: () => null }));
vi.mock('../RoomErrorBoundary', () => ({ RoomErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock('../RecordingPreviewDialog', () => ({ RecordingPreviewDialog: () => null }));
vi.mock('../RoomMainContent', () => ({
    RoomMainContent: ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => (
        <div>
            <div data-testid="desktop-active-tab">{activeTab}</div>
            <button onClick={() => onTabChange('chat')}>Switch to Chat</button>
        </div>
    )
}));
vi.mock('../MobileNavigation', () => ({
    MobileNavigation: ({ activeTab }: { activeTab: string }) => (
        <div data-testid="active-tab">{activeTab}</div>
    )
}));

// Provide a manual mock for useIsMobile so we can control it synchronously
let mockIsMobile = true;
vi.mock('../../hooks/useIsMobile', () => ({
    useIsMobile: () => mockIsMobile
}));

describe('LiveRoomDisplay State Logic', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.clearAllMocks();

        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: query === '(max-width: 768px)',
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })),
        });
    });

    it('persists tab selection in sessionStorage', () => {
        mockIsMobile = true;
        render(<LiveRoomDisplay roomId="test-room" currentUserId={1} />);

        fireEvent.click(screen.getByText('Switch to Chat'));

        expect(sessionStorage.getItem('room-test-room-active-tab')).toBe('chat');
        expect(screen.getByTestId('active-tab')).toHaveTextContent('chat');
    });

    it('switches tabs using keyboard shortcuts on desktop', () => {
        mockIsMobile = false;

        render(<LiveRoomDisplay roomId="test-room" currentUserId={1} />);

        fireEvent.keyDown(window, { key: '1', altKey: true });
        expect(screen.getByTestId('desktop-active-tab')).toHaveTextContent('board');

        fireEvent.keyDown(window, { key: '3', altKey: true });
        expect(screen.getByTestId('desktop-active-tab')).toHaveTextContent('chat');
    });
});
