# Story 1.1: Khởi tạo dự án & Kết nối Database (Scaffolding)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a Developer (Amelia),
I want khởi tạo mã nguồn Next.js 15 và cấu hình Prisma kết nối SQL Server,
so that tôi có nền tảng kỹ thuật để bắt đầu lập trình các tính năng.

## Acceptance Criteria

1. Dự án Next.js 15 được khởi tạo với App Router, TypeScript, Tailwind CSS, và ESLint.
2. Cấu hình file `schema.prisma` với provider là `sqlserver`.
3. Kết nối thành công với SQL Server (thông qua chuỗi kết nối trong file .env).
4. Có thể thực hiện `npx prisma db pull` hoặc `push` để kiểm tra kết nối.
5. Cấu hình cấu trúc thư mục dự án theo bản Kiến trúc (src/actions, src/app, src/components, etc.).

## Tasks / Subtasks

- [x] Initialize Next.js project
  - [x] Run `npx create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm`
- [x] Setup Prisma
  - [x] Install `prisma` and `@prisma/client`
  - [x] Run `npx prisma init`
  - [x] Configure `datasource db` in `schema.prisma` to use `sqlserver`
- [x] Create Folder Structure
  - [x] Create `src/actions`, `src/components/ui`, `src/components/dashboard`, `src/hooks`, `src/lib`, `src/schemas`, `src/types`
- [x] Setup Environment Variables
  - [x] Create `.env` and `.env.example` with `DATABASE_URL` placeholder

## Dev Notes

- **Tech Stack**: Next.js 15, Prisma, SQL Server.
- **Project Structure**: Tuân thủ sơ đồ tại [Architecture Document](file:///_bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries).
- **SQL Server**: Cần chuỗi kết nối từ JV để kiểm tra bước cuối.
- **Image Storage**: Quyết định lưu Evidence vào DB dạng VARBINARY(MAX) sẽ ảnh hưởng đến schema ở các story sau.

### Project Structure Notes

- Alignment with unified project structure: `src/` directory used as root for app code.
- `src/actions` for Server Actions.

### References

- [Architecture: Project Structure](file:///_bmad-output/planning-artifacts/architecture.md#Complete-Project-Directory-Structure)
- [PRD: Technical Stack](file:///_bmad-output/planning-artifacts/prd.md#Technical-Stack)

## Dev Agent Record

### Agent Model Used

Antigravity v1.0

### Debug Log References

### Completion Notes List

- [2026-05-07] Khởi tạo thành công Next.js 15.
- [2026-05-07] Cài đặt Prisma v7.8.0. Lưu ý: Prisma v7 yêu cầu file `prisma.config.ts` để cấu hình DB URL (không còn để trong `schema.prisma`).
- [2026-05-07] Đã test kết nối SQL Server thành công bằng lệnh `npx prisma db push`.
- [2026-05-07] Đã tạo đầy đủ cấu trúc thư mục `src/` theo thiết kế.

### File List

- `package.json`
- `prisma.config.ts`
- `prisma/schema.prisma`
- `.env`
- `src/app/`
- `src/actions/`
- `src/components/`
- `src/lib/`
- `src/schemas/`
- `src/types/`
- `_bmad-output/project-context.md`
