# Story 3.3: Chia nhỏ công việc (Sub-tasks)

## 🚀 Overview
**As a** Developer (DEV),
**I want** chia một yêu cầu lớn thành các đầu việc nhỏ (Sub-tasks),
**So that** tôi có thể quản lý tiến độ chi tiết hơn.

## 🎯 Acceptance Criteria
- [ ] **AC 1**: Người dùng có thể xem danh sách Sub-tasks trong popup chi tiết yêu cầu (RequestDetailView).
- [ ] **AC 2**: Có ô nhập liệu "Thêm Sub-task" để tạo nhanh đầu việc mới.
- [ ] **AC 3**: Mỗi Sub-task có checkbox để đánh dấu trạng thái "Hoàn thành" (DONE) hoặc "Cần làm" (TODO).
- [ ] **AC 4**: Trạng thái được cập nhật ngay lập tức (Optimistic UI) và đồng bộ với Server qua Server Actions.
- [ ] **AC 5**: Có nút xóa Sub-task để loại bỏ các đầu việc không cần thiết.

## 🛠 Technical Context
- **Files to Modify**: 
  - `src/app/requests/[id]/RequestDetailView.tsx` (UI hiển thị và tương tác)
- **Files to Use**:
  - `src/actions/subtask.ts` (Đã có sẵn `createSubTask`, `updateSubTask`, `deleteSubTask`)
- **Schema Reference**:
  ```prisma
  model SubTask {
    id          String   @id @default(cuid())
    requestId   String
    request     ServiceRequest @relation(...)
    content     String   @db.NVarChar(Max)
    status      String   @default("TODO") // TODO, DONE
    isDone      Boolean  @default(false)
    ...
  }
  ```

## 🏗 Implementation Plan
1.  **UI Component**: Tạo component `SubTaskList` bên trong `RequestDetailView.tsx`.
2.  **Add Logic**: Gắn Server Action `createSubTask` vào form thêm mới.
3.  **Toggle Logic**: Gắn Server Action `updateSubTask` vào checkbox (cập nhật cả `status` và `isDone`).
4.  **Delete Logic**: Gắn Server Action `deleteSubTask`.
5.  **Optimistic UI**: Sử dụng `useState` để cập nhật danh sách local ngay khi người dùng thao tác trước khi Server phản hồi.

## 📅 Status
- **Priority**: High
- **Status**: ready-for-dev
- **Assigned To**: Amelia (Senior SE)
