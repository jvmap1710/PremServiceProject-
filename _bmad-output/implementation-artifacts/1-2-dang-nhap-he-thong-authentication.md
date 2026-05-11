# Story 1.2: Đăng nhập hệ thống (Authentication)

Status: in-progress

## Story

As a Người dùng (Sếp, TAS, DEV),
I want đăng nhập vào hệ thống bằng tài khoản được cấp,
so that tôi có thể truy cập vào các chức năng làm việc của mình.

## Acceptance Criteria

1. Người dùng có thể truy cập trang `/login`.
2. Hệ thống xác thực bằng Username và Password thông qua NextAuth v5 (Auth.js).
3. Đăng nhập thành công sẽ chuyển hướng về trang Dashboard (`/`).
4. Đăng nhập thất bại hiển thị thông báo lỗi rõ ràng.
5. Session người dùng được bảo vệ bởi Middleware (không thể vào `/` nếu chưa login).
6. Thông tin người dùng (Role) được lưu trong session để phân quyền sau này.

## Tasks / Subtasks

- [ ] Install Auth.js dependencies
  - [ ] `npm install next-auth@beta`
- [ ] Update Schema & Seed Data
  - [ ] Add `User` model to `prisma/schema.prisma`.
  - [ ] Run `npx prisma db push`.
  - [ ] Create seed script and add a test user.
- [ ] Configure Auth.js
  - [ ] Create `src/auth.ts` (Auth.js configuration).
  - [ ] Create `src/middleware.ts`.
- [ ] Implement UI
  - [ ] Create `src/app/login/page.tsx` (Login form).
  - [ ] Implement Server Action for login in `src/actions/auth.ts`.
- [ ] Verification
  - [ ] Verify login flow manually.
  - [ ] (Optional) Add unit tests for auth logic.

## Dev Notes

- **Auth.js v5**: Sử dụng `CredentialsProvider` vì đây là hệ thống nội bộ, không dùng OAuth.
- **Passwords**: Cần hash password bằng `bcryptjs`.
- **Roles**: Sẽ có 3 role: `ADMIN` (Sếp), `TAS`, `DEV`.

## Dev Agent Record

### Agent Model Used

Antigravity (Amelia)

### Completion Notes List

- [2026-05-07] Khởi tạo Story 1.2.
