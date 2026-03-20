# Hướng Dẫn Sử Dụng — Design

> Phần mềm: Nhat Nam Manager  
> Vai trò: **Design** — Nhận việc thiết kế, upload bản thiết kế, theo dõi tiến độ

---

## 1. Đăng nhập

1. Truy cập địa chỉ hệ thống
2. Nhập **Username** và **Mật khẩu**
3. Nhấn **Đăng nhập**

> Tài khoản mẫu: `design_1` / `123456@Abc`

---

## 2. Tổng quan Dashboard

Sau khi đăng nhập, Dashboard hiển thị các thông tin liên quan đến bạn:

- **Công việc được giao** — số task đang có
- **Đang xử lý** — task đang trong trạng thái "Đang làm"
- **Quá hạn** — task chưa hoàn thành đã qua deadline
- **Hoàn thành** — task đã xong

> ⚠️ Bạn **không** thấy thông tin tài chính (giá trị hợp đồng, thu tiền, chi phí, lợi nhuận).

---

## 3. Menu chức năng

| Menu | Chức năng |
|------|-----------|
| **Tổng quan** | Dashboard cá nhân |
| **Công trình** | Xem danh sách công trình (chỉ xem, không sửa/xóa) |
| **Khách hàng** | Xem danh sách khách hàng (SĐT bị ẩn) |
| **Công việc** → Công việc của tôi | **Trang chính** — xem và xử lý task |

---

## 4. Công việc của tôi ⭐

Đây là trang làm việc chính của bạn. Vào **Công việc** → **Công việc của tôi**.

### 4.1. Danh sách task

Bạn sẽ thấy tất cả task được gán cho mình, gồm:
- **Tiêu đề** công việc
- **Loại**: Thiết kế / Thi công / Kiểm tra / Khác
- **Ưu tiên**: Thấp / TB / Cao / Gấp
- **Nguồn**: thuộc Project hay Lead
- **Trạng thái**: Đang chờ / Đang làm / Hoàn thành / Đã hủy
- **Hạn chót** (nếu có)
- **Số file đính kèm** (icon 📎)

### 4.2. Lọc task

Sử dụng các bộ lọc ở đầu trang:
- **Lọc trạng thái**: Tất cả / Đang chờ / Đang làm / Hoàn thành / Đã hủy
- **Lọc ưu tiên**: Thấp / TB / Cao / Gấp
- **Lọc loại**: Thiết kế / Thi công / Kiểm tra / Khác

Nút lọc nhanh:
- 🔴 **Quá hạn** — hiện task đã trễ deadline
- 🟡 **Sắp đến hạn (3 ngày)** — task sắp hết hạn
- 🟢 **Đã hoàn thành** — task đã xong

### 4.3. Cập nhật trạng thái

Trên mỗi task card, bạn sẽ thấy nút hành động:

| Trạng thái hiện tại | Nút hiện ra | Kết quả |
|---------------------|-------------|---------|
| Đang chờ | **Bắt đầu** | → Đang làm |
| Đang làm | **Hoàn thành** | → Hoàn thành |
| Đang làm | **Hủy** | → Đã hủy |

### 4.4. Xem chi tiết task (Double-click)

**Double-click** vào task để mở dialog chi tiết:

**Thông tin hiển thị:**
- Tiêu đề, mô tả, loại, ưu tiên
- Nguồn (Project hoặc Lead)
- Hạn chót
- Người thực hiện
- Trạng thái hiện tại

**Cập nhật trạng thái:** Nhấn nút Bắt đầu / Hoàn thành / Hủy ngay trong dialog.

### 4.5. Upload file thiết kế

Trong dialog chi tiết task → tab **Đính kèm / Thiết kế**:

1. Nhấn **Upload file**
2. Chọn file (JPG, PNG, WebP, PDF — tối đa 20 file, 20MB/file)
3. Nhấn **Upload**
4. File sẽ được lưu lên Google Drive và hiển thị dạng thumbnail

Bạn có thể nhấn vào thumbnail để xem ảnh gốc hoặc mở file PDF.

### 4.6. Xem lịch sử thay đổi

Trong dialog chi tiết task → tab **Lịch sử thay đổi**:

- Xem ai đã thay đổi gì trên task này
- Hiển thị: người thực hiện, hành động, giá trị cũ → giá trị mới, thời gian
- Ví dụ: "Nguyễn Văn A **đã cập nhật** — Trạng thái: ~~Đang chờ~~ → Đang làm"

---

## 5. Xem Công trình

Vào **Công trình** trên menu.

- Xem danh sách công trình (tên, khách hàng, trạng thái, ngày bắt đầu)
- Nhấn nút **mắt** (👁) để xem chi tiết
- Bạn **chỉ xem**, không thể thêm/sửa/xóa công trình

> ⚠️ Các cột tài chính (giá trị HĐ, đã thu, đã chi, lợi nhuận) sẽ không hiển thị cho bạn.

---

## 6. Xem Khách hàng

Vào **Khách hàng** trên menu.

- Xem danh sách khách hàng: tên, địa chỉ, email
- **SĐT bị ẩn** (hiển thị dạng ******) — để bảo mật thông tin

---

## 7. Bảng tổng quan bên phải

Ở trang Công việc, bên phải có 2 panel:

**Tổng quan:**
- Tổng công việc
- Đang chờ / Đang làm / Hoàn thành
- Quá hạn / Sắp đến hạn

**Công việc quá hạn:**
- Danh sách task đã trễ deadline
- Nhấn vào để mở chi tiết

---

## 8. Thông báo

- Biểu tượng **chuông** 🔔 ở góc phải header
- Nhấn để xem danh sách thông báo:
  - Task mới được giao cho bạn
  - Task quá hạn
- Badge đỏ = số thông báo chưa đọc
- Nhấn vào thông báo để đi đến task liên quan

---

## 9. Đăng xuất

- Nhấn **Đăng xuất** ở cuối menu bên trái

---

## Tóm tắt quyền của Design

| Chức năng | Quyền |
|-----------|-------|
| Xem công trình | ✅ (không thấy tài chính) |
| Thêm/sửa/xóa công trình | ❌ |
| Xem khách hàng | ✅ (SĐT bị ẩn) |
| Xem task được gán | ✅ |
| Cập nhật trạng thái task | ✅ |
| Upload file thiết kế | ✅ |
| Xem lịch sử task | ✅ |
| Xem thu tiền | ❌ |
| Xem chi phí | ❌ |
| Xem báo cáo tài chính | ❌ |
| Xem hiệu suất cá nhân | ✅ (trên Dashboard) |
