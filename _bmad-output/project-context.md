# Project Context: PremiumService

Critical rules, patterns, and guidelines for AI agents implementing the PremiumService management system.

## 1. Core Principles (Karpathy Guidelines)

All AI agents MUST follow these behavioral guidelines to ensure high-quality, surgical, and simple code:

- **Think Before Coding**: Explicitly state assumptions. Surface tradeoffs. Don't hide confusion.
- **Simplicity First**: Minimum code that solves the problem. No speculative features or abstractions.
- **Surgical Changes**: Touch only what you must. Match existing style. No unrelated refactoring.
- **Goal-Driven Execution**: Define verifiable success criteria (tests) and loop until verified.
- **Strict Environment Sync**: ALWAYS run `npx prisma db push && npx prisma generate` and **RESTART the development server** after any schema changes or completing a story to prevent caching and validation errors.

## 2. Technical Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Microsoft SQL Server
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **UI Components**: Tremor (for charts), Shadcn UI
- **Auth**: NextAuth.js v5 (Beta)

## 3. Project Structure & Boundaries

Follow the directory structure defined in the Architecture document:

- `src/app`: App Router pages and layouts.
- `src/actions`: Server Actions for all data mutations and logic.
- `src/components/ui`: Shadcn UI components.
- `src/components/dashboard`: Feature-specific components.
- `src/lib`: Shared utilities (Prisma client, etc.).
- `src/schemas`: Zod schemas for validation.
- `src/types`: TypeScript definitions.

## 4. Implementation Rules

- **Server Actions**: All database mutations and business logic MUST go through Server Actions.
- **Prisma**: PascalCase for Tables, camelCase for Columns.
- **Evidence Storage**: Images/files MUST be stored as `VARBINARY(MAX)` in SQL Server (with compression).
- **Security**: Always verify user roles server-side in Server Actions. Encrypt salary/sensitive data.
- **Performance**: Dashboards must load in < 2 seconds.

## 5. Verification

- Use Vitest/Playwright for testing (as decided in Sprint Plan).
- Every PR/Story implementation MUST include failing tests (Red) then passing tests (Green).

## 6. Operational Guidelines

- **Force Reset & Dev Server**: Whenever a `--force-reset` or any destructive schema change is applied to Prisma, ALWAYS restart the Next.js development server immediately afterwards to prevent caching issues and unexpected runtime errors.
- **Automation Reminder**: Before handing over or declaring a task "DONE", verify that the database is in sync and the server has been refreshed with the latest client generation.

## 7. Developer Safety Rails & Critical Lessons

- **Prisma & Server Lifecycle**: ALWAYS run `npx prisma db push && npx prisma generate` followed by a **manual server restart** after any schema changes. Next.js cache can be stubborn with Prisma client updates.
- **Null-Safe Data Access**: When accessing fields like `status` or `description`, always provide fallbacks (e.g., `item.status || "TODO"`) to prevent crashes on legacy database records.
- **Import Sync**: Every time a Server Action is added or modified in `src/actions/`, immediately verify all `import` statements in the UI components that consume it.
- **PowerShell Compatibility**: Use `;` instead of `&&` for multi-command strings in Windows environments to ensure reliable execution.
- **Workflow Integrity**: Plan -> Artifact -> User Approval -> Implementation. Never skip the planning phase for non-trivial changes.
