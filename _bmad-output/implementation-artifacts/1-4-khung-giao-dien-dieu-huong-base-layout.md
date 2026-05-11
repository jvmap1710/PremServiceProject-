# Story 1.4: Khung giao diện & Điều hướng (Base Layout)

Status: done

## Story

As a Người dùng,
I want một giao diện có Sidebar và Header chuyên nghiệp,
so that tôi có thể dễ dàng di chuyển giữa các tính năng (Khách hàng, Yêu cầu, Báo cáo).

## Acceptance Criteria

1. Giao diện bao gồm Sidebar (bên trái) và Header (phía trên).
2. Sidebar hiển thị các mục Menu tương ứng với Role của người dùng:
   - `ADMIN`: Dashboard, Khách hàng, Yêu cầu, Báo cáo, Quản trị (Admin).
   - `TAS`: Dashboard, Khách hàng, Yêu cầu, Báo cáo.
   - `DEV`: Dashboard, Yêu cầu.
3. Header hiển thị tên người dùng và nút Đăng xuất.
4. Giao diện tuân thủ phong cách Light Theme (sáng, sạch sẽ) từ bản mẫu.
5. Sidebar có thể thu gọn (collapsible) hoặc ẩn trên mobile.
6. Sử dụng Icon phù hợp cho từng mục menu (lucide-react).

## Tasks / Subtasks

- [ ] Create UI Components
  - [ ] Create `src/components/layout/Sidebar.tsx`.
  - [ ] Create `src/components/layout/Header.tsx`.
  - [ ] Create `src/components/layout/MainLayout.tsx`.
- [ ] Implement Menu Logic
  - [ ] Define menu structure in `src/lib/menu-items.ts`.
- [ ] Integrate into App
  - [ ] Update `src/app/layout.tsx` to include `MainLayout` for authenticated routes.
- [ ] Verification
  - [ ] Verify menu visibility for different roles.

## Dev Notes

- **Layout Strategy**: Sử dụng Layout lồng nhau (Nested Layouts) nếu cần, hoặc kiểm tra session ngay trong `src/app/layout.tsx`.
- **Styling**: Tham khảo `sample_web_template.png` cho màu sắc và khoảng cách.

## Dev Agent Record

### Agent Model Used

Antigravity (Amelia)

### Completion Notes List

- [2026-05-07] Khởi tạo Story 1.4.
