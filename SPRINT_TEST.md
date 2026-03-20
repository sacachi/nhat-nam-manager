# SPRINT TEST — Lộ trình kiểm thử

> Ngày tạo: 20/03/2026
> Dự án: Nhật Nam Manager
> Stack: Vitest + @vue/test-utils + happy-dom

---

## Tổng quan

| Phase | Nội dung | Test cases | Trạng thái |
|-------|----------|------------|------------|
| **Phase 1** | Unit Test — Server utilities | ~60 | ⬜ |
| **Phase 2** | Integration Test — API endpoints | ~80 | ⬜ |
| **Phase 3** | Workflow Test — Luồng nghiệp vụ | ~30 | ⬜ |
| **Phase 4** | Frontend — Route guard + Component | ~40 | ⬜ |
| | **Tổng** | **~210** | |

---

## Cấu trúc thư mục

```
tests/
├── setup.ts                          # Mock global (createError, h3)
├── unit/
│   ├── roles.test.ts                 # Phân quyền, maskPhone, canViewFullPhone
│   ├── validate.test.ts              # Validators (required, email, phone, enum, ...)
│   ├── performance.test.ts           # getGrade, calcTrend, getMonthsBetween
│   └── jwt.test.ts                   # signToken, verifyToken
├── integration/
│   ├── auth.test.ts                  # Login, me, logout
│   ├── users.test.ts                 # Users CRUD + role check
│   ├── projects.test.ts              # Projects CRUD + role check
│   ├── receipts.test.ts              # Receipts CRUD + role check
│   ├── expenses.test.ts              # Expenses CRUD + validation
│   ├── customer-leads.test.ts        # Leads + assign + convert
│   ├── tasks.test.ts                 # Tasks + source validation
│   ├── suppliers.test.ts             # Suppliers CRUD
│   ├── materials.test.ts             # Materials CRUD
│   ├── stock-in.test.ts              # Nhập kho + BQGQ
│   ├── stock-out.test.ts             # Xuất kho + tồn kho
│   └── supplier-payments.test.ts     # Thanh toán NCC
└── frontend/
    └── route-guard.test.ts           # Middleware auth.global.ts
```

---

## Phase 1 — Unit Test Server Utilities

### 1.1 roles.test.ts (~16 test cases)

| # | Test | Input | Expected |
|---|------|-------|----------|
| 1 | ADMIN_ROLES = ['Admin'] | — | ✅ |
| 2 | SALE_ROLES = ['Admin', 'Sale'] | — | ✅ |
| 3 | DESIGN_ROLES = ['Admin', 'Design'] | — | ✅ |
| 4 | THI_CONG_ROLES = ['Admin', 'Construction'] | — | ✅ |
| 5 | ALL_ROLES = 4 roles | — | ✅ |
| 6 | maskPhone Admin → hiển thị | '0901234567', 'Admin' | '0901234567' |
| 7 | maskPhone Sale → hiển thị | '0901234567', 'Sale' | '0901234567' |
| 8 | maskPhone Design → ẩn | '0901234567', 'Design' | '**********' |
| 9 | maskPhone Construction → ẩn | '0901234567', 'Construction' | '**********' |
| 10 | maskPhone null → null | null, 'Admin' | null |
| 11 | maskPhone undefined → null | undefined, 'Admin' | null |
| 12 | canViewFullPhone Admin → true | 'Admin' | true |
| 13 | canViewFullPhone Sale → true | 'Sale' | true |
| 14 | canViewFullPhone Design → false | 'Design' | false |
| 15 | canViewFullPhone Construction → false | 'Construction' | false |
| 16 | requireRole throw 403 khi sai role | user.role='Sale', allowed=['Admin'] | throw 403 |

### 1.2 validate.test.ts (~22 test cases)

| # | Function | Input | Expected |
|---|----------|-------|----------|
| 1 | validateRequired ✅ | 'hello' | pass |
| 2 | validateRequired ❌ null | null | throw 400 |
| 3 | validateRequired ❌ empty | '' | throw 400 |
| 4 | validateRequired ❌ spaces | '   ' | throw 400 |
| 5 | validateEmail ✅ | 'a@b.c' | pass |
| 6 | validateEmail ❌ | 'abc' | throw 400 |
| 7 | validateEmail skip | '' | pass (skip) |
| 8 | validatePhone ✅ 10 digits | '0901234567' | pass |
| 9 | validatePhone ✅ 9 digits | '090123456' | pass |
| 10 | validatePhone ❌ 8 digits | '09012345' | throw 400 |
| 11 | validatePhone ❌ letters | '090abc1234' | throw 400 |
| 12 | validatePositiveNumber ✅ | 100 | pass |
| 13 | validatePositiveNumber ✅ zero | 0 | pass |
| 14 | validatePositiveNumber ❌ negative | -1 | throw 400 |
| 15 | validateMinLength ✅ | 'hello', 3 | pass |
| 16 | validateMinLength ❌ | 'hi', 3 | throw 400 |
| 17 | validateMaxLength ✅ | 'hi', 10 | pass |
| 18 | validateMaxLength ❌ | 'hello world', 5 | throw 400 |
| 19 | validateEnum ✅ | 'material', ['material','labor'] | pass |
| 20 | validateEnum ❌ | 'invalid', ['material','labor'] | throw 400 |
| 21 | validateUUID ✅ | valid uuid | pass |
| 22 | validateUUID ❌ | 'not-a-uuid' | throw 400 |

### 1.3 performance.test.ts (~12 test cases)

| # | Function | Input | Expected |
|---|----------|-------|----------|
| 1 | getGrade A+ | 95 | { grade: 'A+', gradeColor: 'success' } |
| 2 | getGrade A | 87 | { grade: 'A', gradeColor: 'success' } |
| 3 | getGrade B+ | 78 | { grade: 'B+', gradeColor: 'info' } |
| 4 | getGrade B | 68 | { grade: 'B', gradeColor: 'info' } |
| 5 | getGrade C | 55 | { grade: 'C', gradeColor: 'warn' } |
| 6 | getGrade D | 30 | { grade: 'D', gradeColor: 'danger' } |
| 7 | getGrade boundary 90 | 90 | A+ |
| 8 | getGrade boundary 85 | 85 | A |
| 9 | calcTrend up | 80, 70 | 'up' |
| 10 | calcTrend down | 70, 80 | 'down' |
| 11 | calcTrend stable | 75, 73 | 'stable' |
| 12 | getMonthsBetween | Jan→Apr | 3 |

### 1.4 jwt.test.ts (~5 test cases)

| # | Function | Input | Expected |
|---|----------|-------|----------|
| 1 | signToken → string | payload | typeof string |
| 2 | verifyToken ✅ valid | signToken result | payload |
| 3 | verifyToken ❌ fake | 'fake.jwt.token' | null |
| 4 | verifyToken ❌ empty | '' | null |
| 5 | Token chứa đúng payload | { id, role } | id + role match |

---

## Phase 2 — Integration Test API

### 2.1 Auth

| # | Endpoint | Test | Expected |
|---|----------|------|----------|
| 1 | POST /api/auth/login | Đúng credentials | 200 + user |
| 2 | POST /api/auth/login | Sai password | 401 |
| 3 | POST /api/auth/login | User inactive | 401 |
| 4 | POST /api/auth/login | Thiếu fields | 400 |
| 5 | GET /api/auth/me | Có cookie hợp lệ | 200 + user info |
| 6 | GET /api/auth/me | Không cookie | 401 |

### 2.2 Users (Admin only)

| # | Endpoint | Test | Role | Expected |
|---|----------|------|------|----------|
| 1 | GET /api/users | Lấy list | Admin | 200 |
| 2 | GET /api/users | Non-admin | Sale | 403 |
| 3 | POST /api/users | Tạo mới | Admin | 201 |
| 4 | POST /api/users | Duplicate username | Admin | 400 |
| 5 | DELETE /api/users/:id | Xóa | Admin | 200 |
| 6 | DELETE /api/users/:id | Non-admin | Sale | 403 |

### 2.3 Projects

| # | Endpoint | Test | Role | Expected |
|---|----------|------|------|----------|
| 1 | POST /api/projects | Tạo mới | Admin | 200 |
| 2 | POST /api/projects | Design tạo | Design | 403 |
| 3 | POST /api/projects | Construction tạo | Construction | 403 |
| 4 | DELETE /api/projects/:id | Xóa | Admin | 200 |
| 5 | DELETE /api/projects/:id | Sale xóa | Sale | 403 |

### 2.4 Receipts (Admin + Sale)

| # | Endpoint | Test | Role | Expected |
|---|----------|------|------|----------|
| 1 | POST /api/receipts | Tạo phiếu thu | Admin | 200 |
| 2 | POST /api/receipts | Tạo phiếu thu | Sale | 200 |
| 3 | POST /api/receipts | Construction tạo | Construction | 403 |
| 4 | POST /api/receipts | Thiếu amount | Admin | 400 |

### 2.5 Expenses (Admin + Construction + Sale)

| # | Endpoint | Test | Role | Expected |
|---|----------|------|------|----------|
| 1 | POST /api/expenses | Tạo chi phí | Admin | 200 |
| 2 | POST /api/expenses | Construction tạo | Construction | 200 |
| 3 | POST /api/expenses | Design tạo | Design | 403 |
| 4 | POST /api/expenses | Type không hợp lệ | Admin | 400 |

### 2.6 Customer Leads

| # | Endpoint | Test | Role | Expected |
|---|----------|------|------|----------|
| 1 | POST /api/customer-leads/:id/assign | Gán designer | Admin | 200 |
| 2 | POST /api/customer-leads/:id/assign | Lead converted | Admin | 400 |
| 3 | POST /api/customer-leads/:id/convert | Convert thành công | Admin | 200 |
| 4 | POST /api/customer-leads/:id/convert | Lead thiếu designer | Admin | 400 |
| 5 | POST /api/customer-leads/:id/convert | Lead đã converted | Admin | 400 |

### 2.7 Tasks

| # | Endpoint | Test | Role | Expected |
|---|----------|------|------|----------|
| 1 | POST /api/tasks | Tạo gắn project | Admin | 200 |
| 2 | POST /api/tasks | Thiếu project + lead | Admin | 400 |
| 3 | POST /api/tasks | Có cả project + lead | Admin | 400 |
| 4 | DELETE /api/tasks/:id | Admin xóa | Admin | 200 |
| 5 | DELETE /api/tasks/:id | Sale xóa | Sale | 403 |

### 2.8 Suppliers (Admin + Accounting)

| # | Endpoint | Test | Role | Expected |
|---|----------|------|------|----------|
| 1 | POST /api/suppliers | Tạo NCC | Admin | 200 |
| 2 | POST /api/suppliers | Duplicate code | Admin | 400 |
| 3 | POST /api/suppliers | Sale tạo | Sale | 403 |

### 2.9 Materials (Admin + Accounting)

| # | Endpoint | Test | Role | Expected |
|---|----------|------|------|----------|
| 1 | POST /api/materials | Tạo vật tư | Admin | 200 |
| 2 | POST /api/materials | Duplicate code | Admin | 400 |
| 3 | POST /api/materials | Sale tạo | Sale | 403 |

### 2.10 Stock In — Nhập kho + BQGQ

| # | Endpoint | Test | Role | Expected |
|---|----------|------|------|----------|
| 1 | POST /api/stock-in | Nhập kho thành công | Admin | 200 |
| 2 | POST /api/stock-in | Items rỗng | Admin | 400 |
| 3 | POST /api/stock-in | Sale tạo | Sale | 403 |
| 4 | POST /api/stock-in | BQGQ tính đúng | Admin | avg_cost đúng |
| 5 | POST /api/stock-in | StockLog tạo đúng | Admin | stock_before, stock_after |

### 2.11 Stock Out — Xuất kho

| # | Endpoint | Test | Role | Expected |
|---|----------|------|------|----------|
| 1 | POST /api/stock-out | Xuất kho thành công | Admin | 200 |
| 2 | POST /api/stock-out | Xuất quá tồn | Admin | 400 |
| 3 | POST /api/stock-out | Tự tạo Expense | Admin | expense_id exists |

### 2.12 Supplier Payments

| # | Endpoint | Test | Role | Expected |
|---|----------|------|------|----------|
| 1 | POST /api/supplier-payments | Thanh toán NCC | Admin | 200 |
| 2 | POST /api/supplier-payments | Sale thanh toán | Sale | 403 |

---

## Phase 3 — Workflow Integration Test

### 3.1 Lead → Project (~10 steps)

```
Sale tạo lead → Admin duyệt → Gán designer → Designer update status
→ Upload thiết kế → Admin duyệt TK → Convert → Customer + Project tạo
```

| # | Step | Verify |
|---|------|--------|
| 1 | POST lead | status = 'pending' |
| 2 | PUT lead status=reviewed | status = 'reviewed' |
| 3 | POST assign designer | design_status = 'assigned' |
| 4 | PUT design_status = in_progress | ✅ |
| 5 | PUT design_status = review_requested | ✅ |
| 6 | PUT design_status = approved | ✅ |
| 7 | POST convert | lead.status = 'converted' |
| 8 | Verify Customer tạo | name + phone match |
| 9 | Verify Project tạo | name + contract_value match |
| 10 | Convert lần 2 → fail | 400 'đã chuyển đổi' |

### 3.2 Stock Flow — BQGQ (~8 steps)

```
Tạo NCC → Tạo vật tư → Nhập kho lần 1 → Nhập kho lần 2
→ Kiểm BQGQ → Xuất kho → Kiểm tồn → Thanh toán NCC → Kiểm công nợ
```

| # | Step | Verify |
|---|------|--------|
| 1 | POST supplier | ✅ |
| 2 | POST material (stock=0) | current_stock=0 |
| 3 | POST stock-in 100×50,000 | stock=100, avg=50,000, value=5,000,000 |
| 4 | POST stock-in 50×60,000 | stock=150, avg=53,333, value=8,000,000 |
| 5 | POST stock-out 30 cái | stock=120, expense tự tạo |
| 6 | POST stock-out 200 cái (quá tồn) | 400 error |
| 7 | POST supplier-payment | công nợ giảm |
| 8 | GET supplier debt | = Σ nhập − Σ thanh toán |

### 3.3 Expense ↔ Task (~5 steps)

| # | Step | Verify |
|---|------|--------|
| 1 | POST project | ✅ |
| 2 | POST task gắn project | ✅ |
| 3 | POST expense gắn task + project | expense.task_id = task.id |
| 4 | POST expense task thuộc project khác | 400 |
| 5 | GET project detail | total_expense bao gồm expense |

---

## Phase 4 — Frontend Test

### 4.1 Route Guard — auth.global.ts (~19 cases)

| # | Role | Route | Expected |
|---|------|-------|----------|
| 1 | — (chưa login) | /projects | → /login |
| 2 | Any (đã login) | /login | → / |
| 3 | Admin | /task-management | ✅ |
| 4 | Sale | /task-management | → / |
| 5 | Admin | /receipts | ✅ |
| 6 | Construction | /receipts | → / |
| 7 | Admin | /expenses | ✅ |
| 8 | Sale | /expenses | → / |
| 9 | Admin | /reports | ✅ |
| 10 | Sale | /reports | → / |
| 11 | Admin | /performance | ✅ |
| 12 | Design | /performance | → / |
| 13 | Admin | /users | ✅ |
| 14 | Design | /users | → / |
| 15 | Admin | /logs | ✅ |
| 16 | Sale | /logs | → / |
| 17 | Admin | /customer-leads | ✅ |
| 18 | Construction | /customer-leads | → / |
| 19 | Any | /design-workspace | → /my-tasks |

---

## Script chạy test

```bash
# Chạy tất cả
npm test

# Chạy theo phase
npm run test:unit
npm run test:integration
npm run test:frontend

# Xem coverage
npm run test:coverage
```

---

## Quy ước

- Mỗi file test tương ứng 1 module
- `describe()` theo endpoint hoặc function
- `it('should ...')` mô tả rõ ràng
- DB test riêng: `.env.test` → `test.db`
- Mỗi suite: `beforeAll()` seed, `afterAll()` cleanup
