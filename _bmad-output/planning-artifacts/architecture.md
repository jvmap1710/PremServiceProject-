---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: ["_bmad-output/planning-artifacts/prd.md", "_bmad-output/planning-artifacts/product-brief-PremiumService.md", "_bmad-output/planning-artifacts/distillate-PremiumService.md", "_bmad-output/brainstorming/brainstorming-session-2026-05-07-113608.md", "docs/standard-requests.md"]
workflowType: 'architecture'
project_name: 'PremiumService'
user_name: 'JV'
date: '2026-05-07'
status: 'complete'
completedAt: '2026-05-07'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
Hệ thống bao gồm 23 yêu cầu chức năng chính, tập trung vào luồng phối hợp TAS-DEV và kiểm định (Audit) dữ liệu kỹ thuật để phục vụ mục tiêu kinh doanh. Điểm mấu chốt là cơ chế ghi nhận thời gian thực tế (Worklog) và đối chiếu với định mức (SRO Quota) của từng khách hàng.

**Non-Functional Requirements:**
*   **Bảo mật:** Mã hóa dữ liệu lương/lợi nhuận, bảo vệ OWASP Top 10, chỉ truy cập qua VPN.
*   **Hiệu năng:** Dashboard tải < 2 giây, phản hồi thao tác log time < 500ms.
*   **Tin cậy:** Toàn vẹn tham chiếu dữ liệu, backup hàng ngày, không cho phép xóa dữ liệu đã đối soát.

**Scale & Complexity:**
*   **Primary domain:** Full-stack Web (Next.js + SQL Server)
*   **Complexity level:** Medium
*   **Estimated architectural components:** 6 (Identity, Client/Quota Engine, Task Kanban, Financial Engine, Reporting, Evidence Storage)

### Technical Constraints & Dependencies
*   **Database:** Microsoft SQL Server (Hạ tầng sẵn có).
*   **Infrastructure:** Mạng nội bộ/VPN nội bộ công ty.

### Cross-Cutting Concerns Identified
*   **RBAC (Server-side):** Kiểm soát truy cập nghiêm ngặt cho dữ liệu tài chính.
*   **Business Audit Trail:** Truy vết các thay đổi trong phân loại task và cấu hình định mức.
*   **Export Logic:** Xử lý kết xuất dữ liệu Excel/PDF lớn mà không làm treo hệ thống.

## Starter Template Evaluation

### Primary Technology Domain
**Full-stack Web Application** (Next.js Ecosystem).

### Starter Options Considered
*   **Official Next.js Starter (create-next-app):** Ổn định nhất, hỗ trợ tốt App Router và SQL Server thông qua Prisma.
*   **T3 Stack:** Mạnh mẽ về Type-safe nhưng có độ phức tạp cao hơn mức cần thiết cho ứng dụng nội bộ.

### Selected Starter: Next.js (Official)

**Rationale for Selection:**
Sử dụng bộ khung chính thức của Vercel đảm bảo tính ổn định lâu dài và khả năng tương thích cao nhất với SQL Server. Cơ chế App Router cho phép truy vấn dữ liệu tài chính trực tiếp trên Server (Server Components), tăng cường bảo mật và hiệu năng cho Dashboard.

**Initialization Command:**

```bash
npx create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

**Architectural Decisions Provided by Starter:**

*   **Language & Runtime:** TypeScript (Type-safe), Node.js Runtime.
*   **Styling Solution:** Tailwind CSS.
*   **Code Organization:** App Router Structure (`src/app`), Import aliases (@/*).

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
*   **Data Access:** Sử dụng **Prisma ORM** để tương tác với Microsoft SQL Server.
*   **Authentication:** Sử dụng **NextAuth.js v5 (Auth.js)** cho quản lý phiên và bảo mật.
*   **API Pattern:** Ưu tiên sử dụng **Server Actions** cho các thao tác ghi dữ liệu (Mutations) để tối ưu hiệu năng và bảo mật server-side.

**Important Decisions (Shape Architecture):**
*   **Dashboard Visuals:** Sử dụng **Tremor** kết hợp với **Shadcn UI** để tạo giao diện Dashboard chuyên nghiệp và sang trọng cho cấp điều hành.
*   **Validation:** Sử dụng **Zod** để kiểm tra dữ liệu đầu vào (Schema validation) từ phía client lên server.

**Deferred Decisions (Post-MVP):**
*   **Caching Strategy:** Sẽ tối ưu bằng Redis sau khi lượng dữ liệu và người dùng tăng cao.
*   **Real-time Notifications:** Sẽ cân nhắc sử dụng Pusher hoặc Socket.io ở Phase 3.

### Data Architecture
*   **Database:** Microsoft SQL Server (với Prisma v6+).
*   **Schema Design:** Quan hệ (Relational) - Chặt chẽ giữa Client -> Quota -> Request -> Worklog.

### Authentication & Security
*   **Provider:** Credentials Provider (nội bộ) và sẵn sàng cho Azure AD (OIDC).
*   **Security:** Encryption at rest cho dữ liệu lương; Server-side RBAC enforcement.

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
PremiumService/
├── prisma/
│   ├── schema.prisma          # Database models (Bao gồm Binary data cho Evidence)
│   └── seed.ts                # Seed data cho SRO types & Admin gốc
├── src/
│   ├── actions/               # Server Actions (Business Logic + Image Compression)
│   │   ├── clients.ts
│   │   ├── requests.ts
│   │   ├── worklogs.ts
│   │   └── admin.ts
│   ├── app/                   # App Router
│   │   ├── (auth)/            # Login/Logout
│   │   ├── (dashboard)/       # Authenticated Layout
│   │   │   ├── layout.tsx     # Sidebar/Header navigation
│   │   │   ├── page.tsx       # KPI Overview
│   │   │   ├── clients/       # Quota setup
│   │   │   ├── requests/      # Kanban board
│   │   │   ├── worklogs/      # Audit & Logging
│   │   │   └── admin/         # Profitability (Executive only)
│   ├── components/
│   │   ├── ui/                # Shared UI (Shadcn)
│   │   ├── dashboard/         # Executive Charts (Tremor)
│   │   └── features/          # Feature-specific components
│   ├── hooks/                 # Custom Client Hooks (UI State, Data Filtering)
│   ├── lib/
│   │   ├── prisma.ts          # Singleton Client
│   │   ├── auth.ts            # NextAuth options
│   │   ├── cache.ts           # Caching logic cho SQL Server
│   │   └── utils.ts           # Formatters (Money, Date)
│   ├── schemas/               # Zod validation schemas
│   ├── types/                 # TypeScript interfaces
│   └── middleware.ts          # Auth guard & Route protection
├── .env                       # DB_URL & AUTH_SECRET
└── package.json
```

### Architectural Boundaries

**Data & Storage Boundary:**
*   **Evidence Storage:** Toàn bộ file bằng chứng được nén và lưu trực tiếp vào SQL Server dưới dạng `VARBINARY(MAX)`. Không sử dụng hệ thống file nội bộ để tối ưu việc backup và quản lý storage.
*   **Access Layer:** Chỉ Server Actions mới có quyền truy cập trực tiếp vào cơ sở dữ liệu thông qua Prisma.

**Component & Logic Boundary:**
*   **Client vs Server:** Sử dụng Server Components cho việc fetch dữ liệu báo cáo nặng. Chỉ các form tương tác hoặc biểu đồ động mới sử dụng Client Components.
*   **Authorization:** Phân quyền được kiểm tra ở cấp độ Route (Middleware) và cấp độ Function (Server Actions).

### Requirements to Structure Mapping

*   **FR13 (Evidence):** Xử lý nén tại `src/actions/worklogs.ts` và lưu vào DB.

## Architecture Validation Results

### Coherence Validation ✅
Các quyết định về Next.js 15, Prisma và SQL Server hoàn toàn tương thích. Quy tắc đặt tên đồng nhất giúp AI Agent tránh xung đột khi lập trình.

### Requirements Coverage Validation ✅
Toàn bộ 23 yêu cầu chức năng (FR) và các yêu cầu phi chức năng (NFR) về bảo mật/hiệu năng đã được ánh xạ vào cấu trúc thư mục và mô hình Server Actions.

### Implementation Readiness Validation ✅
Hệ thống đã sẵn sàng triển khai. Các điểm xung đột tiềm năng (lưu trữ file) đã được giải quyết bằng phương án lưu trữ Binary trong DB có nén ảnh.

### Architecture Readiness Assessment
**Overall Status:** **READY FOR IMPLEMENTATION**
**Confidence Level:** **High**

### Implementation Handoff

**AI Agent Guidelines:**
*   Tuân thủ nghiêm ngặt quy tắc đặt tên (PascalCase cho bảng DB, camelCase cho cột).
*   Mọi thao tác ghi dữ liệu (Mutations) bắt buộc dùng Server Actions.
*   Kiểm tra Session và Role bên trong Server Actions cho các dữ liệu nhạy cảm (Lương, Lợi nhuận).

**First Implementation Priority:**
Khởi tạo dự án bằng lệnh:
```bash
npx create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```
Sau đó cấu hình Prisma kết nối với SQL Server.

### API & Communication Patterns
*   **Pattern:** Next.js Server Actions cho phần lớn các hành động nghiệp vụ.
*   **Error Handling:** Cấu hình Global Error Boundary và thông báo lỗi thân thiện qua Sonner toast.

### Frontend Architecture
*   **Framework:** Next.js 15 (App Router).
*   **State Management:** React Server Components (RSC) cho fetching; Context API/Zustand cho trạng thái UI phức tạp.

### Infrastructure & Deployment
*   **Hosting:** Internal Windows Server / Docker Container.
*   **CI/CD:** GitHub Actions hoặc Jenkins (nội bộ).

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming Conventions (SQL Server + Prisma):**
*   Tables: **PascalCase** (Ví dụ: `Client`, `ServiceRequest`, `Worklog`).
*   Columns: **camelCase** (Ví dụ: `id`, `clientName`, `actualHours`).
*   *Rationale:* PascalCase phù hợp với tiêu chuẩn SQL Server, camelCase giúp mapping mượt mà sang TypeScript.

**Code Naming Conventions:**
*   Files: **kebab-case** (Ví dụ: `request-form.tsx`, `quota-summary.tsx`).
*   Components: **PascalCase** (Ví dụ: `RequestList`).
*   Server Actions: **[Action][Object]** (Ví dụ: `createRequest`, `auditTask`).

### Structure Patterns

**Project Organization:**
*   `src/app`: Cấu trúc route của Next.js. Gom các component đặc thù của route vào thư mục `_components` nội bộ.
*   `src/components/ui`: Thành phần giao diện cơ bản (Shadcn).
*   `src/actions`: Chứa toàn bộ Server Actions xử lý nghiệp vụ.
*   `src/lib`: Chấu hình các thư viện bên thứ 3 (Prisma, NextAuth).
*   `src/schemas`: Chứa Zod schemas cho validation.

### Format Patterns

**API & Data Formats:**
*   **API Response:** `{ success: boolean, data?: T, error?: string }`.
*   **Date Format:** ISO 8601 strings.
*   **Financial Accuracy:** Sử dụng kiểu dữ liệu **Decimal** (Precision: 18, Scale: 2) trong SQL Server cho mọi giá trị tiền tệ hoặc chi phí nhân công.

### Process Patterns

**Error & Loading Handling:**
*   Sử dụng `sonner` cho các thông báo Toast phía Client.
*   Sử dụng `loading.tsx` và `Skeleton` component cho trạng thái chờ dữ liệu.
*   Validation: Thực hiện validation ở cả Client (cho UX) và Server (cho bảo mật) bằng Zod.

### Enforcement Guidelines

**All AI Agents MUST:**
*   Sử dụng TypeScript nghiêm ngặt (không dùng `any`).
*   Bắt buộc gắn `use server` cho các file trong thư mục `actions`.
*   Luôn kiểm tra quyền truy cập (Session check) bên trong Server Actions trước khi thực thi logic.
