# Project Context: Premium Service Management

## 🚀 Environment Configuration
- **Development Port**: Always use **Port 9999** to avoid conflicts with other local services.
- **Run Command**: `npm run dev -- -p 9999`

## 🛠 Technical Stack
- **Framework**: Next.js 15 (Turbopack)
- **Database**: SQL Server via Prisma
- **Auth**: NextAuth.js (Credentials Provider)
- **UI**: Vanilla CSS + Tailwind (selective) + Lucide Icons

## 📌 Development Notes (Amelia's Log - 10/05/2026)
- **SRO Rules**: Scope and Exclusions are NOT auto-filled from templates; they are intended for manual entry by TAS.
- **Kanban Board**:
  - Columns have a minimum width of 250px and are flexible.
  - Sidebar state (collapsed/expanded) is persisted in `localStorage` under the key `sidebar-collapsed`.
  - Cards use a `10px` left border for color-based status recognition.
- **UI/UX Standards (TAS Edition)**:
  - **Grid Layout**: Request Detail must use a strictly defined **8:4 split** (Left: Operational / Right: Sidebar).
  - **Aesthetics**: 
    - Use `rounded-[32px]` for main cards.
    - Typography: Use `font-black` for headers and `tracking-widest` for uppercase labels.
    - Color Palette: Indigo/Emerald/Slate for main flows, Purple for Evidence.
  - **Responsiveness**: Ensure the 8:4 grid collapses to 1 column on mobile.
- **Sub-tasks (Story 3.3)**: Fully implemented with Inline Edit, Status Toggle, and Optimistic UI.
- **Discussion System**: Uses `revalidatePath` and client-side optimistic state updates to ensure comments appear immediately and persist after refresh.

## 📅 Last Session Summary
- **Story 3.4 (Profitability Safeguard)**: Đã triển khai cảnh báo rủi ro lợi nhuận khi tạo Request.
- **Story 4.1 (Log Time)**: Đã triển khai tính năng ghi nhận thời gian thực tế cho từng yêu cầu và Sub-task.
    - Cập nhật Schema Prisma (model WorkLog).
    - Tạo Server Actions xử lý thêm/xóa log time.
    - Tích hợp UI vào RequestDetailView với tính năng tính tổng giờ thực tế.

## 🎯 Future Roadmap & Architectural Notes
- **Kanban Concurrency Control (Optimistic Concurrency Control - OCC)**:
  - **Mục tiêu**: Ngăn chặn lỗi đụng độ ghi đồng thời (Lost Update / Write-Write Conflict) khi nhiều người dùng cùng kéo thả các thẻ trên bảng Kanban tại cùng một thời điểm.
  - **Giải pháp lựa chọn (Option 1 - OCC)**: Thiết kế giải pháp kiểm soát lạc quan siêu nhẹ và an toàn (không dùng WebSockets để tránh nặng server).
  - **Hướng dẫn triển khai chi tiết cho phiên làm việc tiếp theo**:
    1. **Prisma Schema**: Thêm trường `version Int @default(1)` vào model quản lý thẻ (ví dụ `Request` hoặc `Task`).
    2. **API/Action Update**: Khi cập nhật trạng thái (drag and drop), viết câu lệnh kiểm tra `version` gửi lên từ client phải khớp với `version` hiện tại trong DB. Nếu khớp, tiến hành cập nhật trạng thái và tự động tăng `version` thêm 1 đơn vị (`version: { increment: 1 }`).
    3. **Error Handling**: Nếu version không khớp (trả về count = 0), chặn đứng hành động, không ghi đè dữ liệu cũ, trả về lỗi `409 Conflict` và hiển thị thông báo yêu cầu người dùng Reload trang để nhận trạng thái mới nhất từ người dùng khác.

