# Story 1.3: Phân quyền & Bảo mật Middleware (RBAC)

Status: done

## Story

As a Quản trị viên,
I want hệ thống tự động kiểm tra quyền truy cập của người dùng,
so that đảm bảo DEV không thể xem dữ liệu lương và Sếp có toàn quyền điều hành.

## Acceptance Criteria

1. Hệ thống nhận diện được 3 Role: `ADMIN` (Sếp), `TAS`, `DEV`.
2. Middleware (Proxy) chặn các truy cập không đúng quyền:
   - Route `/admin/**` chỉ dành cho `ADMIN`.
   - Các Role khác truy cập vào `/admin` sẽ bị chuyển hướng về `/`.
3. Server Actions kiểm tra quyền một lần nữa ở phía server để đảm bảo bảo mật.
4. Giao diện hiển thị thông báo "Không có quyền truy cập" nếu người dùng cố tình vào link không được phép.

## Tasks / Subtasks

- [ ] Define Role constants and helpers
  - [ ] Create `src/types/auth.ts` for role definitions.
- [ ] Implement RBAC logic in Middleware
  - [ ] Update `authorized` callback in `src/auth.config.ts`.
- [ ] Create Protected Test Page
  - [ ] Create `src/app/admin/page.tsx`.
- [ ] Verification
  - [ ] Test access with `ADMIN` user.
  - [ ] Test access with a `DEV` user (need to create one).

## Dev Notes

- **NextAuth v5 Middleware**: Sử dụng `auth` callback trong `auth.config.ts` là cách hiệu quả nhất để chặn route ở Edge level.
- **Server-side check**: Luôn phải có `const session = await auth()` bên trong các Page hoặc Server Action nhạy cảm.

## Dev Agent Record

### Agent Model Used

Antigravity (Amelia)

### Completion Notes List

- [2026-05-07] Khởi tạo Story 1.3.
- [2026-05-07] Đã triển khai logic RBAC trong `auth.config.ts`.
- [2026-05-07] Đã tạo trang `/admin` và kiểm chứng việc chặn truy cập đối với Role `DEV` thành công.
