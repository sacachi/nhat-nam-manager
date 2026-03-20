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
| **Accounting** | Kế toán — quản lý tài chính, xuất nhập tồn, công nợ NCC, nhà cung cấp. Không quản lý nhân sự |
| **Sale** | Quản lý khách hàng, lead, thu tiền. Xem giá trị hợp đồng & tài chính |
| **Design** | Chỉ xem/thao tác task được giao. Không xem tài chính |
| **Construction** | Chỉ xem/thao tác task được giao + chi phí do mình tạo. Không xem tài chính tổng |

### Quy Tắc Tài Chính

| Dữ liệu | Admin | Accounting | Sale | Design | Construction |
|----------|-------|------------|------|--------|-------------|
| Giá trị hợp đồng (contract_value) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Tổng thu tiền (receipts tổng) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Tổng chi phí (expenses tổng) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lợi nhuận | ✅ | ✅ | ✅ | ❌ | ❌ |
| Thu tiền chi tiết | ✅ Tất cả | ✅ Tất cả | ✅ Tất cả | ❌ | ❌ |
| Chi phí chi tiết | ✅ Tất cả | ✅ Tất cả | ✅ Tất cả | ❌ | ✅ Chỉ do mình tạo |
| Chi phí trên task | ✅ | ✅ | ✅ | ❌ | ✅ Chỉ task của mình |
| Xuất nhập tồn kho | ✅ | ✅ | ❌ | ❌ | ❌ |
| Công nợ NCC | ✅ | ✅ | ❌ | ❌ | ❌ |
| Nhà cung cấp | ✅ | ✅ | ❌ | ❌ | ❌ |

### Quy Tắc CRUD

| Entity | Tạo | Xem | Sửa | Xóa |
|--------|-----|-----|-----|-----|
| **Project** | Admin, Sale | Tất cả (ẩn tài chính cho Design/Construction) | Admin, Sale | Admin |
| **Receipt** | Admin, Sale, Accounting | Admin, Sale, Accounting | Admin, Accounting, Sale (chỉ owner hoặc Admin/Accounting) | Admin |
| **Expense** | Admin, Construction, Accounting | Admin, Sale, Accounting: tất cả. Construction: chỉ do mình tạo | Admin, Accounting (tất cả), Construction (chỉ do mình tạo) | Admin |
| **Task** | Admin, Sale, Design, Construction | Admin/Sale: tất cả. Design/Construction: chỉ assigned. Accounting: ❌ | Tất cả (chỉ task liên quan) | Admin |
| **Customer** | Admin, Sale | Tất cả (phone masked cho Design/Construction) | Admin, Sale | Admin |
| **Lead** | Admin, Sale | Admin: tất cả, Sale: của mình, Design: được gán | Admin, Sale (owner) | Admin |
| **Material** | Admin, Accounting | Admin, Accounting | Admin, Accounting | Admin |
| **Supplier** | Admin, Accounting | Admin, Accounting | Admin, Accounting | Admin |
| **StockIn** | Admin, Accounting | Admin, Accounting | — (chỉ hủy) | Admin, Accounting |
| **StockOut** | Admin, Accounting | Admin, Accounting | — (chỉ hủy) | Admin, Accounting |
| **SupplierPayment** | Admin, Accounting | Admin, Accounting | — | Admin, Accounting |

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
  /receipts    → chỉ Admin, Accounting, Sale
  /expenses    → chỉ Admin, Accounting, Construction
  /reports     → chỉ Admin, Accounting
  /performance → chỉ Admin
  /users       → chỉ Admin
  /logs        → chỉ Admin, Accounting
  /materials   → chỉ Admin, Accounting
  /suppliers   → chỉ Admin, Accounting
  /stock-in    → chỉ Admin, Accounting
  /stock-out   → chỉ Admin, Accounting
  /supplier-debt → chỉ Admin, Accounting
  ```

**Acceptance Criteria:**
- [ ] Design truy cập `/receipts` → redirect về `/`
- [ ] Construction truy cập `/receipts` → redirect về `/`
- [ ] Sale truy cập `/expenses` → redirect về `/`

---

### Task 19.7: Frontend Projects — Ẩn cột tài chính

**Files:** `pages/projects.vue`

**Thay đổi:**
- Thêm `canViewFinance` computed = role Admin, Accounting hoặc Sale
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
- API: Design/Construction role → không trả `totalReceived`, `totalSpent` 
- Accounting role → trả đầy đủ tài chính (giống Admin/Sale)
- Frontend: đã OK (chỉ Admin thấy financial cards) — cập nhật cho Accounting cũng thấy

**Acceptance Criteria:**
- [ ] Design gọi `GET /api/dashboard` → không có totalReceived/totalSpent
- [ ] Accounting gọi `GET /api/dashboard` → có đầy đủ tài chính
- [ ] Dashboard UI cho Accounting → thấy financial cards

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

---

# KẾ HOẠCH: QUẢN LÝ VẬT TƯ — Nhat Nam Manager

> Ngày lập: 20/03/2026  
> Mức độ: **Major Feature** — thêm module hoàn chỉnh  
> Ước tính: 5 Sprint (Sprint 20 – 24)

---

## I. Tổng quan & Triết lý thiết kế

### Mục tiêu
Xây dựng hệ thống quản lý vật tư khép kín: từ danh mục vật tư, nhà cung cấp, nhập kho, xuất kho cho công trình, theo dõi tồn kho, tính giá vốn bình quân gia quyền, quản lý công nợ NCC, và tự động cập nhật chi phí vật tư cho project.

### Luồng chính

```
Tạo Vật tư + NCC
       ↓
Nhập kho (mua từ NCC)
  → tăng tồn kho
  → tính lại giá vốn BQGQ
  → tăng công nợ NCC
       ↓
Xuất kho (cho công trình)
  → giảm tồn kho
  → tạo Expense tự động cho Project (giá vốn = BQGQ)
  → ghi log thẻ kho
       ↓
Thanh toán NCC
  → giảm công nợ
  → ghi log
```

### Công thức Bình quân gia quyền (Weighted Average Cost)

**Khi NHẬP KHO:**
```
new_total_value = current_stock × current_avg_cost + nhập_qty × đơn_giá_nhập
new_total_qty   = current_stock + nhập_qty
new_avg_cost    = new_total_value / new_total_qty
```

**Khi XUẤT KHO:**
```
cost_of_issue = xuất_qty × current_avg_cost
new_stock     = current_stock − xuất_qty
// avg_cost KHÔNG ĐỔI khi xuất
```

**Ví dụ minh họa:**
| Giao dịch | SL | Đơn giá | Tồn | Giá trị tồn | Giá vốn BQGQ |
|-----------|-----|---------|-----|-------------|---------------|
| Tồn đầu  | 100 | 50,000  | 100 | 5,000,000   | 50,000        |
| Nhập 200  | 200 | 55,000  | 300 | 16,000,000  | **53,333**    |
| Xuất 150  | 150 | 53,333  | 150 | 8,000,000   | **53,333**    |
| Nhập 100  | 100 | 60,000  | 250 | 14,000,000  | **56,000**    |

---

## II. Data Model (Prisma Schema)

### Bảng mới

```prisma
model Supplier {
  id          String   @id @default(uuid())
  code        String   @unique        // Mã NCC, VD: "NCC-001"
  name        String                  // Tên nhà cung cấp
  phone       String?
  email       String?
  address     String?
  tax_code    String?                 // Mã số thuế
  note        String?
  status      String   @default("active") // "active", "inactive"
  created_at  DateTime @default(now())

  stockIns          StockIn[]
  supplierPayments  SupplierPayment[]
}

model Material {
  id              String   @id @default(uuid())
  code            String   @unique        // Mã VT, VD: "VT-001"
  name            String                  // Tên vật tư
  unit            String                  // Đơn vị tính: "tấm", "m²", "cái", "kg", "m"...
  standard_price  Float    @default(0)    // Giá nhập thông thường (tham khảo)
  current_stock   Float    @default(0)    // Tồn kho hiện tại
  avg_cost        Float    @default(0)    // Giá vốn BQGQ hiện tại
  stock_value     Float    @default(0)    // Giá trị tồn = current_stock × avg_cost
  min_stock_level Float    @default(0)    // Mức tồn tối thiểu (cảnh báo)
  description     String?
  status          String   @default("active") // "active", "inactive"
  created_at      DateTime @default(now())

  stockInItems   StockInItem[]
  stockOutItems  StockOutItem[]
  stockLogs      StockLog[]
}

model StockIn {
  id            String   @id @default(uuid())
  code          String   @unique        // Mã phiếu nhập, VD: "PN-202603-001"
  supplier_id   String
  date          DateTime @default(now())
  total_amount  Float    @default(0)    // Tổng giá trị phiếu nhập
  paid_amount   Float    @default(0)    // Đã thanh toán (tại thời điểm nhập)
  note          String?
  images        String?                 // Ảnh chứng từ, JSON array
  created_by    String
  created_at    DateTime @default(now())

  supplier  Supplier      @relation(fields: [supplier_id], references: [id])
  items     StockInItem[]
  user      User          @relation("StockInCreator", fields: [created_by], references: [id])
}

model StockInItem {
  id           String  @id @default(uuid())
  stock_in_id  String
  material_id  String
  quantity     Float           // Số lượng nhập
  unit_price   Float           // Đơn giá nhập lần này
  total_price  Float           // = quantity × unit_price

  // Snapshot giá vốn tại thời điểm nhập (để audit)
  avg_cost_before Float @default(0)  // Giá vốn BQGQ TRƯỚC khi nhập
  avg_cost_after  Float @default(0)  // Giá vốn BQGQ SAU khi nhập

  stockIn   StockIn  @relation(fields: [stock_in_id], references: [id], onDelete: Cascade)
  material  Material @relation(fields: [material_id], references: [id])
}

model StockOut {
  id           String   @id @default(uuid())
  code         String   @unique        // Mã phiếu xuất, VD: "PX-202603-001"
  project_id   String
  date         DateTime @default(now())
  total_cost   Float    @default(0)    // Tổng giá trị xuất (theo giá vốn BQGQ)
  note         String?
  expense_id   String?  @unique        // Link tới Expense tự động tạo
  created_by   String
  created_at   DateTime @default(now())

  project   Project       @relation(fields: [project_id], references: [id])
  items     StockOutItem[]
  expense   Expense?      @relation(fields: [expense_id], references: [id])
  user      User          @relation("StockOutCreator", fields: [created_by], references: [id])
}

model StockOutItem {
  id            String  @id @default(uuid())
  stock_out_id  String
  material_id   String
  quantity      Float          // Số lượng xuất
  unit_cost     Float          // Giá vốn BQGQ tại thời điểm xuất
  total_cost    Float          // = quantity × unit_cost

  stockOut  StockOut @relation(fields: [stock_out_id], references: [id], onDelete: Cascade)
  material  Material @relation(fields: [material_id], references: [id])
}

model SupplierPayment {
  id           String   @id @default(uuid())
  supplier_id  String
  amount       Float           // Số tiền thanh toán
  date         DateTime @default(now())
  note         String?
  images       String?         // Ảnh chứng từ
  created_by   String
  created_at   DateTime @default(now())

  supplier  Supplier @relation(fields: [supplier_id], references: [id])
  user      User     @relation("SupplierPaymentCreator", fields: [created_by], references: [id])
}

model StockLog {
  id           String   @id @default(uuid())
  material_id  String
  type         String          // "in" | "out"
  reference_id String          // ID của StockIn hoặc StockOut
  reference_code String        // Mã phiếu (để hiển thị nhanh)
  quantity     Float           // Số lượng (+nhập / -xuất)
  unit_price   Float           // Đơn giá giao dịch
  stock_before Float           // Tồn trước giao dịch
  stock_after  Float           // Tồn sau giao dịch
  avg_cost_before Float        // BQGQ trước
  avg_cost_after  Float        // BQGQ sau
  value_before Float           // Giá trị tồn trước
  value_after  Float           // Giá trị tồn sau
  created_at   DateTime @default(now())

  material Material @relation(fields: [material_id], references: [id])
}
```

### Cập nhật bảng hiện có

```prisma
// User — thêm relations
model User {
  // ... existing fields ...
  stockIns          StockIn[]          @relation("StockInCreator")
  stockOuts         StockOut[]         @relation("StockOutCreator")
  supplierPayments  SupplierPayment[]  @relation("SupplierPaymentCreator")
}

// Project — thêm relation
model Project {
  // ... existing fields ...
  stockOuts  StockOut[]
}

// Expense — thêm relation ngược từ StockOut
model Expense {
  // ... existing fields ...
  stockOut  StockOut?   // 1-1 optional: expense được tạo tự động từ phiếu xuất
}
```

### Ý nghĩa thiết kế

| Bảng | Vai trò |
|------|---------|
| **Material** | Danh mục + trạng thái tồn kho real-time (current_stock, avg_cost, stock_value) |
| **Supplier** | Danh mục NCC |
| **StockIn + StockInItem** | Phiếu nhập kho (header + detail), ghi nhận giá nhập từng lần |
| **StockOut + StockOutItem** | Phiếu xuất kho, link tới Project + auto-tạo Expense |
| **SupplierPayment** | Thanh toán công nợ NCC |
| **StockLog** | Thẻ kho (sổ nhật ký vật tư) — audit trail đầy đủ, snapshot trước/sau mỗi giao dịch |

---

## III. API Endpoints

### Nhóm Materials (Vật tư)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/materials` | Danh sách vật tư (tồn kho, giá vốn) |
| POST | `/api/materials` | Thêm vật tư mới |
| PUT | `/api/materials/:id` | Sửa vật tư |
| DELETE | `/api/materials/:id` | Xóa vật tư (chỉ khi tồn = 0, chưa có giao dịch) |
| GET | `/api/materials/:id/stock-log` | Thẻ kho: log nhập/xuất theo thời gian |

### Nhóm Suppliers (Nhà cung cấp)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/suppliers` | Danh sách NCC + công nợ hiện tại |
| POST | `/api/suppliers` | Thêm NCC |
| PUT | `/api/suppliers/:id` | Sửa NCC |
| DELETE | `/api/suppliers/:id` | Xóa NCC (chỉ khi chưa có giao dịch) |
| GET | `/api/suppliers/:id/debt` | Chi tiết công nợ: lịch sử nhập + thanh toán |

### Nhóm Stock In (Nhập kho)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/stock-in` | Danh sách phiếu nhập |
| POST | `/api/stock-in` | Tạo phiếu nhập + cập nhật BQGQ + tăng công nợ |
| GET | `/api/stock-in/:id` | Chi tiết phiếu nhập |
| DELETE | `/api/stock-in/:id` | Hủy phiếu nhập (reverse BQGQ + giảm tồn + giảm nợ) |

### Nhóm Stock Out (Xuất kho)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/stock-out` | Danh sách phiếu xuất |
| POST | `/api/stock-out` | Tạo phiếu xuất + tạo Expense tự động + giảm tồn |
| GET | `/api/stock-out/:id` | Chi tiết phiếu xuất |
| DELETE | `/api/stock-out/:id` | Hủy phiếu xuất (reverse tồn + xóa Expense liên quan) |

### Nhóm Supplier Payment (Thanh toán NCC)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/supplier-payments` | Danh sách thanh toán |
| POST | `/api/supplier-payments` | Tạo thanh toán → giảm công nợ |
| DELETE | `/api/supplier-payments/:id` | Hủy thanh toán → tăng lại công nợ |

### Nhóm Reports (Báo cáo)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/reports/inventory` | Báo cáo tồn kho tổng hợp |
| GET | `/api/reports/supplier-debt` | Tổng hợp công nợ tất cả NCC |

---

## IV. Business Logic chi tiết

### 4.1. POST /api/stock-in — Nhập kho (QUAN TRỌNG NHẤT)

```
Input: { supplier_id, date, note, paid_amount, items: [{ material_id, quantity, unit_price }] }

Xử lý (trong TRANSACTION):
  1. Tạo StockIn header
  2. Với mỗi item:
     a. Lấy Material hiện tại: { current_stock, avg_cost, stock_value }
     b. Snapshot: avg_cost_before = material.avg_cost
     c. Tính BQGQ mới:
        new_value = current_stock × avg_cost + quantity × unit_price
        new_stock = current_stock + quantity
        new_avg   = new_stock > 0 ? new_value / new_stock : unit_price
     d. Tạo StockInItem { ..., avg_cost_before, avg_cost_after: new_avg }
     e. Cập nhật Material:
        current_stock = new_stock
        avg_cost      = new_avg
        stock_value   = new_stock × new_avg
     f. Tạo StockLog { type: "in", stock_before, stock_after, avg_cost_before, avg_cost_after, ... }
  3. Cập nhật StockIn.total_amount = Σ(item.total_price)
  4. Ghi ActivityLog

Output: StockIn with items
```

### 4.2. POST /api/stock-out — Xuất kho

```
Input: { project_id, date, note, items: [{ material_id, quantity }] }

Xử lý (trong TRANSACTION):
  1. Validate: mỗi item.quantity ≤ material.current_stock (không cho xuất quá tồn)
  2. Tạo StockOut header
  3. Với mỗi item:
     a. Lấy Material: { current_stock, avg_cost }
     b. unit_cost = avg_cost (giá vốn tại thời điểm xuất)
     c. total_cost = quantity × unit_cost
     d. Tạo StockOutItem { ..., unit_cost, total_cost }
     e. Cập nhật Material:
        current_stock -= quantity
        stock_value = current_stock × avg_cost
        // avg_cost KHÔNG ĐỔI
     f. Tạo StockLog { type: "out", ... }
  4. total_cost = Σ(item.total_cost)
  5. Auto-tạo Expense:
     {
       project_id,
       type: "material",
       amount: total_cost,
       date,
       note: "Xuất vật tư: [danh sách tên VT × SL]",
       created_by: user.id
     }
  6. Cập nhật StockOut { total_cost, expense_id }
  7. Ghi ActivityLog

Output: StockOut with items + expense_id
```

### 4.3. Công nợ NCC — Computed

```
Công nợ NCC = Σ(StockIn.total_amount WHERE supplier_id) − Σ(SupplierPayment.amount WHERE supplier_id)
```

Query lấy danh sách NCC + công nợ:
```sql
SELECT s.*,
  COALESCE(si.total_in, 0) AS total_purchased,
  COALESCE(sp.total_paid, 0) AS total_paid,
  COALESCE(si.total_in, 0) - COALESCE(sp.total_paid, 0) AS current_debt
FROM Supplier s
LEFT JOIN (SELECT supplier_id, SUM(total_amount) as total_in FROM StockIn GROUP BY supplier_id) si ON si.supplier_id = s.id
LEFT JOIN (SELECT supplier_id, SUM(amount) as total_paid FROM SupplierPayment GROUP BY supplier_id) sp ON sp.supplier_id = s.id
```

### 4.4. Hủy phiếu nhập (DELETE StockIn) — Reverse Logic

```
Xử lý (trong TRANSACTION):
  1. Validate: mỗi item — kiểm tra current_stock ≥ item.quantity (đã xuất hết thì không hủy được)
  2. Với mỗi StockInItem:
     a. material.current_stock -= item.quantity
     b. Tính lại avg_cost:
        remaining_value = material.stock_value - (item.quantity × item.unit_price)
        new_avg = remaining_stock > 0 ? remaining_value / remaining_stock : 0
     c. Cập nhật Material { current_stock, avg_cost, stock_value }
     d. Tạo StockLog { type: "in_cancel", ... }
  3. Xóa StockIn + Items
  4. Ghi ActivityLog
```

### 4.5. Hủy phiếu xuất (DELETE StockOut) — Reverse Logic

```
Xử lý (trong TRANSACTION):
  1. Với mỗi StockOutItem:
     a. Hoàn lại tồn: material.current_stock += item.quantity
     b. Tính lại avg_cost:
        new_value = material.stock_value + item.total_cost
        new_avg = new_value / material.current_stock
     c. Cập nhật Material
     d. Tạo StockLog { type: "out_cancel", ... }
  2. Xóa Expense liên quan (stockOut.expense_id)
  3. Xóa StockOut + Items
  4. Ghi ActivityLog
```

---

## V. Frontend Pages

### 5.1. `/materials` — Danh mục Vật tư

**Layout:** DataTable + Dialog

| Cột | Nội dung |
|-----|---------|
| Mã VT | `code` |
| Tên vật tư | `name` |
| ĐVT | `unit` |
| Giá nhập TT | `standard_price` (format VNĐ) |
| Tồn kho | `current_stock` (highlight đỏ nếu < min_stock_level) |
| Giá vốn BQGQ | `avg_cost` (format VNĐ) |
| Giá trị tồn | `stock_value` (format VNĐ) |
| Trạng thái | Active / Inactive |

**Dialog Thêm/Sửa:** code, name, unit, standard_price, min_stock_level, description

**Click vào vật tư** → mở Thẻ kho (stock log):
- Bảng: Ngày | Loại (Nhập/Xuất) | Mã phiếu | SL | Đơn giá | Tồn trước | Tồn sau | BQGQ trước | BQGQ sau

### 5.2. `/suppliers` — Nhà cung cấp

**Layout:** DataTable + Dialog + Tab công nợ

| Cột | Nội dung |
|-----|---------|
| Mã NCC | `code` |
| Tên NCC | `name` |
| SĐT | `phone` |
| MST | `tax_code` |
| Tổng mua | Σ StockIn.total_amount |
| Đã thanh toán | Σ SupplierPayment.amount |
| **Công nợ** | Tổng mua − Đã TT (highlight đỏ nếu > 0) |

**Click NCC** → Dialog chi tiết công nợ:
- Tab 1: Thông tin NCC
- Tab 2: Lịch sử nhập hàng (StockIn[])
- Tab 3: Lịch sử thanh toán (SupplierPayment[])
- Nút: **Thanh toán** → tạo SupplierPayment

### 5.3. `/stock-in` — Nhập kho

**Layout:** DataTable phiếu nhập + Dialog tạo phiếu

| Cột | Nội dung |
|-----|---------|
| Mã phiếu | `code` |
| Ngày nhập | `date` |
| NCC | `supplier.name` |
| Tổng tiền | `total_amount` |
| Đã TT | `paid_amount` |
| Còn nợ | total_amount − paid_amount |
| Người tạo | `user.name` |

**Dialog Tạo phiếu nhập:**
1. Chọn NCC (Dropdown search)
2. Ngày nhập
3. Bảng items (dynamic rows):
   | Vật tư (autocomplete) | ĐVT | SL | Đơn giá | Thành tiền |
   - Nút "+ Thêm dòng"
   - Tự tính thành tiền = SL × Đơn giá
4. Tổng cộng (auto-sum)
5. Thanh toán ngay (input số tiền, mặc định = 0)
6. Ghi chú
7. Upload ảnh chứng từ
8. Nút **Lưu** → call POST /api/stock-in

### 5.4. `/stock-out` — Xuất kho cho công trình

**Layout:** DataTable phiếu xuất + Dialog

| Cột | Nội dung |
|-----|---------|
| Mã phiếu | `code` |
| Ngày xuất | `date` |
| Công trình | `project.name` |
| Tổng giá vốn | `total_cost` |
| Người tạo | `user.name` |

**Dialog Tạo phiếu xuất:**
1. Chọn Công trình (Dropdown search)
2. Ngày xuất
3. Bảng items:
   | Vật tư (autocomplete) | ĐVT | Tồn kho | SL xuất | Giá vốn BQGQ | Thành tiền |
   - Hiện tồn kho real-time, validate SL xuất ≤ tồn
   - Giá vốn BQGQ auto-fill từ material.avg_cost
4. Tổng giá vốn xuất (auto-sum)
5. Ghi chú
6. Nút **Lưu** → call POST /api/stock-out

> Sau khi lưu, hệ thống tự tạo 1 Expense type="material" cho project tương ứng.

### 5.5. `/supplier-debt` — Tổng hợp công nợ NCC

**Layout:** DataTable tổng hợp + chi tiết

| Cột | Nội dung |
|-----|---------|
| NCC | `name` |
| Tổng phải trả | Σ các phiếu nhập |
| Đã thanh toán | Σ các lần trả |
| **Còn nợ** | Tổng − Đã TT |

**Tổng dòng cuối:** Tổng công nợ tất cả NCC

**Click vào NCC** → Dialog thanh toán + lịch sử

---

## VI. Phân quyền

| Chức năng | Admin | Accounting | Sale | Construction | Design |
|-----------|-------|------------|------|-------------|--------|
| Danh mục vật tư CRUD | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem danh mục vật tư | ✅ | ✅ | ❌ | ❌ | ❌ |
| NCC CRUD | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem NCC | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tạo phiếu nhập | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem phiếu nhập | ✅ | ✅ | ❌ | ❌ | ❌ |
| Hủy phiếu nhập | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tạo phiếu xuất | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem phiếu xuất | ✅ | ✅ | ❌ | ❌ | ❌ |
| Hủy phiếu xuất | ✅ | ✅ | ❌ | ❌ | ❌ |
| Thanh toán NCC | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xem công nợ NCC | ✅ | ✅ | ❌ | ❌ | ❌ |
| Báo cáo tồn kho | ✅ | ✅ | ❌ | ❌ | ❌ |
| Thu tiền (receipts) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Chi phí (expenses) | ✅ | ✅ | ✅ (read) | ✅ (own) | ❌ |
| BC Tài chính | ✅ | ✅ | ❌ | ❌ | ❌ |
| Quản lý nhân viên | ✅ | ❌ | ❌ | ❌ | ❌ |
| Lịch sử hệ thống | ✅ | ✅ (read-only) | ❌ | ❌ | ❌ |

---

## VII. Menu mới

```
// layouts/default.vue — thêm vào menu
Kho vật tư (icon: pi-box)
  ├── Vật tư          → /materials
  ├── Nhà cung cấp    → /suppliers
  ├── Nhập kho        → /stock-in
  ├── Xuất kho        → /stock-out
  └── Công nợ NCC     → /supplier-debt
```

Hiển thị theo role:
- **Admin**: tất cả 5 mục
- **Accounting**: tất cả 5 mục (giống Admin)
- **Sale**: không hiện menu Kho vật tư
- **Construction**: không hiện menu Kho vật tư
- **Design**: không hiện menu Kho vật tư

> ⚠️ Xuất nhập tồn, công nợ, nhà cung cấp **CHỈ** Admin và Accounting được phép truy cập.

### Menu hệ thống đầy đủ cho Accounting

```
Tổng quan        → /              (Dashboard tài chính)
Công trình       → /projects      (xem đầy đủ tài chính, không tạo/sửa/xóa)
Khách hàng       → /customers     (xem, không sửa)
Thu tiền          → /receipts      (CRUD)
Chi phí           → /expenses      (CRUD)
Kho vật tư
  ├── Vật tư          → /materials
  ├── Nhà cung cấp    → /suppliers
  ├── Nhập kho        → /stock-in
  ├── Xuất kho        → /stock-out
  └── Công nợ NCC     → /supplier-debt
BC Tài chính     → /reports
Lịch sử          → /logs          (read-only)
```

> Accounting **KHÔNG** có: Thu thập KH, Công việc (tasks), Kanban, QL Công việc, BC Hiệu suất, Nhân viên.

---

## VIII. Sprint Plan

### Sprint 20 — Schema + Danh mục Vật tư + NCC

| # | Task | Files |
|---|------|-------|
| 20.1 | Thêm 7 model mới vào Prisma schema + migrate | `prisma/schema.prisma` |
| 20.2 | Seed data: vật tư mẫu + NCC mẫu | `prisma/seed.ts` |
| 20.3 | API CRUD Materials | `server/api/materials/` (4 files) |
| 20.4 | API CRUD Suppliers | `server/api/suppliers/` (4 files) |
| 20.5 | Page `/materials` — DataTable + Dialog + Thẻ kho | `pages/materials.vue` |
| 20.6 | Page `/suppliers` — DataTable + Dialog | `pages/suppliers.vue` |
| 20.7 | Thêm menu "Kho vật tư" vào sidebar | `layouts/default.vue` |

**Acceptance:**
- [ ] Tạo/sửa/xóa vật tư hoạt động
- [ ] Tạo/sửa/xóa NCC hoạt động
- [ ] Menu hiển thị đúng theo role

---

### Sprint 21 — Nhập kho + BQGQ + Công nợ

| # | Task | Files |
|---|------|-------|
| 21.1 | API GET /api/stock-in (list) | `server/api/stock-in/index.get.ts` |
| 21.2 | API POST /api/stock-in (tạo + BQGQ + StockLog + công nợ) | `server/api/stock-in/index.post.ts` |
| 21.3 | API GET /api/stock-in/:id (chi tiết) | `server/api/stock-in/[id].get.ts` |
| 21.4 | API DELETE /api/stock-in/:id (hủy + reverse BQGQ) | `server/api/stock-in/[id].delete.ts` |
| 21.5 | API GET /api/materials/:id/stock-log (thẻ kho) | `server/api/materials/[id]/stock-log.get.ts` |
| 21.6 | Page `/stock-in` — DataTable + Dialog tạo phiếu nhập | `pages/stock-in.vue` |
| 21.7 | Cập nhật page `/materials` — hiện thẻ kho khi click | `pages/materials.vue` |

**Acceptance:**
- [ ] Tạo phiếu nhập → tồn kho tăng, BQGQ tính đúng
- [ ] Thẻ kho hiển thị đúng snapshot trước/sau
- [ ] Hủy phiếu nhập → reverse đúng tồn + BQGQ

---

### Sprint 22 — Xuất kho + Auto Expense

| # | Task | Files |
|---|------|-------|
| 22.1 | API GET /api/stock-out (list) | `server/api/stock-out/index.get.ts` |
| 22.2 | API POST /api/stock-out (tạo + giảm tồn + auto-create Expense) | `server/api/stock-out/index.post.ts` |
| 22.3 | API GET /api/stock-out/:id | `server/api/stock-out/[id].get.ts` |
| 22.4 | API DELETE /api/stock-out/:id (reverse + xóa Expense) | `server/api/stock-out/[id].delete.ts` |
| 22.5 | Page `/stock-out` — DataTable + Dialog tạo phiếu xuất | `pages/stock-out.vue` |
| 22.6 | Cập nhật Expense model — thêm relation stockOut | `prisma/schema.prisma` |
| 22.7 | Cập nhật page `/expenses` — hiện link phiếu xuất (nếu có) | `pages/expenses.vue` |

**Acceptance:**
- [ ] Xuất kho → tồn kho giảm, giá vốn BQGQ không đổi
- [ ] Expense tự động tạo đúng amount = qty × avg_cost
- [ ] Không cho xuất quá tồn → hiện lỗi rõ ràng
- [ ] Hủy phiếu xuất → hoàn tồn + xóa Expense

---

### Sprint 23 — Thanh toán NCC + Công nợ

| # | Task | Files |
|---|------|-------|
| 23.1 | API thanh toán NCC (CRUD) | `server/api/supplier-payments/` (3 files) |
| 23.2 | API GET /api/suppliers/:id/debt (chi tiết công nợ) | `server/api/suppliers/[id]/debt.get.ts` |
| 23.3 | API GET /api/reports/supplier-debt (tổng hợp) | `server/api/reports/supplier-debt.get.ts` |
| 23.4 | Page `/supplier-debt` — tổng hợp + thanh toán | `pages/supplier-debt.vue` |
| 23.5 | Cập nhật page `/suppliers` — thêm tab công nợ | `pages/suppliers.vue` |
| 23.6 | Cập nhật page `/stock-in` — hiện trạng thái thanh toán | `pages/stock-in.vue` |

**Acceptance:**
- [ ] Công nợ NCC = Σ nhập − Σ thanh toán (chính xác)
- [ ] Thanh toán → giảm công nợ đúng
- [ ] Hủy thanh toán → tăng lại công nợ

---

### Sprint 24 — Báo cáo tồn kho + Tích hợp Dashboard + Polish

| # | Task | Files |
|---|------|-------|
| 24.1 | API GET /api/reports/inventory (báo cáo tồn kho) | `server/api/reports/inventory.get.ts` |
| 24.2 | Dashboard widget: cảnh báo tồn kho thấp | `server/api/dashboard/index.get.ts`, `pages/index.vue` |
| 24.3 | Dashboard widget: tổng công nợ NCC | `pages/index.vue` |
| 24.4 | Chi tiết project: tab Vật tư xuất — hiện phiếu xuất liên quan | `pages/projects.vue` |
| 24.5 | Phân quyền: route guard + API guard cho tất cả endpoint mới (chỉ Admin + Accounting) | `middleware/auth.global.ts`, các API |
| 24.6 | Seed data: tạo dữ liệu mẫu nhập/xuất + tài khoản Accounting để test | `prisma/seed.ts` |
| 24.7 | Cập nhật user guides (Admin/Accounting) | `docs/GUIDE_ADMIN.md`, `docs/GUIDE_ACCOUNTING.md` |

**Acceptance:**
- [ ] Báo cáo tồn kho hiện đúng tổng giá trị, vật tư dưới mức tối thiểu
- [ ] Dashboard Admin hiện cảnh báo tồn kho + tổng công nợ
- [ ] Chi tiết project hiện danh sách phiếu xuất vật tư
- [ ] Phân quyền hoạt động đúng theo bảng ở Section VI
- [ ] Accounting truy cập đủ tất cả chức năng kho + tài chính
- [ ] Sale/Construction/Design KHÔNG truy cập được kho, NCC, công nợ

---

## IX. Rủi ro & Lưu ý

### 9.1. Concurrency (Đồng thời)
- Khi 2 user nhập/xuất cùng 1 vật tư cùng lúc → race condition trên `current_stock` + `avg_cost`
- **Giải pháp:** Dùng Prisma `$transaction` với isolation level. Trong SQLite, mỗi write tự lock DB nên ít rủi ro. Nếu migrate sang PostgreSQL sau này → cần `SELECT FOR UPDATE`.

### 9.2. Hủy phiếu sau nhiều giao dịch
- Nếu nhập 100, xuất 80, rồi hủy phiếu nhập → tồn = -80 (không hợp lệ)
- **Giải pháp:** Trước khi hủy, validate `material.current_stock ≥ item.quantity`. Nếu không đủ → báo lỗi "Không thể hủy vì vật tư đã được xuất".

### 9.3. Sửa phiếu nhập/xuất
- Không cho sửa phiếu (chỉ hủy + tạo lại) để tránh phức tạp recalculate BQGQ
- **Lý do:** Nếu sửa phiếu nhập cũ → phải recalculate toàn bộ chain BQGQ sau đó → rất phức tạp và dễ sai

### 9.4. Performance
- `StockLog` sẽ grow nhanh → cần index trên `(material_id, created_at)`
- Aggregate công nợ NCC → cache hoặc dùng computed field nếu chậm

---

## X. Tổng kết Files mới

### Server API (≈25 files mới)

```
server/api/
  materials/
    index.get.ts
    index.post.ts
    [id].put.ts
    [id].delete.ts
    [id]/stock-log.get.ts
  suppliers/
    index.get.ts
    index.post.ts
    [id].put.ts
    [id].delete.ts
    [id]/debt.get.ts
  stock-in/
    index.get.ts
    index.post.ts
    [id].get.ts
    [id].delete.ts
  stock-out/
    index.get.ts
    index.post.ts
    [id].get.ts
    [id].delete.ts
  supplier-payments/
    index.get.ts
    index.post.ts
    [id].delete.ts
  reports/
    inventory.get.ts
    supplier-debt.get.ts
```

### Frontend Pages (5 files mới)

```
pages/
  materials.vue
  suppliers.vue
  stock-in.vue
  stock-out.vue
  supplier-debt.vue
```

### Cập nhật files hiện có (≈6 files)

```
prisma/schema.prisma        — 7 model mới + relations + User role "Accounting"
prisma/seed.ts              — seed data mẫu + tài khoản Accounting
layouts/default.vue          — menu Kho vật tư (Admin + Accounting)
middleware/auth.global.ts    — route guards (kho chỉ Admin + Accounting)
pages/index.vue              — dashboard widgets
pages/projects.vue           — tab Vật tư xuất
pages/expenses.vue           — link phiếu xuất
docs/GUIDE_ACCOUNTING.md     — hướng dẫn sử dụng cho vai trò Kế toán
```

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