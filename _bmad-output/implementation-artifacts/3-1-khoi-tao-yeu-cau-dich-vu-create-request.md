---
epic: "Epic 3: Vận hành Yêu cầu & Kanban"
story: "3.1: Khởi tạo yêu cầu dịch vụ (Create Request)"
status: "done"
---

# Story 3.1: Khởi tạo yêu cầu dịch vụ (Create Request)

## 1. Yêu cầu nghiệp vụ (Từ PRD/Epics)
- **Mô tả**: TAS có thể tạo một yêu cầu dịch vụ (Service Request) cho khách hàng để chuyển thông tin công việc cho team DEV.
- **Tiêu chí chấp nhận**:
  - TAS nhấn "Tạo yêu cầu mới" trên giao diện.
  - Form tạo yêu cầu yêu cầu: Chọn khách hàng, Chọn loại SRO (chỉ các SRO đã khai báo cho KH đó), Mô tả kỹ thuật.
  - Khi lưu, Yêu cầu được tạo với mã duy nhất (ví dụ: PREM-GT-001) và ghi nhận "Ngày Raise" là ngày hiện tại.

## 2. Phân tích kỹ thuật & Database
Chúng ta cần một bảng `ServiceRequest` trong Prisma:
- `id`: String (cuid)
- `code`: String (ví dụ PREM-GT-001) - Sinh tự động dựa trên `Client.code`.
- `clientId`: Liên kết với Client.
- `packageId`: Liên kết với gói Premium đang active.
- `sroRuleId`: Liên kết với loại SRO đã chọn ban đầu.
- `title`: Tên yêu cầu / Mô tả ngắn.
- `description`: Mô tả kỹ thuật chi tiết.
- `status`: Enum (TODO, IN_PROGRESS, DONE).
- `raiseDate`: DateTime.
- `createdAt`, `updatedAt`: DateTime.

## 3. Kế hoạch triển khai (Step-by-step)
1. **Schema Update**: Thêm model `ServiceRequest` vào `schema.prisma`.
2. **Prisma Generate & Push**: Chạy lệnh update database.
3. **Giao diện (UI)**: 
   - Thêm nút "Tạo Request" ở Header hoặc trang `/requests`.
   - Xây dựng trang `/requests/new` hoặc Modal Form.
4. **Server Action**: Viết action `createServiceRequest` thực hiện logic:
   - Đếm số lượng request hiện tại của KH để sinh mã `code` (ví dụ: tìm Max mã của KH đó rồi +1).
   - Validate Quota (nếu vượt quota thì cảnh báo - thuộc Story 3.4 nhưng có thể lót nền trước).
   - Lưu vào database.
5. **Danh sách Request**: Trang `/requests` hiển thị list các yêu cầu vừa tạo.
