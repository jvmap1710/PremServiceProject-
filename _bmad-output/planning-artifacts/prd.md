stepsCompleted: ["step-01-init", "step-02-discovery", "step-02b-vision", "step-02c-executive-summary", "step-03-success", "step-04-journeys", "step-05-domain", "step-06-innovation", "step-07-project-type", "step-08-scoping", "step-09-functional", "step-10-nonfunctional", "step-11-polish"]
classification:
  projectType: "saas_b2b"
  domain: "Professional Services Management"
  complexity: "Medium"
  projectContext: "Greenfield"
  releaseMode: "phased"
inputDocuments: ["_bmad-output/planning-artifacts/product-brief-PremiumService.md", "_bmad-output/brainstorming/brainstorming-session-2026-05-07-113608.md", "_bmad-output/planning-artifacts/distillate-PremiumService.md", "docs/standard-requests.md"]
workflowType: 'prd'
---

# Product Requirements Document - PremiumService

**Author:** JV
**Date:** 2026-05-07

## Executive Summary

PremiumService là một nền tảng Quản trị Dịch vụ Chuyên nghiệp (PSA) nội bộ, được thiết kế để tối đa hóa lợi nhuận kinh doanh và đảm bảo tính tuân thủ hợp đồng cho các gói dịch vụ Premium. Hệ thống giải quyết sự đứt gãy quan trọng giữa việc thực thi tác vụ kỹ thuật và việc ra quyết định kinh doanh ở cấp quản lý. Bằng cách xây dựng một mô hình **All-in-one** (thay thế Jira cho mảng Premium), hệ thống trở thành "Nguồn sự thật duy nhất" (Source of Truth) cho báo cáo kinh doanh, giúp loại bỏ tình trạng "thất thoát yêu cầu vượt định mức" (over-request leakage) và cung cấp dữ liệu sạch để đối soát doanh thu.

### What Makes This Special

*   **Hệ thống Hỗ trợ Quyết định (Executive Decision Engine):** Tối ưu cho các cuộc họp điều hành với Dashboard trực quan, Heatmap sử dụng quota và phân tích lợi nhuận thực tế.
*   **Quy trình Kiểm định Chặt chẽ (Audited Workflow):** Thiết lập "Cổng kiểm soát chất lượng" (Quality Gate) nơi DEV chuẩn hóa phân loại công việc theo danh mục Standard Request (SRO).
*   **Tính Riêng tư và Tự chủ (Internal Privacy & Autonomy):** Hệ thống nội bộ độc lập, bảo mật dữ liệu tuyệt đối và không phụ thuộc vào bên thứ ba.

## Project Classification

*   **Project Type:** SaaS B2B (Quản trị nội bộ)
*   **Domain:** Quản lý dịch vụ chuyên nghiệp (Professional Services Management)
*   **Complexity:** Medium (Trung bình - do có logic tài chính và theo dõi định mức)
*   **Project Context:** Greenfield (Xây dựng mới hoàn toàn)

## Success Criteria

### User Success
*   **TAS (The Strategist):** Khởi tạo yêu cầu và cấu hình Quota khách hàng trong < 5 phút.
*   **DEV (The Executor/Auditor):** Hoàn tất kiểm định và log time cho một yêu cầu trong < 2 phút.
*   **Sếp (The Decision Maker):** 
    *   Nắm bắt rủi ro thanh toán từ báo cáo Over-request trong < 30 giây.
    *   Theo dõi task tổng thể và hiệu suất nguồn lực (Resource Performance) tức thì.

### Business Success
*   **Zero Leakage:** 100% yêu cầu vượt định mức được gắn cờ để xử lý thương mại.
*   **Hiệu suất Báo cáo:** Giảm 90% thời gian chuẩn bị dữ liệu báo cáo hàng tháng.
*   **Minh bạch Lợi nhuận:** 100% khách hàng có chỉ số "Giá trị dịch vụ vs Chi phí nhân công" rõ ràng.

### Technical Success
*   **Tính Toàn vẹn Dữ liệu:** 100% yêu cầu có ID duy nhất và bằng chứng (Evidence) đi kèm.
*   **Bảo mật Nội bộ:** Vận hành ổn định trong mạng nội bộ với phân quyền RBAC chặt chẽ.

## Product Scope & Phased Development

### MVP Strategy & Philosophy
Tập trung vào giải quyết vấn đề cốt lõi (Problem-solving MVP): Thay thế Jira bằng hệ thống chuyên biệt để kiểm soát định mức và thời gian thực tế ngay lập tức.

### MVP Feature Set (Phase 1)
*   **Quản lý Danh mục:** Khách hàng và Quy tắc Standard Request (SRO).
*   **Quản lý Yêu cầu:** Khởi tạo yêu cầu (TAS) và Bảng Kanban (DEV).
*   **Vận hành:** Cơ chế Audit, Log time thực tế và Quản lý Sub-tasks.
*   **Đối soát:** Upload bằng chứng (Evidence) và Báo cáo Over-request cơ bản.

### Post-MVP Features
*   **Phase 2 (Growth):** Cấu hình Đơn giá nhân công (Salary), Dashboard Lợi nhuận & Resource Heatmap, Xuất báo cáo Excel chuyên sâu.
*   **Phase 3 (Vision):** Dự báo rủi ro (Profitability Safeguard), Cổng thông tin khách hàng (Client View).

## Innovation & Novel Patterns

*   **Dự báo lợi nhuận sớm (Profitability Safeguard):** Đối chiếu lịch sử thực hiện task thực tế với định mức còn lại để cảnh báo rủi ro lỗ ngay từ khi khởi tạo.
*   **Tự động soạn thảo Bằng chứng (Automated Evidence Generator):** Một nút bấm để tổng hợp Worklog và Ảnh bằng chứng thành báo cáo đối soát chuyên nghiệp.

## User Journeys

### Hành trình 1: Trang (TAS) - Thiết lập khách hàng mới
Trang ký hợp đồng với "Green Tech", cô vào hệ thống thiết lập Quota 20h/tháng dựa trên file `standard-requests.md`. Cô tạo request đầu tiên `PREM-GT-001`. Mọi thứ được kiểm soát ngay từ ngày đầu tiên.

### Hành trình 2: Duy (DEV) - Làm việc và Phân loại lại
Duy nhận task `PREM-GT-001`. Sau khi hoàn thành, anh nhận ra task này thuộc loại "Migration" chứ không phải "Support" như TAS chọn ban đầu. Anh thực hiện **Audit** (phân loại lại), log 4 giờ và đính kèm ảnh bằng chứng. Hệ thống tự trừ Quota của khách hàng chính xác.

### Hành trình 3: Sơn (Sếp) - Ra quyết định tăng giá
Sơn mở Dashboard trước cuộc họp, thấy khách hàng "Blue Sky" hiện chấm đỏ (vượt 110% quota). Anh xem Resource Heatmap thấy team đã dồn quá nhiều sức. Anh xuất báo cáo bằng chứng để đề xuất tăng giá hợp đồng trong cuộc họp.

## Functional Requirements

### 1. Quản lý Khách hàng & Cấu hình (Client & SRO)
*   **FR1:** TAS có thể quản lý hồ sơ khách hàng và định mức (Quota) hàng tháng.
*   **FR2:** TAS có thể thiết lập quy tắc SRO riêng biệt (Tên task, Estimate time) cho từng khách hàng.
*   **FR3:** Hệ thống tự động theo dõi và cảnh báo trạng thái Quota theo chu kỳ tháng.

### 2. Quản lý Yêu cầu & Công việc (Request & Task)
*   **FR4:** TAS có thể tạo yêu cầu với thông tin: Ngày Raise, Phân loại ban đầu, Mô tả kỹ thuật.
*   **FR5:** DEV có thể chia nhỏ Yêu cầu thành các **Sub-tasks** để quản lý tiến độ chi tiết.
*   **FR6:** DEV có thể cập nhật trạng thái công việc trên bảng Kanban tập trung.

### 3. Kiểm định & Ghi nhận (Audit & Worklog)
*   **FR7:** DEV có thể log thời gian thực tế cho từng Sub-task hoặc Request.
*   **FR8:** DEV có quyền chỉnh sửa phân loại SRO cuối cùng (Audit) để đảm bảo tính chính xác cho báo cáo.
*   **FR9:** Hệ thống tự động tính toán hiệu suất (Estimate vs Actual) và chu kỳ báo cáo dựa trên Ngày Raise.

### 4. Báo cáo & Dashboard (Executive Engine)
*   **FR10:** Sếp có thể cấu hình đơn giá nhân công (Salary Range) để tính toán chi phí.
*   **FR11:** Sếp có thể xem Dashboard Lợi nhuận, Resource Heatmap và Hiệu suất team thực tế.
*   **FR12:** Người dùng có thẩm quyền có thể xuất dữ liệu báo cáo ra Excel/PDF.

### 5. Bảo mật & Bằng chứng (Security & Evidence)
*   **FR13:** DEV có thể upload ảnh/tệp tin bằng chứng liên kết với Request ID.
*   **FR14:** Hệ thống áp dụng phân quyền RBAC (Sếp, TAS, DEV) với bảo mật dữ liệu lương cấp độ server.
*   **FR15:** Hệ thống hỗ trợ tạo bản tóm tắt đối soát tự động từ dữ liệu đã log.

## Non-Functional Requirements

*   **Performance:** Load Dashboard < 2s; Phản hồi thao tác log time < 500ms.
*   **Security:** Mã hóa dữ liệu tài chính; Bảo vệ chống OWASP Top 10 (SQLi, XSS); Chống rò rỉ dữ liệu (Rate limiting export).
*   **Reliability:** Backup dữ liệu hàng ngày; Đảm bảo toàn vẹn tham chiếu cho dữ liệu tài chính.
*   **Usability:** Giao diện chuyên nghiệp, mật độ thông tin cao, tương thích tốt với máy chiếu phòng họp.

## Implementation Considerations

*   **Frontend & Backend:** **Next.js (React)** - Tối ưu cho Dashboard và phát triển nhanh.
*   **Database:** **Microsoft SQL Server** - Tận dụng hạ tầng sẵn có, đảm bảo an toàn dữ liệu.
*   **UI Library:** **Shadcn UI & Tailwind CSS**.
*   **Authentication:** **NextAuth.js**.
*   **Reporting:** **ExcelJS**.
