# Hệ thống quản lý dự án thi công

## 1. Tổng quan

Hệ thống là một web application quản lý tài chính và tiến độ các công trình thi công, được xây dựng nhằm thay thế phương thức quản lý thủ công bằng Google Sheet, giúp kiểm soát dòng tiền, chi phí và lợi nhuận của từng công trình một cách rõ ràng và chính xác.

Ứng dụng cho phép theo dõi:
- Danh sách các công trình thi công
- Giá trị hợp đồng của từng công trình
- Các lần thu tiền từ khách hàng
- Các khoản chi phí thi công
- Các khoản khoán thợ
- Lợi nhuận tạm tính của từng công trình

Mỗi công trình có thể phát sinh nhiều lần thu tiền và nhiều lần chi tiền, hệ thống sẽ tự động tổng hợp và hiển thị báo cáo tài chính theo thời gian thực.

Ngoài ra, hệ thống hỗ trợ:
- Quản lý nhân viên
- Phân quyền truy cập
- Ghi lại lịch sử thay đổi dữ liệu (logs)

Nhằm đảm bảo minh bạch, kiểm soát và truy vết các thao tác trong hệ thống.

## 2. Công nghệ sử dụng

Hệ thống được xây dựng với stack nhẹ, dễ triển khai và bảo trì.

- **Framework:** Nuxt 3 (Framework fullstack dựa trên Vue 3)
  - Tích hợp server API
  - Hỗ trợ SSR và SPA
  - Phù hợp xây dựng hệ thống quản trị nội bộ
- **Database:** SQLite
  - Cơ sở dữ liệu nhẹ, không cần cài đặt server database riêng
  - Phù hợp cho hệ thống nội bộ quy mô nhỏ và trung bình
- **ORM:** Prisma ORM
  - Quản lý schema database, Migration database
  - Type-safe query, tích hợp tốt với Nuxt server API
- **UI Framework:** PrimeVue 4
  - Sử dụng PrimeVue để xây dựng giao diện quản trị nhanh và chuyên nghiệp
  - Các component: DataTable, Dialog, Form Inputs, Toast Notifications, Calendar, Dropdown, Toolbar, Confirm Dialog
  - Giúp hệ thống có giao diện dễ sử dụng, rõ ràng và nhất quán.

## 3. Xác thực người dùng (Authentication)

Hệ thống yêu cầu người dùng phải đăng nhập để sử dụng các chức năng.
- Chức năng đăng nhập bằng username hoặc email.
- Mật khẩu được mã hóa (hash) trước khi lưu vào database.
- Quản lý session hoặc token đăng nhập.

Sau khi đăng nhập thành công, người dùng mới có thể xem danh sách công trình, thêm hoặc chỉnh sửa dữ liệu, thực hiện các thao tác quản lý.

## 4. Quản lý nhân viên

Hệ thống cho phép quản lý danh sách nhân viên sử dụng hệ thống.

**Thông tin nhân viên:**
- Họ tên, Username, Email, Mật khẩu
- Vai trò, Trạng thái hoạt động, Ngày tạo tài khoản

**Các chức năng:**
- Tạo tài khoản nhân viên
- Chỉnh sửa thông tin
- Khóa hoặc mở khóa tài khoản
- Phân quyền truy cập

## 5. Phân quyền người dùng

Hệ thống áp dụng Role-based Access Control (RBAC). Các vai trò mặc định:

### Admin
Có toàn quyền trong hệ thống:
- Quản lý nhân viên
- Quản lý công trình
- Xem và chỉnh sửa toàn bộ dữ liệu
- Xem logs hệ thống

### Manager
**Có quyền:**
- Tạo và chỉnh sửa công trình
- Thêm thu tiền và chi phí
- Xem báo cáo tài chính

**Không có quyền:**
- Quản lý nhân viên
- Chỉnh sửa phân quyền

### Staff
**Có quyền:**
- Xem danh sách công trình
- Thêm khoản thu
- Thêm khoản chi

**Không có quyền:**
- Xóa dữ liệu
- Quản lý nhân viên
- Xem logs hệ thống

## 6. Quản lý công trình

Hệ thống cho phép tạo và quản lý danh sách công trình thi công.

**Thông tin công trình:**
- Tên công trình
- Giá trị hợp đồng
- Trạng thái công trình (Đang thi công, Tạm dừng, Đã hoàn thành)
- Ngày bắt đầu
- Ghi chú

## 7. Quản lý thu tiền

Một công trình có thể thu tiền nhiều đợt.

**Thông tin mỗi lần thu:**
- Ngày thu, Số tiền, Ghi chú, Người thực hiện

Hệ thống tự động tính toán tổng tiền đã thu và số tiền còn phải thu.

## 8. Quản lý chi phí

Chi phí được chia thành hai nhóm chính:
- **Chi công trình:** Bao gồm vật tư, thiết bị, chi phí thi công.
- **Chi khoán thợ:** Bao gồm tiền công, khoán đội thi công.

**Thông tin mỗi khoản chi:**
- Ngày chi, Loại chi, Số tiền, Ghi chú, Người nhập dữ liệu.

## 9. Báo cáo tài chính công trình

Hệ thống tự động tổng hợp các chỉ số tài chính của từng công trình bao gồm:
- Giá trị hợp đồng
- Tổng tiền đã thu
- Tổng chi công trình
- Tổng chi khoán thợ
- Tổng chi
- Lợi nhuận tạm tính

> **Công thức tính:** Lợi nhuận = Tổng đã thu − Tổng chi

## 10. Dashboard tổng quan

Trang dashboard hiển thị tổng quan toàn hệ thống:
- Tổng giá trị hợp đồng
- Tổng tiền đã thu
- Tổng chi phí
- Lợi nhuận tạm tính

Giúp quản lý nhanh chóng nắm được tình hình tài chính tổng thể của doanh nghiệp.

## 11. Hệ thống logs thay đổi dữ liệu

Mỗi khi dữ liệu trong hệ thống được tạo, chỉnh sửa hoặc xóa, hệ thống sẽ tự động ghi lại log hoạt động.

**Thông tin log bao gồm:**
- Thời gian thực hiện, Người thực hiện
- Hành động (Create / Update / Delete)
- Loại dữ liệu thay đổi
- Dữ liệu trước và sau khi thay đổi

Logs giúp kiểm tra lịch sử chỉnh sửa, truy vết lỗi dữ liệu và đảm bảo minh bạch trong hệ thống.

## 12. Kiến trúc hệ thống

Hệ thống được xây dựng theo kiến trúc đơn giản:

```text
Nuxt3 Application
│
├── Frontend (PrimeVue UI)
│
├── Server API (Nuxt server routes)
│
├── Prisma ORM
│
└── SQLite Database
```

**Luồng dữ liệu:**
`User Interface` ➝ `Server API` ➝ `Prisma ORM` ➝ `SQLite Database`

## 13. Cấu trúc database

### users
Lưu thông tin nhân viên.
- `id`, `name`, `username`, `email`, `password`, `role`, `status`, `created_at`

### projects
- `id`, `name`, `contract_value`, `status`, `created_at`

### receipts
- `id`, `project_id`, `amount`, `date`, `note`, `created_by`, `created_at`

### expenses
- `id`, `project_id`, `type`, `amount`, `date`, `note`, `created_by`, `created_at`
- *type*: `material`, `labor`

### activity_logs
- `id`, `user_id`, `action`, `entity`, `entity_id`, `old_data`, `new_data`, `created_at`

## 14. Mục tiêu triển khai

Hệ thống hướng tới triển khai nhanh, dễ sử dụng, chi phí vận hành thấp và dễ mở rộng trong tương lai. Có thể triển khai trên:
- VPS
- Docker
- Server nội bộ doanh nghiệp