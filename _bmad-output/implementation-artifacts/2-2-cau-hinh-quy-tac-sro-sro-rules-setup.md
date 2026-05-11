# Story 2.2 & 2.3: Quản lý Gói Premium (PremiumPackage) & Cấu hình SRO, Quota

Status: in-progress

## Story

As a TAS,
I want tạo các Gói Premium (PremiumPackage) cho từng Khách hàng và cấu hình định mức Quota cùng bộ quy tắc SRO riêng biệt,
So that hệ thống có thể theo dõi chính xác thời gian và loại công việc theo từng hợp đồng/gói dịch vụ cụ thể.

*(Gộp Story 2.2 và 2.3 vì kiến trúc Database đã thay đổi: SRO Rules và Quota giờ thuộc về PremiumPackage thay vì Client)*

## Acceptance Criteria

1. Khi bấm vào chi tiết một Khách hàng (từ trang `/clients`), chuyển hướng đến trang Quản lý Gói Premium của khách hàng đó (`/clients/[id]`).
2. Có thể tạo mới một `PremiumPackage` (Tên gói, Năm, Quota hàng tháng).
3. Có thể cấu hình danh sách các `SRORule` (Loại công việc, Estimate hours) bên trong một `PremiumPackage`.
4. Giao diện thiết kế theo dạng Master-Detail hoặc các Section rõ ràng bên trong trang chi tiết Khách hàng.
5. Thông tin được lưu vào SQL Server qua Prisma.

## Tasks / Subtasks

- [ ] Cập nhật Prisma Schema
  - [ ] Thêm trường `monthlyQuota` (Int) vào `PremiumPackage`.
  - [ ] Thêm Model `SRORule` liên kết 1-nhiều với `PremiumPackage` (Tên task, estimateHours).
  - [ ] Chạy migration (`prisma db push` và `generate`).
- [ ] Giao diện (UI)
  - [ ] Cập nhật `src/app/clients/page.tsx` để thẻ tên Khách hàng (hoặc icon) có thể click chuyển sang `/clients/[id]`.
  - [ ] Tạo trang `/clients/[id]/page.tsx` hiển thị chi tiết Client và danh sách PremiumPackages.
  - [ ] Thêm Form tạo PremiumPackage và cấu hình SRO Rules.
- [ ] Server Actions
  - [ ] Viết hàm `createPremiumPackage` và `addSRORule` trong `src/actions/package.ts`.

## Dev Agent Record

### Agent Model Used

Antigravity (Amelia)

### Completion Notes List

- [2026-05-07] Khởi tạo Story 2.2 & 2.3, điều chỉnh logic theo feedback của user về kiến trúc PremiumPackage.
