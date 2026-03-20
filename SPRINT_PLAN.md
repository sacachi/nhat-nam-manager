# Kế Hoạch Rà Soát Phân Quyền — Nhat Nam Manager

> Cập nhật: 20/03/2026  
> Mục tiêu: Rà soát và siết chặt phân quyền theo nguyên tắc **need-to-know** cho tất cả API và giao diện.  
> Lịch sử sprint 1–18 đã được chuyển sang `document.md`.

---

## Nguyên Tắc Phân Quyền

### Roles

| Role | Mô tả |
|------|-------|
| **Admin** | Toàn quyền — xem/tạo/sửa/xóa mọi dữ liệu |
| **Sale** | Quản lý khách hàng, lead, thu tiền. Xem giá trị hợp đồng & tài chính |
| **Design** | Chỉ xem/thao tác task được giao. Không xem tài chính |
| **Construction** | Chỉ xem/thao tác task được giao + chi phí do mình tạo. Không xem tài chính tổng |

### Quy Tắc Tài Chính

| Dữ liệu | Admin | Sale | Design | Construction |
|----------|-------|------|--------|-------------|
| Giá trị hợp đồng (contract_value) | ✅ | ✅ | ❌ | ❌ |
| Tổng thu tiền (receipts tổng) | ✅ | ✅ | ❌ | ❌ |
| Tổng chi phí (expenses tổng) | ✅ | ✅ | ❌ | ❌ |
| Lợi nhuận | ✅ | ✅ | ❌ | ❌ |
| Thu tiền chi tiết | ✅ Tất cả | ✅ Tất cả | ❌ | ❌ |
| Chi phí chi tiết | ✅ Tất cả | ✅ Tất cả | ❌ | ✅ Chỉ do mình tạo |
| Chi phí trên task | ✅ | ✅ | ❌ | ✅ Chỉ task của mình |

### Quy Tắc CRUD

| Entity | Tạo | Xem | Sửa | Xóa |
|--------|-----|-----|-----|-----|
| **Project** | Admin, Sale | Tất cả (ẩn tài chính cho Design/Construction) | Admin, Sale | Admin |
| **Receipt** | Admin, Sale | Admin, Sale | Admin, Sale (chỉ owner hoặc Admin) | Admin |
| **Expense** | Admin, Construction | Admin, Sale: tất cả. Construction: chỉ do mình tạo | Admin (tất cả), Construction (chỉ do mình tạo) | Admin |
| **Task** | Admin, Sale, Design, Construction | Admin/Sale: tất cả. Design/Construction: chỉ assigned | Tất cả (chỉ task liên quan) | Admin |
| **Customer** | Admin, Sale | Tất cả (phone masked cho Design/Construction) | Admin, Sale | Admin |
| **Lead** | Admin, Sale | Admin: tất cả, Sale: của mình, Design: được gán | Admin, Sale (owner) | Admin |

---

## Kết Quả Rà Soát Hiện Trạng

### Lỗ Hổng Nghiêm Trọng (CRITICAL)

| # | Endpoint | Vấn đề | Mức độ |
|---|----------|--------|--------|
| 1 | `GET /api/projects` | Không có role check. Design/Construction xem được contract_value, total_received, total_spent của tất cả project | 🔴 Critical |
| 2 | `GET /api/projects/:id` | Trả về toàn bộ receipts, expenses, contract_value cho mọi user | 🔴 Critical |
| 3 | `GET /api/receipts` | Không có auth check. Mọi user xem được toàn bộ thu tiền | 🔴 Critical |
| 4 | `GET /api/expenses` | Không có auth check. Mọi user xem được toàn bộ chi phí | 🔴 Critical |
| 5 | `POST /api/receipts` | Không có role check. Design/Construction tạo được phiếu thu | 🔴 Critical |
| 6 | `PUT /api/receipts/:id` | Không có role/ownership check. Ai cũng sửa được phiếu thu bất kỳ | 🔴 Critical |
| 7 | `PUT /api/expenses/:id` | Không có role/ownership check. Ai cũng sửa được chi phí bất kỳ | 🔴 Critical |

### Lỗ Hổng Cao (HIGH)

| # | Endpoint | Vấn đề | Mức độ |
|---|----------|--------|--------|
| 8 | `PUT /api/projects/:id` | Chỉ chặn Design. Construction vẫn sửa được project + contract_value | 🟠 High |
| 9 | `POST /api/projects` | Chỉ chặn Design. Construction tạo được project | 🟠 High |
| 10 | `PUT /api/tasks/:id` | Không check ownership. User sửa được task không phải của mình | 🟠 High |
| 11 | `middleware/auth.global.ts` | Chỉ guard /task-management. Các route /receipts, /expenses, /reports, /users, /logs không có guard | 🟠 High |

### Lỗ Hổng Trung Bình (MEDIUM)

| # | Endpoint | Vấn đề | Mức độ |
|---|----------|--------|--------|
| 12 | `GET /api/dashboard` | Non-admin vẫn nhận totalReceived/totalSpent (của mình) — cần ẩn cho Design | 🟡 Medium |
| 13 | `GET /api/tasks` | Sale xem total_expense trên task — có thể intentional | 🟡 Medium |
| 14 | `pages/projects.vue` | Không ẩn cột tài chính cho Design/Construction — chỉ ẩn nút CRUD | 🟡 Medium |

---

## Sprint 19 — Rà Soát Phân Quyền Toàn Hệ Thống

### Task 19.1: API Projects — Ẩn tài chính cho Design/Construction

**Files:** `server/api/projects/index.get.ts`, `server/api/projects/[id].get.ts`

**Thay đổi:**
- `index.get.ts`: Thêm `getAuthUser(event)`. Nếu role là Design hoặc Construction:
  - Loại bỏ `contract_value`, `total_received`, `total_spent` khỏi response
  - Hoặc set = `null`
- `[id].get.ts`: Nếu role là Design/Construction:
  - Loại bỏ `contract_value` 
  - Loại bỏ mảng `receipts` 
  - Loại bỏ mảng `expenses` (trừ expenses do chính user đó tạo — dành cho Construction)

**Acceptance Criteria:**
- [ ] Design gọi `GET /api/projects` → không thấy contract_value, total_received, total_spent
- [ ] Construction gọi `GET /api/projects/:id` → không thấy receipts, chỉ thấy expenses do mình tạo
- [ ] Admin/Sale → vẫn thấy đầy đủ như cũ

---

### Task 19.2: API Receipts — Role check + ownership

**Files:** `server/api/receipts/index.get.ts`, `server/api/receipts/index.post.ts`, `server/api/receipts/[id].put.ts`

**Thay đổi:**
- `index.get.ts`: Thêm `getAuthUser(event)`. 
  - Admin/Sale: trả tất cả (không đổi)
  - Design/Construction: trả `403 Forbidden`
- `index.post.ts`: Thêm `requireSaleOrAdmin(event)`
- `[id].put.ts`: Thêm role check — chỉ Admin hoặc owner (created_by === user.id) mới sửa được

**Acceptance Criteria:**
- [ ] Design gọi `GET /api/receipts` → 403
- [ ] Construction gọi `POST /api/receipts` → 403
- [ ] Sale sửa receipt không phải mình tạo → 403 (chỉ Admin bypass)

---

### Task 19.3: API Expenses — Role check + ownership cho Construction

**Files:** `server/api/expenses/index.get.ts`, `server/api/expenses/[id].put.ts`

**Thay đổi:**
- `index.get.ts`: Thêm `getAuthUser(event)`.
  - Admin/Sale: trả tất cả
  - Construction: chỉ trả expenses có `created_by === user.id`
  - Design: trả `403 Forbidden`
- `[id].put.ts`: Thêm role + ownership check:
  - Admin: sửa tất cả
  - Construction: chỉ sửa expense do mình tạo
  - Sale: sửa tất cả (hoặc chỉ Admin — tùy quyết định)
  - Design: 403

**Acceptance Criteria:**
- [ ] Construction gọi `GET /api/expenses` → chỉ thấy expenses mình tạo
- [ ] Design gọi `GET /api/expenses` → 403
- [ ] Construction sửa expense của người khác → 403

---

### Task 19.4: API Projects — Chặn Construction tạo/sửa project

**Files:** `server/api/projects/index.post.ts`, `server/api/projects/[id].put.ts`

**Thay đổi:**
- Cả 2 file: đổi guard từ chỉ chặn Design → chặn cả Design + Construction  
  ```
  if (['Design', 'Construction'].includes(user.role))
  ```

**Acceptance Criteria:**
- [ ] Construction gọi `POST /api/projects` → 403
- [ ] Construction gọi `PUT /api/projects/:id` → 403
- [ ] Admin/Sale → hoạt động bình thường

---

### Task 19.5: API Tasks — Ownership check trên PUT

**Files:** `server/api/tasks/[id].put.ts`

**Thay đổi:**
- Admin/Sale: sửa bất kỳ task nào
- Design/Construction: chỉ sửa task mà mình là `assignee_id` hoặc `created_by`

**Acceptance Criteria:**
- [ ] Design sửa task không phải assigned cho mình → 403
- [ ] Construction sửa task assigned cho mình → thành công
- [ ] Admin sửa bất kỳ task → thành công

---

### Task 19.6: Route Guards — Middleware auth.global.ts

**Files:** `middleware/auth.global.ts`

**Thay đổi:**
- Thêm guard cho các route nhạy cảm:
  ```
  /receipts → chỉ Admin, Sale
  /expenses → chỉ Admin, Construction
  /reports → chỉ Admin
  /performance → chỉ Admin
  /users → chỉ Admin
  /logs → chỉ Admin
  ```

**Acceptance Criteria:**
- [ ] Design truy cập `/receipts` → redirect về `/`
- [ ] Construction truy cập `/receipts` → redirect về `/`
- [ ] Sale truy cập `/expenses` → redirect về `/`

---

### Task 19.7: Frontend Projects — Ẩn cột tài chính

**Files:** `pages/projects.vue`

**Thay đổi:**
- Thêm `canViewFinance` computed = role Admin hoặc Sale
- Ẩn các cột: "Hợp đồng (VNĐ)", "Đã thu", "Đã chi", "Lợi nhuận" nếu `!canViewFinance`
- Trong detail dialog: ẩn tab/section tài chính nếu `!canViewFinance`
- Construction: chỉ hiện expenses do mình tạo trong project detail

**Acceptance Criteria:**
- [ ] Design mở `/projects` → không thấy cột tiền
- [ ] Construction mở project detail → chỉ thấy expense do mình tạo
- [ ] Admin/Sale → hiển thị đầy đủ

---

### Task 19.8: Dashboard — Ẩn tài chính cho Design

**Files:** `server/api/dashboard/index.get.ts`, `pages/index.vue`

**Thay đổi:**
- API: Design role → không trả `totalReceived`, `totalSpent` 
- Frontend: đã OK (chỉ Admin thấy financial cards) — verify lại

**Acceptance Criteria:**
- [ ] Design gọi `GET /api/dashboard` → không có totalReceived/totalSpent
- [ ] Dashboard UI cho Design → chỉ thấy task metrics

---

## Tóm Tắt Files Cần Sửa

### Server API (10 files)

| File | Thay đổi |
|------|---------|
| `server/api/projects/index.get.ts` | Thêm auth + ẩn tài chính cho Design/Construction |
| `server/api/projects/[id].get.ts` | Ẩn receipts/expenses/contract_value cho Design/Construction |
| `server/api/projects/index.post.ts` | Chặn Construction (hiện chỉ chặn Design) |
| `server/api/projects/[id].put.ts` | Chặn Construction (hiện chỉ chặn Design) |
| `server/api/receipts/index.get.ts` | Thêm auth + chặn Design/Construction |
| `server/api/receipts/index.post.ts` | Thêm requireSaleOrAdmin |
| `server/api/receipts/[id].put.ts` | Thêm role + ownership check |
| `server/api/expenses/index.get.ts` | Thêm auth + filter cho Construction, chặn Design |
| `server/api/expenses/[id].put.ts` | Thêm role + ownership check |
| `server/api/tasks/[id].put.ts` | Thêm ownership check cho Design/Construction |
| `server/api/dashboard/index.get.ts` | Ẩn tài chính cho Design |

### Frontend (2 files)

| File | Thay đổi |
|------|---------|
| `middleware/auth.global.ts` | Route guards cho /receipts, /expenses, /reports, /users, /logs |
| `pages/projects.vue` | canViewFinance — ẩn cột tài chính cho Design/Construction |

---

## Ưu Tiên Triển Khai

Thứ tự theo mức độ nghiêm trọng:

1. **Task 19.6** — Route guards (chặn truy cập trực tiếp) — ✅ Hoàn thành
2. **Task 19.2** — Receipts API — ✅ Hoàn thành
3. **Task 19.3** — Expenses API — ✅ Hoàn thành
4. **Task 19.1** — Projects API — ✅ Hoàn thành
5. **Task 19.4** — Chặn Construction CRUD project — ✅ Hoàn thành
6. **Task 19.5** — Task ownership — ✅ Hoàn thành
7. **Task 19.7** — Frontend ẩn cột tài chính — ✅ Hoàn thành
8. **Task 19.8** — Dashboard cleanup — ✅ Hoàn thành

---

## Sprint 19 — Hoàn Thành ✅

**Ngày hoàn thành:** 20/03/2026

### Tóm Tắt Thay Đổi

#### API Endpoints (10 files)
- `server/api/receipts/*` - Thêm auth check, chặn Design/Construction
- `server/api/expenses/*` - Thêm auth + ownership check cho Construction
- `server/api/projects/*` - Ẩn tài chính cho Design/Construction, chặn Construction CRUD
- `server/api/tasks/[id].put.ts` - Thêm ownership check
- `server/api/dashboard/index.get.ts` - Ẩn tài chính cho Design

#### Frontend (2 files)
- `middleware/auth.global.ts` - Route guards cho /receipts, /expenses, /reports, etc.
- `pages/projects.vue` - Ẩn cột tài chính cho Design/Construction

### Kết Quả Kiểm Tra

| # | Endpoint | Trước | Sau |
|---|----------|-------|-----|
| 1 | GET /api/projects | Không check | ✅ Ẩn tài chính cho Design/Construction |
| 2 | GET /api/projects/:id | Trả full | ✅ Ẩn receipts, expenses |
| 3 | GET /api/receipts | Không check | ✅ 403 cho Design/Construction |
| 4 | GET /api/expenses | Không check | ✅ Chỉ trả expenses của Construction |
| 5 | POST /api/receipts | Không check | ✅ Chỉ Admin/Sale |
| 6 | PUT /api/receipts/:id | Không check | ✅ Ownership check |
| 7 | PUT /api/expenses/:id | Không check | ✅ Ownership check |
| 8 | PUT /api/projects/:id | Chỉ chặn Design | ✅ Chặn Design + Construction |
| 9 | POST /api/projects | Chỉ chặn Design | ✅ Chặn Design + Construction |
| 10 | PUT /api/tasks/:id | Không check | ✅ Ownership check |
| 11 | Route guards | Chỉ /task-management | ✅ Full coverage