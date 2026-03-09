# TUTOR PRO
### Enterprise-Grade Tutor Management & E-Learning Ecosystem

> Built by a tutor, for tutors. A full-stack production system that automates every operational burden — from scheduling and invoicing to live teaching and AI-powered feedback.

[🌐 Live Demo](https://tutor-pro-app.vercel.app)

---

## What is Tutor Pro?

Most tutors juggle spreadsheets, messaging apps, and manual bank transfers to run their classes. Tutor Pro replaces all of that with a single, cohesive platform: automated scheduling, real-time notifications, live teaching rooms with WebRTC, AI-generated feedback, and financial-grade invoicing — deployed and running in production.

This is not a tutorial project. It solves real problems I faced as a part-time tutor, built to a standard I'd be comfortable deploying for other tutors to use.

---

## Engineering Highlights

### 1. High-Performance Bulk Calendar Engine
**Problem:** Initializing an entire month of sessions for 30+ students one-by-one is unusable in practice.

**Solution:** Optimistic Batch Processing with In-Memory Deduplication (O(1) conflict detection), Single-Pass Database Query, and JDBC Batch Inserts for transactional integrity.

**Result:** 300+ sessions generated across a full student roster in **< 800ms**.

![Calendar Bulk Generation](https://github.com/user-attachments/assets/7fb02678-e74b-4e42-83cd-2875e505fa63)

---

### 2. Event-Driven Real-Time Notification System
**Problem:** Students need to know instantly when a session is rescheduled, a grade is posted, or an exam is assigned — without polling.

**Solution:** Server-Sent Events (SSE) over Spring Application Events. `SseEmittersManager` maintains a thread-safe `ConcurrentHashMap` of emitters per user, with a heartbeat protocol to survive Docker/proxy connection drops and an auto-reconnect mechanism on the client.

**Result:** End-to-end notification delivery in **< 500ms**. Database index `idx_recipient_read` keeps unread-count queries at **< 10ms** regardless of notification volume.

> **Why SSE over WebSocket?** Notifications are inherently one-directional (server → client). SSE is simpler, HTTP-native, and proxy-friendly — WebSocket's bidirectionality would be overhead with no benefit here.

![Real-time Notifications](https://github.com/user-attachments/assets/da784f98-f862-4ee5-89ee-33a970762bec)

---

### 3. AI-Powered Feedback Engine (Groq + Llama 3.3 70B)
**Problem:** Writing individualized, contextually appropriate session feedback in Vietnamese for every student after every class is time-consuming and repetitive.

**Solution:** Integrated Groq's inference API (Llama 3.3 70B) via `GroqGeneratorServiceImpl`. Prompt engineering enforces Vietnamese tone, cultural context, and length constraints based on the student's performance data passed in at runtime.

**Result:** Context-aware, culturally appropriate Vietnamese feedback generated in **< 300ms** — replacing static templates with genuine intelligence.

![AI Feedback Generator](https://github.com/user-attachments/assets/cc767ced-400f-4840-9c84-795e8b0d2582)

---

### 4. Financial-Grade Invoicing with VietQR
**Problem:** Manual payment tracking creates reconciliation errors and chasing parents for confirmation.

**Solution:** Dynamic VietQR generation embedded directly in PDF invoices, built to the NAPAS-247 standard. CRC-16 checksum validation ensures transaction data integrity end-to-end.

**Result:** 100% automated reconciliation flow. Reconciliation error rate reduced from ~15% to near zero.

![VietQR Invoice](https://github.com/user-attachments/assets/d6724bbe-c88e-420b-8638-807e011052e1)

---

### 5. Interactive Live Teaching Room (WebRTC + WebSocket)
**Problem:** Teaching online requires more than just video — it needs synchronized whiteboard, session recording, and graceful hardware fallback.

**Solution:** Full-Mesh WebRTC for P2P media (server never touches the video stream), STOMP over WebSocket for state synchronization. Three production-grade details:
- **Whiteboard sync** throttled at 50ms to cut network congestion by 80% during heavy drawing
- **Media Access Guard** catches `NotReadableError` (device busy) and surfaces human-readable guidance instead of crashing
- **Composite Stream Recording** merges screen capture, webcam, and system audio into a single `.webm` container — entirely in-browser, no server storage required

**Result:** < 200ms interactive latency. One-click recording. No crash on hardware conflicts.

![Live Teaching Room](https://github.com/user-attachments/assets/b5e35a55-435d-4468-8dea-5fac8ff1f934)

---

### 6. Drag-and-Drop Calendar with Prefetching
**Problem:** Calendar UIs feel slow when navigating months, and drag interactions drop frames on re-renders.

**Solution:** `@dnd-kit` with Optimistic Rollback. `React.memo` + `useCallback` eliminate 95% of unnecessary re-renders. Adjacent months are prefetched automatically on load.

**Result:** Month navigation is **instant (~0ms)**. Drag interactions run at a consistent **60fps**.

![Drag and Drop Calendar](https://github.com/user-attachments/assets/27cea769-dafc-45cf-82f7-4f6b06e2da1c)

---

### 7. Intelligent Assessment & Auto-Grading
**Problem:** Digitizing exam questions from Word/PDF documents is tedious. Exam data loss from browser crashes or accidental navigation is unacceptable.

**Solution:** `ExerciseParserService` uses a Hybrid Regex Parsing Engine to bulk-ingest MCQ and Essay questions from plain text. The Exam Player implements debounced auto-save (~500ms), timer sync, and auto-submit on expiry — fault-tolerant by design.

**Result:** Question digitization time reduced by 90%. Zero data loss architecture.

![Assessment System](https://github.com/user-attachments/assets/13a7e1fb-2126-4722-be4a-5c368b719f1d)

---

### 8. Bulk Lesson Assignment (50+ Students)
**Problem:** Assigning lessons one student at a time doesn't scale.

**Solution:** Sticky Action Toolbar with multi-select UI and Optimistic UI Updates. Batch API requests collapse N individual calls into one. React Query cache invalidation keeps the UI consistent after bulk operations.

**Result:** Assign or unassign lessons for 50+ students in **< 2 seconds**.

![Bulk Assignment](https://github.com/user-attachments/assets/d2901191-7c90-4f64-a0a7-d0b29ec77794)

---

### 9. Sequential Learning with Server-Side Gating
**Problem:** Client-side lesson locking can be bypassed by anyone with DevTools.

**Solution:** Access control enforced at both the Service Layer and Database Level. Lesson progression is validated server-side — no client-side state can unlock a lesson the student hasn't earned.

**Result:** Pedagogical integrity that cannot be circumvented.

<img alt="Sequential Learning" src="https://github.com/user-attachments/assets/61d815e0-a6df-4f0b-84da-5f57e915f919" />

---

### 10. Custom Video Player with Resizable Split-View
**Solution:** Custom video player (0.5x–2x speed) in a resizable split-view layout alongside lesson materials. CSS Grid dynamic columns handle the resize. Layout ratio is persisted in LocalStorage so students return to their preferred configuration.

**Result:** 60-70% query time reduction on lesson detail fetch via `JOIN FETCH` strategy. DTO projection cuts API payload by 60% (~5KB → ~2KB).

![Video Learning](https://github.com/user-attachments/assets/51dfbcc0-d5f5-41e0-811c-9011912a2ac7)

---

## Tech Stack

```
Frontend          Next.js 15 · React 19 · TypeScript 5
                  Tailwind CSS 4 · Shadcn/UI
                  TanStack Query v5 · Zustand · Framer Motion
                  React Hook Form · Zod · @dnd-kit

Backend           Spring Boot 3.4 · Java 21
                  JPA/Hibernate · MySQL 8.0
                  Caffeine Cache · Spring Events
                  JasperReports · Bucket4j · Groq AI

Communication     REST (JWT) · SSE · WebSocket (STOMP) · WebRTC P2P

Infrastructure    Docker Compose · Railway · Cloudinary
```

---

## Performance Benchmarks

| Module | Metric | Before | After |
|:-------|:-------|:------:|:-----:|
| Calendar | Initial load | ~1.8s | **< 0.8s** |
| Calendar | Month navigation | ~500ms | **~0ms** |
| Finance | Page load | ~2.5s | **< 0.8s** |
| Finance | Data consistency | Desync issues | **100% accurate** |
| Learning | Lesson detail query | 3 queries (N+1) | **1 query** |
| Learning | API payload | ~5KB | **~2KB** |
| Notifications | Delivery latency | — | **< 500ms** |
| Notifications | Unread count query | — | **< 10ms** |
| Bulk Calendar | 300+ session init | — | **< 800ms** |

---

## Architecture Decisions

**Modular Monolith over Microservices** — Single deployable unit with clear module boundaries. Faster to develop, simpler to operate, and straightforward to extract into services later if scale demands it.

**SSE over WebSocket for notifications** — Notifications flow in one direction. SSE is HTTP-native, proxy-transparent, and requires no handshake upgrade. WebSocket is reserved for the live room where true bidirectionality is needed.

**React Query over Redux** — All async state is server state. React Query's stale-while-revalidate, optimistic updates, and cache invalidation handle this natively. Redux would be ceremonial overhead.

---

## Security

| Layer | Implementation |
|:------|:--------------|
| Authentication | JWT + Refresh Token via HttpOnly cookies |
| Authorization | Dynamic RBAC — `RoleEntity` + `Permission` enum, `@PreAuthorize` per endpoint |
| Rate Limiting | Bucket4j on login and session creation endpoints |
| Input Validation | Zod (frontend) + Jakarta Validation (backend) |
| File Access | Cloudinary signed uploads, per-student document access control |
| Audit Trail | `AuditLogController` records every sensitive mutation |

---

## Roadmap

**Q2 2026**
- [ ] Multi-tenancy — expand to support multiple tutors (SaaS model)
- [ ] Bank API integration — auto-confirm payments when funds arrive
- [ ] Google Calendar two-way sync

**Q3 2026**
- [ ] Zalo/Telegram bot for automated debt reminders
- [ ] Learning analytics dashboard with progress trend prediction
- [ ] Voice-to-text session notes

---

## Local Setup

```bash
git clone https://github.com/longtq2501/Tutor-Pro.git

# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && ./mvnw clean install
docker-compose up -d

# App running at:
# Frontend → http://localhost:3000
# Backend  → http://localhost:8080
```

---

## Author

**Tôn Quỳnh Long** — Third-year IT student. Built this to solve my own problems as a part-time tutor. Currently maintaining this alongside a second project as Tech Lead (6-member team, flood rescue coordination system).

📧 tonquynhlong05@gmail.com  
🔗 [GitHub](https://github.com/longtq2501) · [LinkedIn](https://www.linkedin.com/in/ton-quynh-long-dev) 

---

*If this project saved you time or sparked ideas — a ⭐ goes a long way.*
