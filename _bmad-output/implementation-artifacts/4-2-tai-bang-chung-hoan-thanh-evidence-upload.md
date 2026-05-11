# Story 4.2: Tải bằng chứng hoàn thành (Evidence Upload)

## Overview
**As a** Developer (DEV),
**I want** tải lên ảnh chụp màn hình hoặc file kết quả công việc trực tiếp vào cơ sở dữ liệu,
**So that** TAS có bằng chứng để đối soát với khách hàng mà không phụ thuộc vào hệ thống file vật lý.

## Acceptance Criteria
- [ ] DEV có thể kéo thả hoặc chọn file trong khu vực "Evidence" tại Request Detail.
- [ ] Hệ thống tự động nén ảnh (JPEG/PNG) để tối ưu dung lượng trước khi lưu.
- [ ] File được lưu dưới dạng Binary (`Bytes` / `VARBINARY(MAX)`) trong bảng `Attachments`.
- [ ] Hiển thị được Thumbnail/Preview cho các ảnh đã tải lên.
- [ ] Đảm bảo tính toàn vẹn: Xóa Request sẽ xóa toàn bộ Evidence liên quan (Cascade).

## Technical Context
- **Database**: SQL Server.
- **ORM**: Prisma.
- **Compression**: Sử dụng `sharp` hoặc cơ chế nén Buffer cơ bản nếu không muốn thêm dependency nặng.
- **Storage**: Cột `data` kiểu `Bytes` trong model `Attachment`.

## Proposed Changes

### 1. Database Schema
#### [MODIFY] [schema.prisma](file:///c:/Users/vietpcn/Documents/Antigravity/PremServiceProject/prisma/schema.prisma)
- Thêm trường `data Bytes` vào model `Attachment`.
- Giữ trường `url` làm fallback hoặc chuyển thành virtual field (nếu cần).

### 2. Server Logic
#### [MODIFY] [route.ts](file:///c:/Users/vietpcn/Documents/Antigravity/PremServiceProject/src/app/api/upload/route.ts)
- Loại bỏ logic `fs.writeFile` và `public/uploads`.
- Thêm logic nén ảnh sử dụng Buffer.
- Lưu `Buffer` trực tiếp vào Prisma `data` field.

### 3. UI Layer
#### [MODIFY] [RequestDetailView.tsx](file:///c:/Users/vietpcn/Documents/Antigravity/PremServiceProject/src/app/requests/%5Bid%5D/RequestDetailView.tsx)
- Cập nhật cách hiển thị ảnh: Thay vì dùng `file.url` dẫn đến đường dẫn tĩnh, sử dụng Base64 Data URI hoặc tạo một route `/api/attachments/[id]` để fetch binary.

## Implementation Guardrails
- **Karpathy Rule**: Surgical changes. Chỉ sửa những gì cần thiết để chuyển đổi storage.
- **Performance**: Nén ảnh xuống < 200KB nếu có thể.
- **Security**: Kiểm tra session trước khi upload.

## Verification Plan
1. Tải lên một ảnh PNG > 1MB.
2. Kiểm tra trong DB: record mới phải có dữ liệu trong cột `data`.
3. Kiểm tra file vật lý: Không được có file mới trong `public/uploads`.
4. Refresh trang và đảm bảo ảnh vẫn hiển thị đúng.
