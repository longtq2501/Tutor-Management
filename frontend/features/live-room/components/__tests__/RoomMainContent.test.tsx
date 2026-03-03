import { render } from '@testing-library/react';
import { RoomMainContent } from '../RoomMainContent';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

interface MockSwipeHandlers {
    onSwipedLeft: () => void;
    onSwipedRight: () => void;
}

declare global {
    interface Window {
        __swipeHandlers: MockSwipeHandlers;
    }
}

// Mock react-swipeable to easily trigger swipe events
vi.mock('react-swipeable', () => ({
    useSwipeable: (config: MockSwipeHandlers) => {
        // Store config globally to trigger handlers in test
        window.__swipeHandlers = config;
        return {};
    }
}));

// Mock child components
vi.mock('../Whiteboard', () => ({ Whiteboard: () => <div>Whiteboard</div> }));
vi.mock('../MediaControls', () => ({ MediaControls: () => <div>MediaControls</div> }));
vi.mock('../VideoPlayer', () => ({ VideoPlayer: () => <div>VideoPlayer</div> }));
vi.mock('../ChatPanel', () => ({ ChatPanel: () => <div>ChatPanel</div> }));
vi.mock('../../hooks/useMediaQuery', () => ({
    useMediaQuery: () => true // Mock as mobile
}));

describe('RoomMainContent Swipe Gestures', () => {
    it('navigates to the next tab on swipe left', () => {
        const onTabChange = vi.fn();

        render(
            <RoomMainContent
                roomId="test"
                currentUserId={1}
                activeTab="board"
                media={{}}
                sendMessage={vi.fn()}
                onTabChange={onTabChange}
            />
        );

        // Simulate swipe left (next tab)
        window.__swipeHandlers.onSwipedLeft();
        expect(onTabChange).toHaveBeenCalledWith('video');
    });

    it('navigates to the previous tab on swipe right', () => {
        const onTabChange = vi.fn();

        render(
            <RoomMainContent
                roomId="test"
                currentUserId={1}
                activeTab="video"
                media={{}}
                sendMessage={vi.fn()}
                onTabChange={onTabChange}
            />
        );

        // Simulate swipe right (prev tab)
        window.__swipeHandlers.onSwipedRight();
        expect(onTabChange).toHaveBeenCalledWith('board');
    });

    it('does not swipe past the boundaries', () => {
        const onTabChange = vi.fn();

        // At the first tab, swipe right should do nothing
        const { rerender } = render(
            <RoomMainContent
                roomId="test"
                currentUserId={1}
                activeTab="board"
                media={{}}
                sendMessage={vi.fn()}
                onTabChange={onTabChange}
            />
        );
        window.__swipeHandlers.onSwipedRight();
        expect(onTabChange).not.toHaveBeenCalled();

        // At the last tab, swipe left should do nothing
        rerender(
            <RoomMainContent
                roomId="test"
                currentUserId={1}
                activeTab="chat"
                media={{}}
                sendMessage={vi.fn()}
                onTabChange={onTabChange}
            />
        );
        window.__swipeHandlers.onSwipedLeft();
        expect(onTabChange).not.toHaveBeenCalled();
    });
});
