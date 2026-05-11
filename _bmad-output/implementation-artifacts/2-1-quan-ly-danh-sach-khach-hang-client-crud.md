# Story 2.1: Quản lý danh sách khách hàng (Client CRUD)

Status: done

## Story

As a TAS (Trang),
I want tạo và quản lý thông tin các khách hàng Premium,
so that tôi có thể gán các yêu cầu dịch vụ cho đúng đối tượng.

## Acceptance Criteria

1. Chỉ có Role `TAS` và `ADMIN` mới có thể truy cập trang Quản lý Khách hàng.
2. Hiển thị danh sách khách hàng (Tên, Mã khách hàng, Trạng thái hoạt động).
3. Cho phép thêm mới khách hàng (Create) với Tên và Mã khách hàng.
4. Thông tin khách hàng được lưu vào SQL Server thông qua Prisma.
5. Giao diện (UI) sử dụng Server Actions để xử lý form và revalidate dữ liệu, không cần tạo API Route riêng.
6. Thiết kế UI đồng bộ với phong cách Premium (Light theme, table/list sạch sẽ).

## Tasks / Subtasks

- [ ] Cập nhật Prisma Schema
  - [ ] Thêm Model `Client` (id, name, code, isActive).
  - [ ] Chạy migration (`prisma db push` hoặc `generate`).
- [ ] Xây dựng Server Actions
  - [ ] Viết hàm `createClient` trong `src/actions/client.ts`.
  - [ ] Viết hàm `getClients` (nếu cần tách) hoặc gọi trực tiếp trong Server Component.
- [ ] Giao diện (UI)
  - [ ] Xóa placeholder ở `src/app/clients/page.tsx` và thay bằng danh sách.
  - [ ] Thêm Form tạo mới khách hàng (có thể dùng Dialog/Modal hoặc giao diện chia cột).
- [ ] Kiểm thử
  - [ ] Test tạo mới thành công.

## Dev Notes

- **Prisma & SQL Server**: Khi sửa schema, nhớ dùng `npx prisma db push` (với `--accept-data-loss` nếu đang dev) và `npx prisma generate` vì chúng ta đang dùng driver adapter v7.
- **Next.js 15**: Dùng Server Component cho trang danh sách (async component) và Server Action trực tiếp cho form submit.

## Dev Agent Record

### Agent Model Used

Antigravity (Amelia)

### Completion Notes List

- [2026-05-07] Khởi tạo Story 2.1.
