# TaskMaster Evaluation Criteria

This document outlines the evaluation criteria for each phase of the TaskMaster project development. It serves as a checklist for developers and reviewers to verify that functional, architectural, and quality standards have been met.

## Phase 1: Project Setup & Core Foundation

**Functional Requirements:**
- [ ] Database (PostgreSQL/MongoDB) is successfully configured, connected, and schemas are defined.
- [ ] User registration endpoint securely hashes passwords (e.g., using bcrypt) before database insertion.
- [ ] User login endpoint generates and returns a valid JWT upon successful authentication.
- [ ] Protected routes successfully validate the JWT and reject unauthorized access with `401 Unauthorized`.
- [ ] Email/Username uniqueness is enforced at the database and API level (`409 Conflict`).

**Code Quality & Architecture:**
- [ ] Project structure follows a modular architecture (e.g., separating Routes, Controllers, Services, Models).
- [ ] A global error handler is implemented to return standardized API JSON responses.
- [ ] Environment variables (DB credentials, JWT secrets, Ports) are managed via `.env` and not hardcoded.

## Phase 2: User Profiles & Core Task Management

**Functional Requirements:**
- [ ] Users can retrieve (`GET`) and update (`PUT`) their own profile information.
- [ ] Task CRUD operations (Create, Read, Update, Delete) function correctly.
- [ ] Fetching tasks (`GET /api/tasks`) supports filtering (e.g., `?status=Open`) and searching (e.g., `?search=keyword`).
- [ ] Input validation (e.g., Zod, Joi) prevents creating tasks with missing required fields or invalid enum statuses.

**Code Quality & Architecture:**
- [ ] Appropriate RESTful HTTP methods and status codes are used for all operations.
- [ ] Edge cases (e.g., updating a non-existent task) are handled gracefully with `404 Not Found`.
- [ ] Pagination is implemented for task retrieval endpoints to ensure scalability.

## Phase 3: Team Collaboration & Assignments

**Functional Requirements:**
- [ ] Users can create teams and add/invite other members to those teams.
- [ ] Tasks can be successfully assigned to teams and specific team members.
- [ ] **Data Isolation:** Authorization logic ensures users can only view, edit, or delete tasks for teams they are a part of (`403 Forbidden` if violated).
- [ ] System prevents assigning a task to a user who does not belong to the associated team.

**Code Quality & Architecture:**
- [ ] Entity relationships (User-Team, Team-Task) are correctly modeled in the database (with proper foreign keys and indexes).
- [ ] Circular dependencies between Team and Task modules are avoided.

## Phase 4: Comments & Attachments

**Functional Requirements:**
- [ ] Users can add (`POST`) and retrieve (`GET`) comments for specific tasks.
- [ ] File uploads (attachments) are processed correctly and file metadata/URLs are associated with tasks.
- [ ] The system restricts upload MIME types (e.g., no executables like `.exe` or `.bat`) and enforces reasonable file size limits.

**Code Quality & Architecture:**
- [ ] File storage logic is abstracted (e.g., via a Storage Service interface), allowing easy switching between local disk and cloud storage (AWS S3).
- [ ] Upload failures or cloud storage sync issues are handled cleanly, ensuring no orphaned database records exist.

## Phase 5: Optional Extensions & Final Polish

**Functional Requirements:**
- [ ] **WebSockets (Optional):** Connected clients receive real-time notifications for task updates/assignments without significant memory leaks.
- [ ] **AI Integration (Optional):** AI generation successfully creates task descriptions and handles external API timeouts/rate limits gracefully.
- [ ] The project includes comprehensive setup documentation (README) and API documentation (Swagger, Postman Collection, or Markdown).

**Code Quality & Architecture:**
- [ ] Code is clean, DRY (Don't Repeat Yourself), well-commented, and free of debug `console.log` or dead code.
- [ ] The repository is properly version-controlled with a clean Git commit history.
- [ ] Security best practices (preventing NoSQL/SQL Injection, XSS mitigation) are verified.
