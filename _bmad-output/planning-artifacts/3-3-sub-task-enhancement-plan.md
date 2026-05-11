# Plan: Story 3.3 Enhancement - Sub-task Details & Inline Edit

## 🚀 Objective
Nâng cấp Sub-tasks để hỗ trợ nhập mô tả chi tiết và chỉnh sửa thông tin thông qua một cửa sổ con (Small Modal/Popover), giúp DEV nắm bắt yêu cầu cụ thể hơn cho từng đầu việc nhỏ.

## 🛠 Proposed Changes

### 1. Database & Action
- **Model**: Đã có trường `description` trong bảng `SubTask`.
- **Action**: Sử dụng hàm `updateSubTask` đã có sẵn trong `src/actions/subtask.ts`.

### 2. UI/UX Enhancement (`RequestDetailView.tsx`)
- **Indicator**: Hiển thị icon `AlignLeft` nhỏ cạnh tiêu đề Sub-task nếu có mô tả.
- **Trigger**: Thêm nút `Edit` (icon `ExternalLink` hoặc `Edit3`) ở mỗi dòng Sub-task.
- **Edit Modal**: 
  - Tạo một Modal nhỏ (`SubTaskEditModal`) chứa:
    - Input: Tiêu đề Sub-task.
    - Textarea: Mô tả chi tiết (nơi ghi chú kỹ thuật, link tài liệu...).
    - Button: "Lưu thay đổi" & "Hủy".

### 3. Implementation Steps
1.  **Add State**: Thêm `editingSubTask` state để lưu Sub-task đang được chọn để chỉnh sửa.
2.  **Modal Integration**: Tận dụng component `Modal` đã có để hiển thị form edit.
3.  **Update Logic**: Gọi `updateSubTask` khi nhấn Save trong Modal, cập nhật local state để UI thay đổi ngay lập tức.
4.  **Polish**: Thêm hiệu ứng transition khi mở modal để cảm giác "premium".

## ✅ Success Criteria
- [ ] Người dùng có thể nhập/sửa nội dung và mô tả của Sub-task.
- [ ] Thông tin mô tả được lưu vào DB và hiển thị lại chính xác.
- [ ] Giao diện Modal gọn gàng, không làm rối màn hình chi tiết chính.

---
*Amelia sẽ bắt đầu triển khai ngay khi anh duyệt kế hoạch này!*
