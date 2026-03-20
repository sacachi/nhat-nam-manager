# Hướng Dẫn Sử Dụng — Admin

> Phần mềm: Nhat Nam Manager  
> Vai trò: **Admin** — Toàn quyền quản trị hệ thống

---

## 1. Đăng nhập

1. Truy cập địa chỉ hệ thống (VD: `http://your-domain.com`)
2. Nhập **Username** (hoặc Email) và **Mật khẩu**
3. Nhấn **Đăng nhập**

> Tài khoản mặc định: `admin` / `123456@Abc`

---

## 2. Tổng quan Dashboard

Sau khi đăng nhập, bạn sẽ thấy Dashboard với các thông tin:

- **Tổng công trình** — số lượng project trong hệ thống
- **Tổng đã thu** — tổng tiền thu từ khách hàng
- **Tổng đã chi** — tổng chi phí thi công
- **Lợi nhuận tạm tính** — Tổng thu − Tổng chi
- **Task quá hạn** — công việc chưa hoàn thành đã qua deadline
- **Hoạt động gần đây** — log thao tác gần nhất trên toàn hệ thống

---

## 3. Menu chức năng

| Menu | Chức năng |
|------|-----------|
| **Tổng quan** | Dashboard tổng hợp |
| **Công trình** | Quản lý project, hợp đồng, thu chi, task |
| **Khách hàng** | Danh sách khách hàng |
| **Thu thập KH** | Quản lý lead (phiếu thu thập khách hàng) |
| **Công việc** → Công việc của tôi | Task được gán cho bạn |
| **Công việc** → Kanban | Board theo trạng thái, kéo thả task |
| **Công việc** → QL Công việc | Quản lý toàn bộ task, bulk actions |
| **Thu tiền** | Quản lý phiếu thu tiền từ khách |
| **Chi phí** | Quản lý chi phí thi công |
| **BC Tài chính** | Báo cáo thu chi theo tháng và project |
| **BC Hiệu suất** | Xếp hạng hiệu suất nhân viên |
| **Nhân viên** | Tạo/sửa/khóa tài khoản nhân viên |
| **Lịch sử** | Log thay đổi dữ liệu toàn hệ thống |

---

## 4. Quản lý Nhân viên

Vào **Nhân viên** trên menu bên trái.

### Tạo nhân viên mới
1. Nhấn **Thêm nhân viên**
2. Nhập: Họ tên, Username, Email, Mật khẩu
3. Chọn **Vai trò**: Admin / Sale / Design / Construction
4. Nhấn **Lưu**

### Sửa thông tin
- Nhấn nút **bút chì** (✏️) trên dòng nhân viên cần sửa
- Cập nhật thông tin → **Lưu**

### Khóa/mở tài khoản
- Nhấn nút **bút chì** → đổi Trạng thái sang `Inactive` để khóa
- Nhân viên bị khóa sẽ không đăng nhập được

---

## 5. Quản lý Công trình

Vào **Công trình** trên menu.

### Thêm công trình
1. Nhấn **Thêm Công Trình**
2. Nhập: Tên công trình, Khách hàng, Giá trị hợp đồng, Ngày bắt đầu, Trạng thái
3. Nhấn **Lưu**

### Xem chi tiết công trình
- Nhấn nút **mắt** (👁) trên dòng công trình
- Trong dialog chi tiết bạn sẽ thấy:
  - **Thông tin chung**: tên, khách hàng, giá trị HĐ, trạng thái
  - **Hợp đồng**: upload / xem file hợp đồng (PDF, DOC)
  - **Thu tiền**: danh sách các lần thu + thêm mới
  - **Chi phí**: danh sách chi phí + thêm mới
  - **Task**: danh sách công việc + thêm/sửa task

### Sửa / Xóa
- **Sửa**: nhấn nút ✏️ → cập nhật → Lưu
- **Xóa**: nhấn nút 🗑️ → xác nhận xóa (chỉ Admin)

### Upload hợp đồng
1. Trong chi tiết project → tab **Hợp đồng**
2. Nhấn **Upload hợp đồng**
3. Chọn file (PDF, DOC, DOCX)
4. File sẽ được lưu lên Google Drive

---

## 6. Quản lý Thu thập Khách hàng (Leads)

Vào **Thu thập KH** trên menu.

### Quy trình xử lý lead

```
Sale tạo → Admin duyệt → Admin gán Designer → Designer thiết kế → Admin duyệt TK → Convert
```

### Duyệt lead
1. Xem danh sách lead
2. Nhấn vào lead cần duyệt
3. Cập nhật trạng thái: **Đã duyệt** hoặc **Từ chối**

### Gán Designer
1. Mở chi tiết lead (trạng thái Chờ duyệt hoặc Đã duyệt)
2. Trong phần **Giao Designer**:
   - Chọn Designer từ dropdown
   - Chọn **Hạn thiết kế**
3. Nhấn **Giao việc**
4. Designer sẽ nhận thông báo và thấy lead trong mục Công việc

### Duyệt thiết kế
- Khi Designer gửi duyệt → Design Status = **Chờ duyệt TK**
- Mở lead → xem bản thiết kế đã upload
- Cập nhật: **Đã duyệt TK** hoặc **Từ chối TK**

### Chuyển đổi Lead → Khách hàng + Công trình
1. Lead đã duyệt thiết kế → nhấn nút **Chuyển đổi**
2. Hệ thống tự động tạo:
   - Khách hàng mới (từ thông tin lead)
   - Công trình mới (từ giá trị dự kiến)
3. Trạng thái lead = **Đã chuyển đổi**

---

## 7. Quản lý Công việc (Tasks)

### Công việc của tôi
- Vào **Công việc** → **Công việc của tôi**
- Xem task được gán cho bạn
- Cập nhật trạng thái: Bắt đầu / Hoàn thành / Hủy
- **Double-click** vào task → mở chi tiết:
  - Xem thông tin task
  - Tab **Đính kèm**: xem / upload file thiết kế, ảnh
  - Tab **Lịch sử thay đổi**: theo dõi ai đã sửa gì, khi nào

### QL Công việc (Admin only)
- Vào **Công việc** → **QL Công việc**
- Xem toàn bộ task trong hệ thống
- **Lọc** theo: nhân viên, project, lead, trạng thái, ưu tiên, loại
- **Nhóm** theo nguồn việc hoặc theo nhân viên
- **Thêm task**: nhấn nút + ở đầu trang hoặc trong từng nhóm
- **Sửa nhanh**: click vào task → sửa trực tiếp
- **Bulk actions**: chọn nhiều task → đổi status / priority / assignee / deadline / xóa hàng loạt
- Task quá hạn được highlight đỏ

### Kanban Board (Admin only)
- Vào **Công việc** → **Kanban**
- 4 cột: Đang chờ → Đang làm → Hoàn thành → Đã hủy
- **Kéo thả** task giữa các cột để đổi trạng thái
- Timeline view với zoom 1 tuần / 2 tuần / 1 tháng

---

## 8. Thu tiền

Vào **Thu tiền** trên menu.

### Thêm phiếu thu
1. Nhấn **Thêm thu tiền**
2. Chọn **Công trình**, nhập **Số tiền**, **Ngày thu**, **Ghi chú**
3. Upload ảnh chứng từ (nếu có)
4. Nhấn **Lưu**

### Sửa phiếu thu
- Nhấn nút ✏️ → sửa thông tin → Lưu

### Xóa phiếu thu
- Nhấn nút 🗑️ → xác nhận (chỉ Admin)

---

## 9. Chi phí

Vào **Chi phí** trên menu.

### Thêm chi phí
1. Nhấn **Thêm chi phí**
2. Chọn **Công trình**, **Loại chi** (Vật tư / Khoán thợ)
3. Nhập **Số tiền**, **Ngày chi**, **Ghi chú**
4. Gắn vào **Task** (tùy chọn) — để theo dõi chi phí theo hạng mục
5. Upload ảnh chứng từ (nếu có)
6. Nhấn **Lưu**

---

## 10. Báo cáo Tài chính

Vào **BC Tài chính** trên menu.

- Biểu đồ thu chi theo **tháng**
- Bảng chi tiết theo **từng project**: giá trị HĐ, đã thu, đã chi, lợi nhuận
- Lọc theo khoảng thời gian

---

## 11. Báo cáo Hiệu suất

Vào **BC Hiệu suất** trên menu.

- Xem điểm hiệu suất của từng nhân viên (thang 0–100)
- Xếp hạng: A+ / A / B+ / B / C / D
- Lọc theo role, khoảng thời gian
- Nhấn vào nhân viên → xem chi tiết KPI:
  - **Sale**: leads tạo, tỷ lệ convert, giá trị HĐ
  - **Design**: tasks hoàn thành, tỷ lệ đúng hạn, số lần sửa
  - **Construction**: tasks hoàn thành, tỷ lệ đúng hạn

---

## 12. Lịch sử hệ thống

Vào **Lịch sử** trên menu.

- Xem log toàn bộ thao tác: tạo, sửa, xóa
- Thông tin: ai, khi nào, entity nào, dữ liệu cũ vs mới
- Dùng để truy vết lỗi dữ liệu hoặc kiểm tra thao tác nhân viên

---

## 13. Thông báo

- Biểu tượng **chuông** 🔔 ở góc phải header
- Nhấn để xem thông báo:
  - Task mới được giao
  - Task quá hạn
  - Task hoàn thành
  - Lead có cập nhật
- Badge đỏ hiển thị số thông báo chưa đọc
- Nhấn **Đánh dấu đã đọc** để clear tất cả

---

## 14. Đăng xuất

- Nhấn nút **Đăng xuất** ở cuối menu bên trái
- Hệ thống sẽ xóa phiên đăng nhập và chuyển về trang Login
