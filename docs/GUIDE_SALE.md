# Hướng Dẫn Sử Dụng — Sale

> Phần mềm: Nhat Nam Manager  
> Vai trò: **Sale** — Thu thập khách hàng, quản lý lead, thu tiền, theo dõi công trình

---

## 1. Đăng nhập

1. Truy cập địa chỉ hệ thống
2. Nhập **Username** và **Mật khẩu**
3. Nhấn **Đăng nhập**

> Tài khoản mẫu: `sale_1` / `123456@Abc`

---

## 2. Tổng quan Dashboard

Sau khi đăng nhập, Dashboard hiển thị:

- **Leads của bạn** — số lead đã tạo
- **Đang chờ duyệt** — lead chưa được Admin xử lý
- **Đã chuyển đổi** — lead đã thành khách hàng + công trình
- **Tỷ lệ chuyển đổi** — % lead thành công
- **Hiệu suất cá nhân** — điểm và xếp hạng hiện tại

---

## 3. Menu chức năng

| Menu | Chức năng |
|------|-----------|
| **Tổng quan** | Dashboard cá nhân |
| **Công trình** | Xem/thêm/sửa công trình + tài chính |
| **Khách hàng** | Quản lý khách hàng (xem đầy đủ SĐT) |
| **Thu thập KH** | ⭐ Tạo và quản lý lead |
| **Thu tiền** | Tạo và quản lý phiếu thu |

---

## 4. Thu thập Khách hàng (Leads) ⭐

Đây là chức năng chính của Sale. Vào **Thu thập KH** trên menu.

### 4.1. Tạo lead mới

1. Nhấn **Thêm Lead**
2. Nhập thông tin:
   - **Tên khách hàng** (bắt buộc)
   - **SĐT** (bắt buộc)
   - **Địa chỉ** (bắt buộc)
   - **Hạng mục thi công**: chọn 1 hoặc nhiều (Kitchen, Wardrobe, TV Cabinet, Wall Panels, Ceiling, Staircase, Other)
   - **Mô tả yêu cầu**: ghi chi tiết mong muốn của khách
   - **Giá trị dự kiến**: giá trị công trình ước tính
   - **Ngày gửi thiết kế sơ bộ** (nếu có)
3. **Upload ảnh hiện trường**: chọn ảnh thực tế tại nhà khách hàng
4. Nhấn **Lưu**

Lead sẽ có trạng thái **Chờ duyệt** và chờ Admin xử lý.

### 4.2. Xem danh sách lead

- Bảng hiển thị: Khách hàng, SĐT, Địa chỉ, Hạng mục, Giá trị, Trạng thái, Design Status
- Bạn chỉ thấy **lead do mình tạo**
- Lọc: theo trạng thái, tìm kiếm theo tên

### 4.3. Sửa lead

- Nhấn nút ✏️ trên lead do bạn tạo
- Cập nhật thông tin → **Lưu**

> ⚠️ Bạn chỉ sửa được lead của mình, không sửa được lead của Sale khác.

### 4.4. Theo dõi trạng thái lead

| Trạng thái | Ý nghĩa |
|------------|---------|
| **Chờ duyệt** | Vừa tạo, đang chờ Admin |
| **Đã duyệt** | Admin đã duyệt |
| **Đã chuyển đổi** | Đã thành Khách hàng + Công trình 🎉 |
| **Từ chối** | Admin từ chối |

### 4.5. Theo dõi Design Status

Khi Admin gán Designer cho lead, bạn sẽ thấy thêm cột Design Status:

| Design Status | Ý nghĩa |
|---------------|---------|
| Chưa giao | Chưa gán designer |
| Đã giao | Designer đã được gán |
| Đang thiết kế | Designer đang làm |
| Chờ duyệt TK | Designer đã gửi duyệt |
| Đã duyệt TK | Admin duyệt xong → sẵn sàng convert |
| Từ chối TK | Admin yêu cầu sửa lại |

### 4.6. Chuyển đổi Lead

Khi lead đã duyệt thiết kế (Design Status = Đã duyệt TK):
1. Nhấn nút **Chuyển đổi** trên lead
2. Hệ thống tự động tạo:
   - Khách hàng mới
   - Công trình mới
3. Lead chuyển sang trạng thái **Đã chuyển đổi**

---

## 5. Quản lý Công trình

Vào **Công trình** trên menu.

### 5.1. Xem danh sách

Bảng hiển thị:
- Tên công trình
- Khách hàng
- **Giá trị hợp đồng** (VNĐ)
- **Đã thu** / **Đã chi** / **Lợi nhuận**
- Trạng thái
- Các nút thao tác

### 5.2. Thêm công trình

1. Nhấn **Thêm Công Trình**
2. Nhập: Tên, Khách hàng, Giá trị HĐ, Ngày bắt đầu, Ghi chú
3. Nhấn **Lưu**

### 5.3. Sửa công trình

- Nhấn nút ✏️ → sửa thông tin → **Lưu**

### 5.4. Xem chi tiết

- Nhấn nút **mắt** (👁) để mở dialog chi tiết
- Bao gồm: thông tin chung, hợp đồng, thu tiền, chi phí, task

### 5.5. Upload hợp đồng

1. Trong chi tiết project → phần **Hợp đồng**
2. Nhấn **Upload hợp đồng**
3. Chọn file PDF/DOC → file được lưu lên Google Drive

> ⚠️ Bạn không có quyền **xóa** công trình (chỉ Admin).

---

## 6. Quản lý Khách hàng

Vào **Khách hàng** trên menu.

### Thêm khách hàng
1. Nhấn **Thêm Khách Hàng**
2. Nhập: Tên, SĐT, Email, Địa chỉ, Ghi chú
3. Nhấn **Lưu**

### Xem / Sửa
- Bạn thấy **đầy đủ SĐT** khách hàng (không bị ẩn)
- Nhấn ✏️ để sửa thông tin

> ⚠️ Không có quyền xóa khách hàng (chỉ Admin).

---

## 7. Thu tiền

Vào **Thu tiền** trên menu.

### Thêm phiếu thu
1. Nhấn **Thêm thu tiền**
2. Chọn **Công trình**
3. Nhập **Số tiền**, **Ngày thu**, **Ghi chú**
4. Upload **ảnh chứng từ** (nếu có)
5. Nhấn **Lưu**

### Sửa phiếu thu
- Nhấn nút ✏️ trên phiếu thu **do bạn tạo**
- Cập nhật → **Lưu**

> ⚠️ Bạn chỉ sửa được phiếu thu do mình tạo. Xóa phiếu thu chỉ Admin thực hiện được.

---

## 8. Xem Tài chính Công trình

Trong trang **Công trình**, bạn có thể xem:
- **Giá trị hợp đồng** của mỗi project
- **Tổng đã thu** — tổng các phiếu thu
- **Tổng đã chi** — tổng chi phí
- **Lợi nhuận** — đã thu − đã chi

Trong chi tiết project, bạn thấy:
- Danh sách từng phiếu thu
- Danh sách từng khoản chi
- Tổng hợp tài chính

---

## 9. Thông báo

- Biểu tượng **chuông** 🔔 ở góc phải header
- Nhấn để xem thông báo:
  - Lead được duyệt / từ chối
  - Lead được gán designer
  - Thiết kế đã duyệt (sẵn sàng convert)
- Badge đỏ = số thông báo chưa đọc

---

## 10. Đăng xuất

- Nhấn **Đăng xuất** ở cuối menu bên trái

---

## Tóm tắt quyền của Sale

| Chức năng | Quyền |
|-----------|-------|
| Tạo lead | ✅ |
| Xem lead của mình | ✅ |
| Sửa lead của mình | ✅ |
| Xóa lead | ❌ (chỉ Admin) |
| Gán designer | ❌ (chỉ Admin) |
| Chuyển đổi lead | ✅ (lead của mình) |
| Xem công trình + tài chính | ✅ |
| Thêm/sửa công trình | ✅ |
| Xóa công trình | ❌ (chỉ Admin) |
| Upload hợp đồng | ✅ |
| Xem khách hàng (đầy đủ SĐT) | ✅ |
| Thêm/sửa khách hàng | ✅ |
| Thu tiền | ✅ |
| Sửa phiếu thu | ✅ (chỉ do mình tạo) |
| Chi phí | ❌ |
| Báo cáo tài chính | ❌ (chỉ Admin) |
| Hiệu suất cá nhân | ✅ (trên Dashboard) |
