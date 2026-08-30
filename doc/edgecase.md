# TaskMaster Edge Cases & Error Handling Guide

This document outlines potential edge cases, unexpected user behaviors, system error scenarios, and architectural constraints to consider during the implementation of the TaskMaster backend. It synthesizes requirements from both the `implementation-plan.md` and the `architecture-design.md`.

## 1. System Architecture & Infrastructure Edge Cases

*   **Component Failures:** The database, WebSocket server, or File Storage (e.g., AWS S3) becomes temporarily unavailable. The application server should handle connection timeouts gracefully, utilizing global error handlers to return `503 Service Unavailable` rather than crashing the node process or Spring Boot application.
*   **WebSocket Bottlenecks:** Memory leaks or excessive concurrent connections to the `ws://domain/notifications` server causing application performance degradation. The WebSocket server needs a strategy for ping/pong heartbeats and dropping idle connections.
*   **API Gateway / Rate Limiting:** Clients making excessive requests (e.g., brute-forcing `POST /api/auth/login`). The system must implement rate limiting middleware to prevent DDoS attacks and resource exhaustion.

## 2. Data Model & Referential Integrity

*   **Cascading Deletes (Orphaned Data):**
    *   What happens to `TASK`, `COMMENT`, and `ATTACHMENT` records when a `USER` is deleted? (Consider implementing "soft deletes" using a `deleted_at` timestamp, or reassigning to a system user to preserve historical team data).
    *   What happens to a `TASK` if the associated `TEAM` is deleted?
*   **Foreign Key Violations:** Attempting to assign a task to a `uuid assigned_to` that does not exist in the `USER` table, or associating a comment/attachment with a non-existent `task_id`.
*   **UUID Collisions / Invalid Formats:** Endpoints like `/api/tasks/:taskId` receiving malformed UUIDs. The input validation layer (e.g., Zod, Joi, or Spring Bean Validation) must catch this before database queries are executed to prevent database-level cast errors.

## 3. Phase-by-Phase Application Edge Cases

### Phase 1: Core Foundation & Authentication (`Auth Module`)
*   **Registration Conflicts:** Attempting to register with an email that already exists. Must return `409 Conflict`.
*   **Token Expiry & Security:** Accessing secure routes with an expired or tampered JWT. Must return `401 Unauthorized`. Consideration is needed for token revocation on `POST /api/auth/logout` (e.g., using a Redis blocklist or relying on short-lived JWTs + refresh tokens).
*   **Case Sensitivity:** `User@test.com` and `user@test.com` should map to the same account during registration and login.

### Phase 2: Task Management (`Task & User Modules`)
*   **Data Validation:** 
    *   Creating a task with an empty title, or a description exceeding the text limits in the database.
    *   Invalid status transitions (e.g., sending `status: "Super Done"` instead of the allowed enums `Open`, `InProgress`, `Completed`).
*   **Search and Filter Extremes:**
    *   Providing invalid query parameters in `GET /api/tasks` (e.g., `?status=Unknown`).
    *   Pagination extremes: requesting `?page=1000000` leading to deep pagination performance degradation. Default limits should be enforced.
*   **Concurrent Updates:** Two users editing the same task at the exact same time via `PUT /api/tasks/:taskId`. Consider optimistic locking (e.g., using a version number or `updated_at` timestamp check).

### Phase 3: Team Collaboration (`Team Module`)
*   **Cross-Team Assignment:** Assigning a task (`PATCH /api/tasks/:taskId/assign`) to a user who is *not* present in the `TEAM_MEMBER` list for the team that owns the task.
*   **Unauthorized Access (Data Isolation):** A user attempting to `GET` or `PUT` a `taskId` or `teamId` they do not have access to based on their team memberships. Must return `403 Forbidden` or `404 Not Found` (to prevent data enumeration).
*   **Permission Escalation:** A regular `Member` attempting to perform `Admin` actions, like adding users to a team or deleting the team.

### Phase 4: Comments & Attachments (`Collaboration Module`)
*   **File Upload Limits:** Uploads via `POST /api/tasks/:taskId/attachments` exceeding maximum payload size or storage quota. Must be intercepted by the middleware (e.g., `multer` or `MultipartFile`) before memory exhaustion.
*   **Malicious File Types:** Uploading dangerous file extensions (`.exe`, `.sh`). The system should restrict MIME types.
*   **Storage Out-of-Sync:** A file is successfully uploaded to the File Store, but the database insert for the `ATTACHMENT` record fails. A cleanup mechanism or distributed transaction strategy is needed to prevent dangling files.

### Phase 5: Optional Extensions (`AI & Notification Modules`)
*   **AI Service Timeouts:** The external OpenAI API for `POST /api/tasks/generate-description` is down or rate-limited. Should fail gracefully, informing the user without breaking core app functionality.
*   **Notification Spam:** Rapidly toggling a task status causing a flood of WebSocket events to clients.

## 4. Security & Best Practices Verification
*   **XSS & Injection:** Ensure `text content` in comments or task descriptions are sanitized when returned to the client to prevent Cross-Site Scripting (XSS). Use parameterized queries or ORMs (Prisma/Hibernate) to prevent SQL injection.
