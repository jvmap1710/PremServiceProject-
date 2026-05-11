---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: ["_bmad-output/planning-artifacts/prd.md", "_bmad-output/planning-artifacts/architecture.md"]
status: 'complete'
completedAt: '2026-05-07'
---

# PremiumService - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for PremiumService, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: TAS có thể quản lý hồ sơ khách hàng (Tên, Mã khách hàng, Trạng thái).
FR2: TAS có thể cấu hình định mức (Quota) hàng tháng cho từng khách hàng.
FR3: TAS có thể thiết lập quy tắc SRO riêng biệt (Tên task, Estimate time) cho từng khách hàng.
FR4: TAS có thể tạo yêu cầu dịch vụ (Service Request) với các thông tin: Ngày Raise, Phân loại ban đầu, Mô tả kỹ thuật.
FR5: Hệ thống tự động theo dõi và cảnh báo trạng thái Quota (Sử dụng vs Định mức) theo chu kỳ tháng.
FR6: DEV có thể nhận và cập nhật trạng thái yêu cầu trên bảng Kanban (To Do, In Progress, Done).
FR7: DEV có thể chia nhỏ yêu cầu thành các Sub-tasks để quản lý tiến độ chi tiết.
FR8: DEV có thể ghi nhận thời gian thực tế (Log time) cho từng yêu cầu hoặc Sub-task.
FR9: DEV có quyền chỉnh sửa phân loại SRO cuối cùng (Audit/Re-classification) sau khi hoàn thành.
FR10: Hệ thống tự động tính toán chu kỳ báo cáo và hiệu suất (Estimate vs Actual) dựa trên Ngày Raise.
FR11: DEV có thể tải lên ảnh hoặc tệp tin bằng chứng (Evidence) cho từng yêu cầu.
FR12: Sếp có thể cấu hình đơn giá nhân công (Salary Range) cho các nhóm nhân sự (Bảo mật cấp server).
FR13: Sếp có quyền xem Dashboard Lợi nhuận (Doanh thu Quota vs Chi phí thực tế).
FR14: Sếp có quyền xem Resource Heatmap (Mức độ bận rộn của team).
FR15: Hệ thống hỗ trợ xuất báo cáo đối soát ra file Excel/PDF (Bao gồm danh sách công việc và bằng chứng).
FR16: Phân quyền RBAC (Sếp, TAS, DEV) với các quyền hạn truy cập dữ liệu tài chính nghiêm ngặt.
FR17: Hệ thống chạy trong mạng nội bộ/VPN công ty.
FR18: Mã hóa dữ liệu lương tại Database.
FR19: Cơ chế Rate Limiting cho việc xuất báo cáo để tránh treo hệ thống.
FR20: Toàn vẹn tham chiếu dữ liệu (Không cho phép xóa yêu cầu đã có log time).
FR21: Tự động tổng hợp Worklog thành báo cáo đối soát (Evidence Generator).
FR22: Cảnh báo rủi ro lỗ (Profitability Safeguard) ngay từ khi tạo yêu cầu.
FR23: Dashboard tải nhanh < 2 giây.

### NonFunctional Requirements

NFR1: Performance - Load Dashboard < 2s; Phản hồi log time < 500ms.
NFR2: Security - Mã hóa dữ liệu lương; Chống OWASP Top 10; Rate limiting export.
NFR3: Reliability - Backup dữ liệu hàng ngày; Đảm bảo toàn vẹn tham chiếu tài chính.
NFR4: Usability - Giao diện chuyên nghiệp, mật độ thông tin cao cho Dashboard điều hành.
NFR5: Infrastructure - Vận hành ổn định trong mạng nội bộ/VPN.

### Additional Requirements

- Sử dụng Next.js 15 (App Router) với TypeScript.
- Sử dụng Prisma ORM kết nối Microsoft SQL Server.
- Sử dụng Tremor + Shadcn UI cho Dashboard.
- Lưu trữ Evidence dưới dạng VARBINARY(MAX) trong SQL Server (có nén ảnh).
- NextAuth.js v5 cho Authentication.
- Server Actions cho logic nghiệp vụ (Mutations).

### UX Design Requirements

UX-DR1: Dashboard điều hành (Sếp) phong cách Premium, sử dụng Tremor charts cho KPI.
UX-DR2: Bảng Kanban trực quan cho DEV quản lý yêu cầu.
UX-DR3: Form log time tinh gọn, hỗ trợ upload ảnh bằng chứng kéo thả.
UX-DR4: Giao diện cấu hình SRO linh hoạt cho TAS.

### FR Coverage Map

FR1: Epic 2 - Hồ sơ khách hàng
FR2: Epic 2 - Cấu hình Quota
FR3: Epic 2 - Quy tắc SRO
FR4: Epic 3 - Khởi tạo yêu cầu
FR5: Epic 2 - Cảnh báo Quota
FR6: Epic 3 - Bảng Kanban
FR7: Epic 3 - Quản lý Sub-tasks
FR8: Epic 4 - Log time thực tế
FR9: Epic 4 - Kiểm định (Audit) SRO
FR10: Epic 5 - Tính toán hiệu suất
FR11: Epic 4 - Bằng chứng (Evidence)
FR12: Epic 5 - Cấu hình lương (Salary)
FR13: Epic 5 - Dashboard Lợi nhuận
FR14: Epic 5 - Resource Heatmap
FR15: Epic 5 - Xuất báo cáo (Export)
FR16: Epic 1 - Phân quyền RBAC
FR17: Epic 1 - Mạng nội bộ/VPN
FR18: Epic 1 - Mã hóa Database
FR19: Epic 5 - Rate Limiting export
FR20: Epic 3 - Toàn vẹn dữ liệu
FR21: Epic 4 - Evidence Generator
FR22: Epic 5 - Profitability Safeguard
FR23: Epic 1 - Dashboard performance foundation

## Epic List

### Epic 1: Nền tảng & Bảo mật (Project Foundation & Security)
Thiết lập dự án Next.js, cấu hình Database SQL Server và hệ thống đăng nhập NextAuth. Đảm bảo nhân sự (Sếp, TAS, DEV) có thể truy cập hệ thống an toàn qua VPN.
**FRs covered:** FR16, FR17, FR18, FR23.

### Epic 2: Quản lý Khách hàng & Định mức (Client & Quota Management)
TAS có thể khởi tạo hồ sơ khách hàng và thiết lập các quy tắc "Luật chơi" (Quota, SRO types) riêng biệt cho từng khách hàng. Hệ thống bắt đầu theo dõi định mức tự động.
**FRs covered:** FR1, FR2, FR3, FR5.

### Epic 3: Vận hành Yêu cầu & Kanban (Request & Task Operations)
Thay thế Jira cho mảng Premium. TAS tạo yêu cầu, DEV tiếp nhận và thực hiện công việc thông qua bảng Kanban, hỗ trợ chia nhỏ đầu việc (Sub-tasks).
**FRs covered:** FR4, FR6, FR7, FR20.

### Epic 4: Nhật ký công việc & Kiểm định (Worklog, Evidence & Audit)
DEV ghi nhận thời gian thực tế, tải lên bằng chứng hoàn thành và thực hiện bước "Audit" quan trọng (phân loại lại task) để đảm bảo dữ liệu báo cáo chuẩn xác.
**FRs covered:** FR8, FR9, FR11, FR21.

### Epic 5: Dashboard Điều hành & Lợi nhuận (Executive Dashboard & Profitability)
Sếp theo dõi bức tranh tài chính tổng thể qua các biểu đồ Tremor: Lợi nhuận thực tế, Resource Heatmap, Cảnh báo rủi ro lỗ và xuất báo cáo đối soát Excel.
**FRs covered:** FR10, FR12, FR13, FR14, FR15, FR19, FR22.

## Epic 1: Nền tảng & Bảo mật (Project Foundation & Security)

Khởi tạo dự án Next.js, cấu hình Database SQL Server và hệ thống đăng nhập NextAuth. Đảm bảo nhân sự (Sếp, TAS, DEV) có thể truy cập hệ thống an toàn qua VPN.

### Story 1.1: Khởi tạo dự án & Kết nối Database (Scaffolding)

As a Developer (Amelia),
I want khởi tạo mã nguồn Next.js 15 và cấu hình Prisma kết nối SQL Server,
So that tôi có nền tảng kỹ thuật để bắt đầu lập trình các tính năng.

**Acceptance Criteria:**

**Given** Dự án Next.js 15 đã được khởi tạo với App Router và TypeScript.
**When** Cấu hình file `schema.prisma` và chạy lệnh `prisma db pull/push`.
**Then** Kết nối thành công với SQL Server và có thể truy vấn dữ liệu mẫu.

### Story 1.2: Đăng nhập hệ thống (Authentication)

As a Người dùng (Sếp, TAS, DEV),
I want đăng nhập vào hệ thống bằng tài khoản được cấp,
So that tôi có thể truy cập vào các chức năng làm việc của mình.

**Acceptance Criteria:**

**Given** Người dùng đang ở trang `/login`.
**When** Nhập đúng Username/Password và nhấn Đăng nhập.
**Then** Hệ thống xác thực qua NextAuth v5 và chuyển hướng vào trang Dashboard chính.
**And** Hiển thị thông báo lỗi nếu nhập sai thông tin.

### Story 1.3: Phân quyền & Bảo mật Middleware (RBAC)

As a Quản trị viên,
I want hệ thống tự động kiểm tra quyền truy cập của người dùng,
So that đảm bảo DEV không thể xem dữ liệu lương và Sếp có toàn quyền điều hành.

**Acceptance Criteria:**

**Given** Một người dùng có Role là `DEV`.
**When** Cố gắng truy cập vào đường dẫn `/admin` (dành cho Sếp).
**Then** Middleware của Next.js chặn lại và chuyển hướng về trang chủ hoặc hiện thông báo "Không có quyền".

### Story 1.4: Khung giao diện & Điều hướng (Base Layout)

As a Người dùng,
I want một giao diện có Sidebar và Header chuyên nghiệp,
So that tôi có thể dễ dàng di chuyển giữa các tính năng (Khách hàng, Yêu cầu, Báo cáo).

**Acceptance Criteria:**

**Given** Người dùng đã đăng nhập thành công.
**When** Quan sát thanh Sidebar.
**Then** Hiển thị danh sách các mục Menu tương ứng với Role của mình (Sếp thấy thêm mục "Lợi nhuận").

## Epic 2: Quản lý Khách hàng & Định mức (Client & Quota Management)

TAS có thể khởi tạo hồ sơ khách hàng và thiết lập các quy tắc "Luật chơi" (Quota, SRO types) riêng biệt cho từng khách hàng. Hệ thống bắt đầu theo dõi định mức tự động.

### Story 2.1: Quản lý danh sách khách hàng (Client CRUD)

As a TAS (Trang),
I want tạo và quản lý thông tin các khách hàng Premium,
So that tôi có thể gán các yêu cầu dịch vụ cho đúng đối tượng.

**Acceptance Criteria:**

**Given** TAS đã đăng nhập và vào mục "Khách hàng".
**When** Nhấn "Thêm khách hàng" và nhập Tên, Mã khách hàng.
**Then** Thông tin khách hàng được lưu vào SQL Server và hiển thị trong danh sách.

### Story 2.2: Cấu hình quy tắc SRO (SRO Rules Setup)

As a TAS,
I want thiết lập danh mục công việc (SRO) và thời gian định mức (Estimate) cho từng khách hàng,
So that DEV biết được giới hạn thời gian cho từng loại task.

**Acceptance Criteria:**

**Given** Đang ở trang chi tiết của khách hàng "Green Tech".
**When** TAS thêm một SRO mới tên là "Fix Bug" với Estimate là 2 giờ.
**Then** Quy tắc này được lưu và sẽ tự động gợi ý khi tạo Request cho khách hàng này.

### Story 2.3: Thiết lập Quota hàng tháng

As a TAS,
I want cài đặt tổng số giờ định mức hàng tháng cho khách hàng,
So that hệ thống có thể theo dõi tình trạng over-request.

**Acceptance Criteria:**

**Given** TAS đang cấu hình định mức cho khách hàng.
**When** Nhập "20 giờ" cho tháng 5/2026.
**Then** Hệ thống ghi nhận và bắt đầu tính toán phần trăm sử dụng khi có task phát sinh.

### Story 2.4: Giao diện theo dõi Quota (Quota Monitor UI)

As a TAS/Sếp,
I want thấy một thanh tiến độ trực quan về tình trạng sử dụng Quota,
So that tôi có thể cảnh báo khách hàng khi sắp hết định mức.

**Acceptance Criteria:**

**Given** Đang ở trang danh sách khách hàng.
**When** Quan sát cột "Tình trạng Quota".
**Then** Hiển thị Progress Bar (Ví dụ: 15/20 giờ - 75%).
**And** Thanh tiến độ chuyển sang màu đỏ nếu vượt quá 100%.

## Epic 3: Vận hành Yêu cầu & Kanban (Request & Task Operations)

Thay thế Jira cho mảng Premium. TAS tạo yêu cầu, DEV tiếp nhận và thực hiện công việc thông qua bảng Kanban, hỗ trợ chia nhỏ đầu việc (Sub-tasks).

### Story 3.1: Khởi tạo yêu cầu dịch vụ (Create Request)

As a TAS,
I want tạo một yêu cầu mới cho khách hàng,
So that chuyển thông tin công việc cho team DEV thực hiện.

**Acceptance Criteria:**

**Given** TAS nhấn "Tạo yêu cầu mới".
**When** Chọn khách hàng, chọn loại SRO (ví dụ: Fix Bug) và nhập mô tả.
**Then** Yêu cầu được tạo với mã duy nhất (ví dụ: PREM-GT-001) và tự động ghi nhận "Ngày Raise" là ngày hôm nay.

### Story 3.2: Bảng Kanban quản lý yêu cầu

As a DEV,
I want thấy danh sách yêu cầu dưới dạng thẻ trên bảng Kanban,
So that tôi biết công việc nào đang chờ, đang làm và đã xong.

**Acceptance Criteria:**

**Given** DEV truy cập vào trang "Yêu cầu".
**When** Quan sát bảng Kanban với 3 cột: To Do, In Progress, Done.
**Then** Có thể kéo thả các thẻ để cập nhật trạng thái (ví dụ: từ To Do sang In Progress).

### Story 3.3: Chia nhỏ công việc (Sub-tasks)

As a DEV,
I want chia một yêu cầu lớn thành các đầu việc nhỏ (Sub-tasks),
So that tôi có thể quản lý tiến độ chi tiết hơn.

**Acceptance Criteria:**

**Given** DEV mở chi tiết yêu cầu PREM-GT-001.
**When** Nhấn "Thêm Sub-task" và nhập mô tả.
**Then** Danh sách Sub-task hiển thị bên dưới yêu cầu chính và có trạng thái "Hoàn thành/Chưa xong" riêng biệt.

### Story 3.4: Cảnh báo rủi ro lỗ (Profitability Safeguard)

As a TAS,
I want hệ thống cảnh báo ngay khi tôi đang tạo yêu cầu nếu khách hàng đã hết Quota,
So that tôi có thể thảo luận lại với khách hàng về chi phí phát sinh.

**Acceptance Criteria:**

**Given** TAS đang tạo yêu cầu cho khách hàng "Green Tech".
**When** Khách hàng này đã dùng hết 20/20 giờ định mức.
**Then** Hệ thống hiển thị cảnh báo đỏ: "Khách hàng đã hết Quota tháng này. Yêu cầu này sẽ được tính là Over-request."

## Epic 4: Nhật ký công việc & Kiểm định (Worklog, Evidence & Audit)

DEV ghi nhận thời gian thực tế, tải lên bằng chứng hoàn thành và thực hiện bước "Audit" quan trọng (phân loại lại task) để đảm bảo dữ liệu báo cáo chuẩn xác.

### Story 4.1: Ghi nhận thời gian làm việc (Log time)

As a DEV,
I want nhập số giờ thực tế đã bỏ ra cho mỗi yêu cầu,
So that công ty có cơ sở để tính toán chi phí nhân công.

**Acceptance Criteria:**

**Given** DEV đang ở trang chi tiết yêu cầu.
**When** Nhấn "Log time", nhập số giờ (ví dụ: 1.5 giờ) và ghi chú nội dung công việc.
**Then** Hệ thống cộng dồn thời gian vào yêu cầu chính và hiển thị lịch sử các lần log time.

### Story 4.2: Tải bằng chứng hoàn thành (Evidence Upload)

As a DEV,
I want tải lên ảnh chụp màn hình hoặc file kết quả công việc,
So that TAS có bằng chứng để đối soát với khách hàng.

**Acceptance Criteria:**

**Given** DEV muốn hoàn thành task.
**When** Kéo thả ảnh vào khu vực "Evidence".
**Then** Hệ thống nén ảnh tự động và lưu vào cột `Binary` của SQL Server.
**And** Hiển thị bản xem trước (Thumbnail) của ảnh đã tải lên.

### Story 4.3: Kiểm định và Phân loại lại (Audit/Re-classification)

As a DEV,
I want điều chỉnh lại loại SRO thực tế sau khi đã hiểu rõ bản chất công việc,
So that dữ liệu báo cáo phản ánh đúng loại dịch vụ đã cung cấp.

**Acceptance Criteria:**

**Given** Yêu cầu ban đầu được TAS chọn là "Consulting".
**When** Sau khi làm xong, DEV thấy thực tế là "Fix Bug", DEV chọn lại loại SRO trong mục "Audit".
**Then** Hệ thống ghi nhận cả 2 loại (Ban đầu vs Thực tế) để Sếp so sánh sai lệch.

### Story 4.4: Tự động tổng hợp báo cáo công việc (Evidence Generator)

As a TAS,
I want hệ thống tự động gom các bằng chứng và log time của một yêu cầu thành một bản tóm tắt,
So that tôi không phải đi thu thập thủ công từng file khi đối soát.

**Acceptance Criteria:**

**Given** Yêu cầu PREM-GT-001 đã ở trạng thái "Done".
**When** TAS xem báo cáo tổng hợp.
**Then** Hiển thị đầy đủ: Tổng thời gian log, Loại SRO cuối cùng, và tất cả ảnh bằng chứng đi kèm.

## Epic 5: Dashboard Điều hành & Lợi nhuận (Executive Dashboard & Profitability)

Sếp theo dõi bức tranh tài chính tổng thể qua các biểu đồ Tremor: Lợi nhuận thực tế, Resource Heatmap, Cảnh báo rủi ro lỗ và xuất báo cáo đối soát Excel.

### Story 5.1: Cấu hình đơn giá nhân công (Salary Config)

As a Sếp,
I want thiết lập mức lương/giờ cho các nhóm nhân sự,
So that hệ thống có thể tính toán chi phí (Cost) thực tế của dự án.

**Acceptance Criteria:**

**Given** Chỉ người dùng có Role "Sếp" mới truy cập được trang này.
**When** Sếp nhập đơn giá cho nhóm "DEV Level 1" là 500,000đ/giờ.
**Then** Hệ thống lưu trữ mã hóa và sử dụng giá trị này để nhân với số giờ log time ra chi phí.

### Story 5.2: Dashboard Lợi nhuận thực tế (Profitability Dashboard)

As a Sếp,
I want thấy biểu đồ so sánh giữa Doanh thu (Quota khách trả) và Chi phí (Lương nhân viên thực tế),
So that tôi biết khách hàng nào đang mang lại lợi nhuận tốt nhất.

**Acceptance Criteria:**

**Given** Sếp mở trang Dashboard Executive.
**When** Chọn chu kỳ tháng 5/2026.
**Then** Hiển thị biểu đồ cột so sánh Revenue vs Cost theo từng khách hàng bằng Tremor Charts.
**And** Hiển thị tổng số tiền lãi/lỗ của toàn bộ mảng Premium.

### Story 5.3: Bản đồ nguồn lực (Resource Heatmap)

As a Sếp,
I want thấy mức độ bận rộn của các thành viên trong team,
So that tôi có kế hoạch điều động nhân sự hoặc tuyển thêm người.

**Acceptance Criteria:**

**Given** Sếp truy cập Resource Heatmap.
**When** Hệ thống tính toán (Tổng giờ log / Định mức giờ làm việc).
**Then** Hiển thị biểu đồ nhiệt (Heatmap). Màu đỏ nếu nhân viên đang quá tải (>100% công suất), màu xanh nếu đang rảnh.

### Story 5.4: Xuất báo cáo đối soát (Reconciliation Export)

As a TAS/Sếp,
I want xuất danh sách công việc đã làm kèm bằng chứng ra file Excel/PDF chuyên nghiệp,
So that tôi có thể gửi cho khách hàng để thanh toán.

**Acceptance Criteria:**

**Given** TAS chọn khách hàng "Green Tech" và nhấn "Export Báo cáo đối soát".
**When** Hệ thống tổng hợp toàn bộ Request đã Done trong tháng.
**Then** Tải xuống file Excel chứa: Tên Request, Loại SRO, Thời gian, và Link/Ảnh bằng chứng đính kèm.
**And** Có cơ chế Rate Limiting (chờ 30s giữa các lần export) để bảo vệ server.
