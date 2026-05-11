# Lessons Learned & Prevention Log

This document tracks mistakes made during development to prevent recurrence and ensure higher code quality.

## 1. Environment & Database Sync
- **Mistake**: Forgetting to restart the development server or regenerate Prisma client after schema changes.
- **Consequence**: `PrismaClientValidationError` or "Unknown field" errors in UI.
- **Prevention**: ALWAYS run `npx prisma db push && npx prisma generate` and **restart the npm run dev process** immediately after any `.prisma` file modification.

## 2. Server Actions & UI Integration
- **Mistake**: Renaming or adding server actions but forgetting to update the `import` statements in Client Components.
- **Consequence**: `ReferenceError: [actionName] is not defined` at runtime.
- **Prevention**: After modifying any file in `src/actions/`, perform a global search or check all dependent UI components to ensure imports are synced.

## 3. Data Integrity & Backfilling
- **Mistake**: Adding new fields (like `status`) and calling methods (like `.toLowerCase()`) on them without checking for `undefined` in existing records.
- **Consequence**: `TypeError: Cannot read properties of undefined`.
- **Prevention**: Use null-checks or logical OR operators for all field access that might be missing in older database records (e.g., `(item.status || "TODO").toLowerCase()`).

## 4. Shell Compatibility (Windows/PowerShell)
- **Mistake**: Using `&&` for sequential commands in older PowerShell versions or certain environments where it's not supported.
- **Consequence**: Command parsing errors.
- **Prevention**: Use `;` as a statement separator in PowerShell commands unless specifically targeting a shell that supports `&&`.

## 5. Implementation Workflow
- **Rule**: Plan first, document in Markdown, get approval, then implement.
- **Prevention**: Never skip the "Approval" phase for major features or architectural changes.
