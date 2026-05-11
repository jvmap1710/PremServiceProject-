---
title: Email Notifications & Admin Settings Enhancement
status: draft
epic: 6
story: 1
description: Fix redirect issues, enhance admin settings UI, and implement email notifications for key system events.
---

# spec-6-1-email-notifications.md

## Context
The user is implementing email notifications for the Premium Service system. Currently, the admin area redirects to the dashboard (likely due to misconfigured middleware or RBAC), and the notification logic is missing.

## Requirements
- [ ] Fix the redirect issue (rename `src/proxy.ts` to `src/middleware.ts`).
- [ ] Update `src/app/admin/page.tsx` with a professional Settings UI.
- [ ] Implement `src/lib/notifications.ts` for standardized email sending.
- [ ] Integrate notifications into:
    - [ ] New Request creation (`src/actions/request.ts`).
    - [ ] Request Status change (`src/actions/request.ts` or `src/actions/kanban.ts`).
    - [ ] New Comment added (`src/actions/comment.ts`).

## Technical Design
### 1. Middleware
Rename `src/proxy.ts` -> `src/middleware.ts`. This ensures NextAuth's `authorized` callback is executed.

### 2. Notification Service
Create `src/lib/notifications.ts`:
- `notifyNewRequest(request, recipientEmail)`
- `notifyStatusChange(request, newStatus, recipientEmail)`
- `notifyNewComment(request, comment, recipientEmail)`

### 3. Admin Page
Update `src/app/admin/page.tsx` to include:
- A "Settings" card with a link to "Email Configuration".
- A "User Management" card (placeholder for now).

## Acceptance Criteria
- [ ] Admin can access `/admin/settings/email` without being redirected to `/`.
- [ ] Saving email settings works and reflects in the DB.
- [ ] Test email sending works from the UI.
- [ ] Creating a new request sends an email notification (mocked for now in dev, but calling the service).
- [ ] Changing status in Kanban sends an email notification.
- [ ] Adding a comment sends an email notification.
