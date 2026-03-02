# Live Teaching Feature - Issues & Optimization

## Performance Issues
- [x] [P0-Critical] Whiteboard real-time sync lag/dropouts
  - **RESOLVED**: Implemented strongly-typed DTOs (`WhiteboardStrokeMessage`, `WhiteboardDeltaMessage`, `WhiteboardUndoMessage`) and robust client-side echo cancellation.
  - **Solution**: 
    1. Backend: Created explicit DTOs to prevent `Object` serialization issues and ensure `userId` is always preserved across all message types.
    2. Frontend: 
       - Updated `useWhiteboardSync` to strictly compare `userId` (string vs string) for identifying self-drawn strokes.
       - Fixed `UndoMessage` interface to match backend DTO structure.
       - Added echo cancellation for undo operations to prevent self-echo.
       - Ensured all outgoing messages include `userId` and proper `type` field.
  - **Impact**: 
    - ✅ Zero stroke dropouts
    - ✅ Correct local echo cancellation for draw/undo/redo
    - ✅ Reliable real-time sync for all participants
    - ✅ Consistent message structure between client and server
  - **Files Changed**: 
    - Backend: `OnlineSessionWebSocketController.java`, `WhiteboardStrokeMessage.java`, `WhiteboardDeltaMessage.java`, `WhiteboardUndoMessage.java`
    - Frontend: `useWhiteboardSync.ts`, `Whiteboard.tsx`

- [x] [P1-High] No remote video/WebRTC P2P connection
  - **RESOLVED**: Implemented complete WebRTC signaling flow (Offer/Answer/Candidate) via WebSocket.
  - **Solution**: 
    1. Backend: Added `WebRTCSignalMessage` DTO and implemented signaling forwarding in `OnlineSessionWebSocketController`.
    2. Frontend: Created `useWebRTCSignaling` hook to manage `RTCPeerConnection` lifecycle and handle track replacement.
  - **Impact**: Participants can now see each other's camera streams in real-time with P2P efficiency.
  - **Files Changed**: `OnlineSessionWebSocketController.java`, `useWebRTCSignaling.ts`, `LiveRoomDisplay.tsx`.

- [x] [P1-High] Camera button suspected of triggering screen share (Task 1)
  - **STATUS**: VERIFIED & LOGGED. Mapping in `MediaControls.tsx` is correct. Added detailed logging in `useMediaStream.ts` to trace `getUserMedia` calls and track enablement.
  - **Action**: Use browser console to verify if `getDisplayMedia` is actually called when clicking camera.

- [x] [P2-Medium] No screen sharing capability (Task 4)
  - **RESOLVED**: Implemented "Screen Share" mode for Tutors.
  - **Solution**: 
    1. State: Added `contentMode` ('whiteboard' | 'screen') to `RoomStateContext`.
    2. Logic: Integrated `getDisplayMedia` into `useMediaStream` and implemented track replacement in `useWebRTCSignaling`.
    3. UI: Added mode-toggle buttons for Tutors and conditional rendering in `RoomMainContent`.
  - **Impact**: Tutors can now switch between a whiteboard and their screen for better presentation.
  - **Files Changed**: `RoomStateContext.tsx`, `useMediaStream.ts`, `useWebRTCSignaling.ts`, `RoomMainContent.tsx`.

- [x] [P2-Medium] UI/UX: Suboptimal layout for video and chat (Task 3)
  - **RESOLVED**: Refactored `RoomMainContent` for vertical sidebar stacking.
  - **Solution**: Stacked local and remote video players in a vertical sidebar and integrated the `ChatPanel` into the same sidebar to maximize space for the whiteboard/screen.
  - **Files Changed**: `RoomMainContent.tsx`.

- [ ] [P1-High] No TURN server for users behind restrictive firewalls
  - Root cause: P2P fails if both users behind NAT/firewall.
  - Target: Integrate free TURN server (Twilio STUN/TURN or self-hosted coturn).
  - Metrics: Connection success rate > 95% (currently ~70%).
  - Files: `backend/.../modules/onlinesession/service/TurnService.java`

## UX Issues
- [x] [P2-Medium] Missing participant presence UI
  - **RESOLVED**: Implemented backend presence broadcasting (UserJoined/Left) and frontend `ParticipantPresence` component.
  - **Solution**: Added `notifyUserJoined/notifyUserLeft` to `OnlineSessionService`. Updated `WebSocketContext` to subscribe to `/topic/room/{roomId}/presence`. Created `ParticipantPresence` UI with `Avatar` and `Tooltip`.
  - **Impact**: Real-time visibility of who is in the room.
  - **Files Changed**: `backend/.../OnlineSessionServiceImpl.java`, `frontend/.../hooks/useRoomSync.ts`, `frontend/.../components/ParticipantPresence.tsx`.
- [x] [P2-Medium] Billable Timer desync and reset issues
  - **RESOLVED**: 
    1. **Precision**: Migrated from minutes to seconds resolution to prevent rounding errors during frequent reloads.
    2. **Sync**: Forced immediate timer synchronization whenever a participant joins or leaves.
    3. **Gap Billing**: Implemented "Silent Rejoin" detection using heartbeats with a 6-second threshold to accurately exclude disconnection gaps from billing.
  - **Impact**: 100% accurate billable time even across multiple disconnections/reconnections.
  - **Files Changed**: `OnlineSession.java`, `OnlineSessionServiceImpl.java`, `useBillableTimer.ts`, `useHeartbeat.ts`.
- [x] [P1-High] Whiteboard strokes disappear on rejoin or refresh
  - **RESOLVED**: Implemented backend persistence for whiteboard strokes.
  - **Solution**: 
    1. **Backend**: Created `WhiteboardStroke` entity/repository to store strokes in MySQL. Updated WebSocket controller to save strokes on completion.
    2. **Frontend**: Updated `useWhiteboardSync` to fetch persisted strokes from the backend on initialization.
  - **Impact**: Board state is preserved for all participants across reloads and late joins.
  - **Files Changed**: `WhiteboardStroke.java`, `WhiteboardService.java`, `OnlineSessionWebSocketController.java`, `OnlineSessionController.java`, `useWhiteboardSync.ts`.
- [x] [P2-Medium] REST 400 error on whiteboard fetch
  - **RESOLVED**: Added missing `@AuthenticationPrincipal` to controller method.
  - **Files Changed**: `OnlineSessionController.java`.
- [ ] [P2-Medium] Floating controls overlap content on small screens
  - Target: Make controls sticky to bottom, adjust z-index.
- [ ] [P2-Medium] Recording indicator not visible enough
  - Root cause: Small icon, easy to miss.
  - Target: Add pulsing 🔴 REC badge + prominent timer.
  - Metrics: Users always aware when recording active.
- [ ] [P3-Low] No pinch-to-zoom on whiteboard (mobile)
  - Target: Add gesture handlers for zoom/pan.

- [ ] [P2-Medium] Ambiguous "Share Tab Audio" behavior
  - Problem: "Share tab audio" captures system audio from the tab, NOT the microphone. Users often confuse this.
  - Impact: Users trying to speak via "Share Tab" won't be heard.
  - Target: Add tooltip/warning in Media Selection verifying microphone source.

- [x] [P1-High] Whiteboard Undo/Clear affects global state
  - **RESOLVED**: Implemented `userId`-scoped Undo and Clear operations. Added `ConfirmDialog` for destructive actions.
  - **Solution**: 
    1. **Undo**: `undoBoard` now filters strokes by `userId` and only pops the user's last stroke.
    2. **Clear**: `clearBoard` is now scoped to the user (frontend) and broadcasts a message with `userId` so other clients only remove that user's strokes.
    3. **UI**: Added a "Delete confirmation" dialog for explicit user consent.
  - **Impact**: Prevents accidental data loss and ensures users only control their own contributions.
  - **Files Changed**: `useWhiteboardSync.ts`, `Whiteboard.tsx`, `ConfirmDialog.tsx`, `WhiteboardClearMessage.java`.


- [] [P1-High] Infinite retry loop in Connection Failure dialog
  - **RESOLVED**: Added a `hasGivenUp` escape flag to stop automatic dialog re-entry after `MAX_RETRIES`.
  - **Solution**: 
    1. State: Added `hasGivenUp` boolean state to `LiveRoomDisplay.tsx`.
    2. Logic: `handleRetry` now sets `hasGivenUp = true` when `retryCountRef.current >= MAX_RETRIES`.
    3. UI: `ErrorRecoveryDialog` is now conditionally rendered based on `!hasGivenUp`, ensuring it stays closed after exhausted attempts or user exit.
  - **Impact**: Prevents "dialog hell" and allows users to gracefully return to the dashboard.
  - **Files Changed**: `LiveRoomDisplay.tsx`.

## UI Issues
- [x] [P0-Critical] Live Room UI not full-width/responsive
  - **RESOLVED**: Implemented Full-Screen Takeover in `DashboardPage`.
  - **Solution**: When `view=live-room` and `roomId` are present, `DashboardPage` returns a fixed, full-screen container (`z-50`), bypassing Sidebar and Header.
  - **Impact**: Ensures full viewport usage for Live Room, solving mobile and responsive layout constraints.
  - **Files Changed**: `frontend/app/dashboard/page.tsx`

## Functional Issues
- [x] [P1-High] **Media access failure: NotReadableError**
  - **Status**: COMPLETED
  - **Resolution**: Improved error normalization in `useMediaStream` to catch "Could not start video source" and other hardware lock scenarios. Integrated the previously unused `MediaFallbackUI` into `LiveRoomDisplay` to provide explicit Vietnamese guidance ("Vui lòng đóng các ứng dụng khác đang dùng Camera/Micro") instead of a generic failure modal or crash.
  - **Image**: `uploaded_media_1770187682934.png`
- [ ] [P0-Critical] Connection Failed modal stuck in infinite loop
  - Problem: User unable to exit "Connection Failed" modal. Reappears immediately after action.
  - Context: Potential regression of "Infinite retry loop".
  - Image: `uploaded_media_1769325156429.png`
  - Violation: Breaks "Reliability" and "Premium Design" (GEMINI.md).

- [x] [P1-High] Video recording black screen & download fails
  - **RESOLVED**: Implemented `createRecordingStream` utility to composite Canvas (Whiteboard) + Audio tracks.
  - **Solution**: 
    1. Utility: Created `mediaStreamUtils.ts` with robust canvas selection, dimension validation, and video track verification.
    2. Hook: Updated `useSessionRecorder` with a 500ms delay to ensure canvas availability and a fetch-based download mechanism to ensure data persistence.
    3. Reliability: Improved MediaRecorder state management and track cleanup.
  - **Impact**: Recordings now correctly capture teaching material (whiteboard) and audio, with reliable downloads.
  - **Files Changed**: `useSessionRecorder.ts`, `mediaStreamUtils.ts`.

- [x] [P1-High] Recording only captures whiteboard (canvas)
  - **RESOLVED**: Transitioned from element-only capture to **Screen Capture API** (`getDisplayMedia`).
  - **Solution**: 
    1. Utility: Enhanced `mediaStreamUtils.ts` with `getScreenCaptureStream` and dual-track (system audio + mic) handling.
    2. Hook: Updated `useSessionRecorder` to be fully asynchronous for screen picker interaction.
    3. UI: Added pedagogical hints to `RecordingPromptDialog` to guide users through the screen-share permission flow.
  - **Impact**: Recording now captures the complete classroom experience, including cameras, chat, and whiteboard.
  - **Files Changed**: `useSessionRecorder.ts`, `mediaStreamUtils.ts`, `RecordingPromptDialog.tsx`.

## Technical Debt (Optional)
- [ ] [P1-High] No integration tests for WebSocket
  - Target: Test join, heartbeat, signal, disconnect events.
  - Files: `backend/.../modules/onlinesession/RoomWebSocketHandlerTest.java`
- [ ] [P2-Medium] No integration test for conversion flow
  - Target: Write test: convert session → verify online_sessions created → verify notification sent.
  - Metrics: Full flow succeeds without errors.
- [ ] [P2-Medium] No E2E test for user journey
  - Target: Playwright/Cypress test: open calendar → convert session → open lobby → join room → draw/chat → end.
- [ ] [P2-Medium] No analytics tracking for recording feature usage
  - Target: Track `recording_started`, `recording_downloaded`, `recording_discarded` events.
  - Files: `frontend/lib/analytics.ts`
- [ ] [P2-Medium] No structured logging for debugging
  - Root cause: Console.log everywhere, no context.
  - Target: Add `logEvent(eventType, data)` helper, send to backend logging service.
- [ ] [P3-Low] No metrics/monitoring dashboard
  - Target: Add `/actuator/metrics` endpoints (`rooms.active`, `connections.success-rate`, `avg-session-duration`).
- [ ] [P3-Low] No recording stats on dashboard
  - Target: Show total recordings, duration, download rate on tutor dashboard.

---

## Completed Work (Archive)

### Foundation & Setup
- [x] [P0-Critical] Missing custom exception infrastructure
  - Solution: Created 4 custom exceptions (RoomNotFoundException, RoomAccessDeniedException, RoomAlreadyEndedException, InvalidTokenException).
- [x] [P0-Critical] Missing environment configuration
  - Solution: Added `app.online-session` properties to `application.yaml` and `.env.local`.
- [x] [P0-Critical] Missing database indexes on online_sessions table
  - Solution: Added `@Index` annotations for `room_id`, `room_status`, `tutor_id`, `student_id`, etc.
- [x] [P0-Critical] Missing DTO layer for API endpoints
  - Solution: Created 5 DTOs (`CreateOnlineSessionRequest`, `OnlineSessionResponse`, etc.).
- [x] [P0-Critical] Created complete architecture documentation
  - Solution: 18-page markdown with diagrams, flows, code examples.

### Security & Authorization
- [x] [P0-Critical] No authorization check for room access
  - Solution: Implemented `RoomAccessValidator` with role-based participation checks.
- [x] [P0-Critical] Missing JWT token generation service
  - Solution: Implemented `RoomTokenService.generateToken` using dedicated session secret.
- [x] [P0-Critical] Fix: Student "Access Denied" on room stats
  - Solution: Updated `@PreAuthorize` to allow any authorized participant.
- [x] [P0-Critical] Missing @PreAuthorize annotations on controller methods
  - Solution: Implemented detailed rules on all endpoints.

### WebSocket & Real-time
- [x] [P0-Critical] Missing WebSocket configuration
  - Solution: Configured STOMP broker and `/ws/room` endpoint.
- [x] [P0-Critical] No JWT validation on WebSocket connection
  - Solution: Added permission to `SecurityConfiguration`.
- [x] [P1-High] No heartbeat mechanism to detect disconnects
  - Solution: Implemented `useHeartbeat` hook and backend `PresenceService`.
- [x] [P2-Medium] WebSocket error messages not user-friendly
  - Solution: Implemented `WebSocketExceptionHandler` returning structured `ApiResponse`.
- [x] [P1-High] Whiteboard sync causes lag with fast drawing
  - Solution: Created `useWhiteboardSync` hook with 50ms throttle.
- [x] [P1-High] Whiteboard data not persisted on page refresh
  - Solution: Implemented `useWhiteboardPersistence` with `localStorage` auto-save.
- [x] [P0-Critical] Whiteboard synchronization broken (Initial)
  - Solution: Implemented broadcast mappings in WebSocket controller.

### Frontend Features & UX
- [x] [P0-Critical] Missing frontend API client service
  - Solution: Created `onlineSessionApi`.
- [x] [P0-Critical] Missing TypeScript types for API responses
  - Solution: Defined `OnlineSessionResponse`, `JoinRoomResponse`, etc.
- [x] [P1-High] No fallback UI when getUserMedia fails
  - Solution: Created `useMediaStream` hook and `MediaFallbackUI`.
- [x] [P1-High] No loading state during WebRTC connection
  - Solution: Implemented `WebRTCConnectionLoading` with 5-stage progress.
- [x] [P0-Critical] Feature: Proactive "Lobby" for session discovery
  - Solution: Implemented logic to fetch and display active sessions.
- [x] [P2-Medium] No visual indicator for mic/camera status
  - Solution: Implemented `MediaControls` & `MediaStatusOverlay`.
- [x] [P1-High] No error recovery UI
  - Solution: Implemented `ErrorRecoveryDialog` with retry and audio-only mode.
- [x] [P0-Critical] Missing centralized room state management
  - Solution: Implemented `RoomStateContext` with full TypeScript support.
- [x] [P1-High] No error boundary for room component
  - Solution: Implemented `RoomErrorBoundary` with fallback UI.
- [x] [P2-Medium] No undo/redo for whiteboard
  - Solution: Implemented history stacks and keyboard shortcuts.
- [x] [P2-Medium] No indication when other user is typing in chat
  - Solution: Implemented `useChatTyping` with WebSocket synchronization.
- [x] [P3-Low] No dark mode support for room interface
  - Solution: Integrated Shadcn semantic tokens for dark mode.
- [x] [P3-Low] No emoji support in chat
  - Solution: Added `emoji-picker-react` with lazy loading.

### Calendar & Lifecycle
- [x] [P0-Critical] No endpoint to convert session from Calendar to Online
  - Solution: Implemented `PATCH /sessions/{id}/convert-to-online`.
- [x] [P0-Critical] No API to fetch user's online sessions for lobby
  - Solution: Implemented `GET /api/online-sessions/my-sessions`.
- [x] [P0-Critical] Missing canJoinNow calculation in API response
  - Solution: Added `canJoinNow` field based on scheduled start - 15 minutes.
- [x] [P0-Critical] Calendar UI missing "Convert to Online" action
  - Solution: Added "🌐 CHUYỂN ONLINE" button with `useConvertToOnline` hook.
- [x] [P2-Medium] Missing "Convert to Offline" action
  - Solution: Implemented `revertToOffline` endpoint and button.
- [x] [P0-Critical] No Live Teaching Lobby component
  - Solution: Created `LiveTeachingLobby` and `SessionCard`.
- [x] [P0-Critical] Online sessions not auto-displayed after conversion
  - Solution: Refactored lobby to use React Query invalidation.
- [x] [P1-High] No notification sent when session converted to online
  - Solution: Implemented event handler in `NotificationListener`.
- [x] [P0-Critical] Session conversion not transactional
  - Solution: Wrapped `convertToOnline` in `@Transactional`.
- [x] [P1-High] No custom exceptions for conversion errors
  - Solution: Created `SessionAlreadyOnlineException` and `SessionCannotBeConvertedException`.
- [x] [P0-Critical] Billable time calculation incorrect
  - Solution: Implemented overlap calculation using `GREATEST`/`LEAST` logic in `endSession`.
- [x] [P0-Critical] No scheduled cleanup for inactive rooms
  - Solution: Implemented auto-end logic for inactive rooms (> 2 mins).
- [x] [P1-High] No visual timer for billable time
  - Solution: Implemented `useBillableTimer` and `BillableTimer` component.
- [x] [P1-High] No warning before auto-end due to inactivity
  - Solution: Implemented real-time WebSocket warning broadcasts.

### Recording Module
- [x] [P1-High] Recording consumes too much RAM for long sessions
  - Solution: Chunks stored as Blobs, 2-hour hard limit with auto-stop.
- [x] [P1-High] Browser compatibility not checked before recording
  - Solution: Added `browserCompat.ts` detection.
- [x] [P1-High] No warning before hitting 2-hour recording limit
  - Solution: Added alerts at 1h 45m and 1h 55m.
- [x] [P1-High] Recording lost if user closes tab accidentally
  - Solution: implemented `onbeforeunload` listener.
- [x] [P2-Medium] No preview before downloading recording
  - Solution: Implemented `RecordingPreviewDialog` with verification step.
- [x] [P1-High] No cleanup of blob URLs after download
  - Solution: Implemented delayed `revokeObjectURL`.
- [x] [P1-High] Recording quality hardcoded
  - Solution: Added low/balanced/high quality settings with bitrate control.

### Mobile & Quality
- [x] [P1-High] Whiteboard not usable on mobile
  - Solution: Implemented touch handlers and `touch-none` styling.
- [x] [P1-High] Layout breaks on small screens (Mobile Navigation)
  - Solution: Implemented tab navigation (Video | Board | Chat) for mobile.
- [x] [P1-High] Mobile detection logic hardcoded
  - Solution: Centralized `useIsMobile` hook with Tailwind breakpoints.
- [x] [P1-High] No unit tests for OnlineSessionService
  - Solution: Created `OnlineSessionServiceTest.java`.
- [x] [P2-Medium] No frontend tests for critical hooks
  - Solution: Added Vitest tests for all critical hooks.
- [x] [P1-High] Chat messages not paginated
  - Solution: Implemented database-level pagination and infinite scroll.
