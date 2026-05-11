# Session Summary — 2026-05-07
**Agent**: Amelia (bmad-agent-dev)  
**Project**: PremiumService Internal Management  
**Server**: `npm run dev` → http://localhost:3000  

> ⚠️ **Quy tắc**: Sau thay đổi `schema.prisma` → `npx prisma db push && npx prisma generate` → **restart server bắt buộc**

---

## ✅ HOÀN THÀNH HÔM NAY

### Epic 3.1 — Service Request Initialization ✓ DONE

**Schema (`prisma/schema.prisma`)**
- `ServiceRequestItem` (junction table): `requestId` → `sroRuleId` + `quantity Int @default(1)` + `note`
- `ServiceRequest` thêm field `userRequirement String? @db.Text`
- Quan hệ: `ServiceRequest → [ServiceRequestItem] → SRORule`

**Actions (`src/actions/request.ts`)**
- `createServiceRequest`: sroItems = `[{sroRuleId, quantity}]` qua FormData key `sroItems`
- `updateServiceRequest`: Delete-then-recreate items với quantity
- `deactivateExpiredPackages()`: Tự chạy khi tạo request, set `isActive=false` cho gói quá `validTo`

**UI — Form (`src/app/requests/RequestForm.tsx`)**
- `onSubmit` + `e.preventDefault()` — **không reset state khi validation fail**
- Flow: KH → Gói → Ngày → Tiêu đề → [Yêu cầu KH | Mô tả kỹ thuật] → SRO list
- SRO: Dropdown add + danh sách rows với `−` qty `+` và nút xóa trash
- Tổng giờ dự kiến hiện realtime
- Edit mode: Client/Package disabled

**UI — List & Detail**
- `RequestList.tsx`: Multi-SRO tags, link code → `/requests/[id]`, Edit icon
- `requests/[id]/RequestDetailView.tsx`: Layout 2 cột, quantity badge `x3`, `estimateHours × qty`, Resource Impact card

**I18n (`src/lib/i18n.ts`)**
- Từ điển VI/EN đầy đủ: labels, placeholders, errors, roles, status
- `menu-items.ts` keys → lowercase đồng bộ i18n
- Header: `useLanguage` + `t()` đúng cách; role: `t(\`${role.toLowerCase()}_role\`)`

### Bugs Đã Fix Hôm Nay
| Bug | Root Cause | Fix |
|-----|-----------|-----|
| `Unknown field items` Prisma | Cache Prisma Client cũ | `prisma generate` + restart |
| `t is not defined` Header | Thiếu `useLanguage` import | `const { t } = useLanguage()` |
| `CalendarIcon not defined` | Import tên khác | `import { Calendar as CalendarIcon }` |
| Form reset on validation fail | `<form action={fn}>` trigger reload | `<form onSubmit={fn}>` + `e.preventDefault()` |
| 1 Request chỉ 1 SRO | Direct FK | Junction table `ServiceRequestItem` |
| Language không đổi Sidebar | Keys hoa/thường khác nhau | Lowercase key trong `menu-items.ts` |

---

## 🐛 CHƯA VERIFY (Kiểm tra đầu ngày mai)

1. Trang `/requests` sau schema change — restart server xác nhận có hiển thị đúng?
2. Edit mode: SRO items cũ load đúng với `quantity` field mới?
3. Sidebar language switch sau khi fix key lowercase?
4. Auto-deactivate: Test với package có `validTo` < today

---

## 📋 NGÀY MAI SẼ LÀM (theo thứ tự ưu tiên)

### 🔴 Priority 1 — Story 3.2: Kanban Board
Route: `/kanban` hoặc tab trong `/requests`

**Spec**:
- 3 cột: `TODO` → `IN_PROGRESS` → `DONE`
- Card: Mã ticket, KH, SRO tags (multi), giờ dự kiến
- Drag & drop giữa cột → PATCH status về DB
- Filter theo KH / Package
- **Tech**: `@dnd-kit/core` (nhẹ, Next.js 15 compatible)

### 🟡 Priority 2 — Quota Safeguard (Story 3.4)
- Tính `totalUsedHours` tháng hiện tại per Package
- Warning banner khi tạo request nếu vượt `monthlyQuota`
- Progress bar trên trang KH detail + Request Form

### 🟢 Priority 3 — Admin SRO Management
- `/admin` → Tab "Loại công việc (SRO)"
- CRUD SRORule per Package — TAS tự thêm/xóa/sửa

### ⚪ Priority 4 — I18n Cleanup
- Scan `/clients`, `/admin`, `/reports`, dashboard còn hardcode VI
- Dùng `grep "text-" --include="*.tsx"` để tìm text node còn tiếng Việt thuần

---

## 📁 KEY FILES MAP

| File | Mục đích |
|------|---------|
| `prisma/schema.prisma` | Schema DB — xem quan hệ ServiceRequest ↔ Item ↔ SRORule |
| `src/actions/request.ts` | Server actions — create/update với sroItems |
| `src/app/requests/RequestForm.tsx` | Form tạo/sửa — onSubmit, SRO list UI |
| `src/app/requests/RequestList.tsx` | Danh sách requests — multi-SRO tags |
| `src/app/requests/[id]/RequestDetailView.tsx` | Chi tiết request — quantity display |
| `src/lib/i18n.ts` | Toàn bộ từ điển VI/EN |
| `src/lib/menu-items.ts` | Menu config — keys lowercase |
| `src/context/LanguageContext.tsx` | Language provider + `useLanguage` hook |
| `src/components/layout/Header.tsx` | Header với `t()` và userRole prop |

## 🔧 COMMANDS HAY DÙNG

```powershell
# Kill server đang chạy (thay <PID>)
taskkill /PID <PID> /F

# Sau khi thay đổi schema
npx prisma db push
npx prisma generate

# Start server
npm run dev
```
