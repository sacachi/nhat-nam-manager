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
- Quản lý Google Drive
- Quản lý hợp đồng

### Sale
- Tạo và xem phiếu thu thập thông tin khách hàng (Lead)
- Xem thông tin khách hàng đầy đủ (bao gồm SĐT)
- Thêm công trình, thu tiền
- Upload hợp đồng

**Không có quyền:**
- Quản lý nhân viên
- Xóa dữ liệu
- Xem báo cáo tài chính

### Design
- Xem danh sách công trình và khách hàng
- **SĐT khách hàng bị ẩn (masked)**
- Xem và cập nhật công việc thiết kế được giao
- Upload bản thiết kế
- Cập nhật trạng thái thiết kế

**Không có quyền:**
- Quản lý nhân viên
- Thu tiền, chi phí
- Xóa dữ liệu

### Construction
- Xem danh sách công trình và khách hàng
- Nhập chi phí thi công
- **SĐT khách hàng bị ẩn (masked)**

**Không có quyền:**
- Quản lý nhân viên
- Thu tiền
- Xóa dữ liệu

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

### customer_leads
Lưu phiếu thu thập thông tin khách hàng tiềm năng.
- `id`, `sale_user_id`, `customer_name`, `phone`, `address`
- `construction_categories` (JSON array: ["Kitchen", "Wardrobe", ...])
- `construction_categories_other`, `description`, `images` (JSON array)
- `construction_value`, `design_submission_date`, `status`
- `designer_id`, `design_deadline`, `design_status`, `design_files`, `design_note`
- `note`, `created_at`, `updated_at`
- *status*: `pending`, `reviewed`, `converted`, `rejected`
- *design_status*: `not_assigned`, `assigned`, `in_progress`, `review_requested`, `approved`, `rejected`

### contracts
Lưu file hợp đồng gắn với công trình.
- `id`, `project_id`, `file_name`, `drive_file_id`, `drive_url`
- `file_type` (pdf/doc/docx), `file_size`, `uploaded_by`, `note`
- `created_at`

### project_tasks
Lưu công việc trong từng công trình.
- `id`, `project_id`, `title`, `description`
- `type` (design/construction/inspection/other)
- `status` (pending/in_progress/completed/cancelled)
- `priority` (low/medium/high/urgent)
- `assignee_id`, `deadline`, `completed_at`
- `created_by`, `created_at`, `updated_at`

## 14. Quản lý Thu thập Khách hàng (Lead)

Hệ thống hỗ trợ Sale thu thập thông tin khách hàng tiềm năng.

**Thông tin phiếu thu thập:**
- Thông tin khách hàng: Tên, SĐT, Địa chỉ
- Hạng mục thi công: Kitchen, Wardrobe, TV Cabinet, Wall Panels, Ceiling, Staircase, Other
- Mô tả chi tiết yêu cầu
- Hình ảnh thực tế (upload lên Google Drive)
- Giá trị công trình dự kiến
- Ngày gửi sơ bộ thiết kế

**Quy trình xử lý:**
1. Sale tạo phiếu → Status: **Chờ duyệt**
2. Admin duyệt → Status: **Đã duyệt**
3. Admin gán Designer + Deadline → Design Status: **Đã giao**
4. Designer upload thiết kế + cập nhật status → Design Status: **Đang thiết kế**
5. Designer gửi duyệt → Design Status: **Chờ duyệt TK**
6. Admin duyệt thiết kế → Design Status: **Đã duyệt TK**
7. Admin/Sale chuyển đổi → Status: **Đã chuyển đổi** (tạo Customer + Project)
8. Admin từ chối → Status: **Từ chối**

**Quyền truy cập:**
- Sale: Tạo, sửa phiếu của mình
- Admin: Duyệt, gán designer, từ chối, chuyển đổi, xóa
- Design: Xem leads được gán (trong Design Workspace)
- Construction: Không truy cập

---

## 15. Quản lý Hợp đồng

Hệ thống hỗ trợ upload và quản lý file hợp đồng gắn với công trình.

**Thông tin hợp đồng:**
- Tên file, loại file (PDF, DOC, DOCX)
- Kích thước file
- Link Google Drive
- Người upload, ngày upload
- Ghi chú

**Lưu trữ:** File được upload lên Google Drive trong thư mục `contracts/{project_id}/`

**Quyền truy cập:**
- Sale: Upload hợp đồng
- Admin: Upload, xóa hợp đồng
- Design, Construction: Chỉ xem

---

## 15a. Quy trình Thiết kế (Design Workflow)

Hệ thống hỗ trợ quy trình gán và theo dõi công việc thiết kế.

### Luồng xử lý:
```
Sale tạo lead → Admin duyệt → Admin gán Designer → Designer upload TK → Admin duyệt TK → Convert
```

### Design Status:
| Status | Ý nghĩa | Ai cập nhật |
|--------|---------|-------------|
| `not_assigned` | Chưa giao | Auto |
| `assigned` | Đã giao designer | Auto khi Admin gán |
| `in_progress` | Đang thiết kế | Designer |
| `review_requested` | Gửi duyệt TK | Designer |
| `approved` | Đã duyệt TK | Admin |
| `rejected` | Từ chối TK | Admin |

### Designer Workspace
- Designer có trang riêng để xem công việc được giao
- Upload bản thiết kế (hình ảnh, PDF)
- Cập nhật trạng thái thiết kế
- Xem deadline và thông tin khách hàng

### Quyền truy cập:
- **Admin**: Gán designer, xem tất cả leads, duyệt/từ chối thiết kế
- **Design**: Xem leads được gán, upload thiết kế, cập nhật trạng thái
- **Sale, Construction**: Không truy cập workspace thiết kế

---

## 15b. Quản lý Công việc (Tasks)

Hệ thống hỗ trợ tạo và theo dõi công việc trong từng công trình.

**Thông tin công việc:**
- Tiêu đề, mô tả chi tiết
- Loại: Thiết kế, Thi công, Kiểm tra, Khác
- Trạng thái: Đang chờ, Đang làm, Hoàn thành, Đã hủy
- Ưu tiên: Thấp, Trung bình, Cao, Gấp
- Người phụ trách, hạn hoàn thành

**Quyền truy cập:**
- **Admin/Sale/Design/Construction**: Tạo và cập nhật công việc
- **Design/Construction**: Xem công việc được gán trong "Công việc của tôi"
- **Admin**: Xóa công việc

**Trang "Công việc của tôi":**
- Hiển thị công việc được gán cho user
- Tổng quan: số công việc theo trạng thái
- Cảnh báo công việc quá hạn
- Cập nhật trạng thái nhanh (Bắt đầu/Hoàn thành)

---

## 16. Mục tiêu triển khai

Hệ thống hướng tới triển khai nhanh, dễ sử dụng, chi phí vận hành thấp và dễ mở rộng trong tương lai. Có thể triển khai trên:
- VPS
- Docker
- Server nội bộ doanh nghiệp

---

## 17. Google Drive Integration

### Cấu hình OAuth (Chỉ cần thực hiện 1 lần)
1. Tạo Google Cloud Project và bật Google Drive API
2. Tạo OAuth 2.0 Client ID credentials
3. Thêm các biến môi trường vào `.env`:
   ```
   GOOGLE_CLIENT_ID=<your-client-id>
   GOOGLE_CLIENT_SECRET=<your-client-secret>
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google-callback
   GOOGLE_REFRESH_TOKEN=<sẽ được lấy tự động>
   GOOGLE_DRIVE_ROOT_FOLDER_ID=<root-folder-id-tren-drive>
   ```
4. Truy cập `/api/auth/google-setup` để lấy refresh token
5. Copy refresh token vào `.env`
6. Khởi động lại server

### Cấu trúc thư mục Google Drive
```
Root Folder (GOOGLE_DRIVE_ROOT_FOLDER_ID)
├── leads/
│   └── {leadId}/
│       ├── image1.jpg
│       └── designs/
│           ├── design-v1.pdf
│           └── render-3d.png
└── contracts/
    └── {projectId}/
        ├── hopdong-v1.pdf
        └── phuluc.doc
```

### API Endpoints
- `GET /api/auth/google-setup` - Bắt đầu OAuth flow
- `GET /api/auth/google-callback` - OAuth callback, hiển thị refresh token

---

## 16b. Báo Cáo Hiệu Suất Nhân Viên

Hệ thống hỗ trợ đánh giá hiệu suất nhân viên theo từng role.

### KPI theo vai trò:

**Sale:**
- Leads đã tạo
- Leads chuyển đổi thành công
- Tỷ lệ chuyển đổi
- Giá trị hợp đồng
- Thời gian TB chuyển đổi

**Design:**
- Tasks được gán
- Tasks hoàn thành
- Tỷ lệ đúng hạn
- Số lần sửa thiết kế
- Tasks quá hạn

**Construction:**
- Tasks được gán
- Tasks hoàn thành
- Tỷ lệ đúng hạn
- Tasks quá hạn

### Chấm điểm (0-100):
- A+: 90-100
- A: 85-89
- B+: 75-84
- B: 65-74
- C: 50-64
- D: <50

### Quyền truy cập:
- **Admin**: Xem toàn bộ báo cáo hiệu suất, xếp hạng
- **NV khác**: Chỉ xem hiệu suất cá nhân trên Dashboard

---

## 17. Seed Data (Dữ liệu mẫu)

Chạy `npm run db:seed` để tạo dữ liệu mẫu:

### Users
| Username | Password | Role |
|----------|----------|------|
| admin | 123456@Abc | Admin |
| sale_1 | 123456@Abc | Sale |
| sale_2 | 123456@Abc | Sale |
| design_1 | 123456@Abc | Design |
| design_2 | 123456@Abc | Design |
| construction_1 | 123456@Abc | Construction |
| construction_2 | 123456@Abc | Construction |

### Sample Data
- 5 Customers
- 5 Projects (various statuses)
- 15 Receipts
- 16 Expenses
- 5 Customer Leads (mixed statuses)

---

## Phụ lục A. Cập nhật triển khai thực tế ngày 20/03/2026

Phụ lục này ghi lại những thay đổi đã được triển khai thêm vào hệ thống sau giai đoạn hoàn thiện core features. Mục đích là để tài liệu phản ánh đúng trạng thái vận hành hiện tại của sản phẩm, thay vì chỉ mô tả thiết kế ban đầu.

### A.1. Dashboard theo role

Dashboard hiện không còn là một màn hình chung cho toàn bộ người dùng.

**Admin:**
- Xem số liệu toàn công ty.
- Xem tổng công trình, tổng thu, tổng chi, lợi nhuận tạm tính.
- Xem các task quá hạn toàn hệ thống.
- Xem hoạt động gần đây trên phạm vi toàn bộ doanh nghiệp.

**Sale:**
- Xem thống kê lead của chính mình.
- Xem widget hiệu suất cá nhân.
- Không còn nhìn thấy số liệu tài chính toàn công ty.

**Design:**
- Xem các chỉ số liên quan đến thiết kế được giao.
- Xem task của chính mình, trạng thái xử lý và các việc quá hạn.

**Construction:**
- Xem số lượng task được giao, tiến độ thực hiện, task quá hạn.
- Không nhìn thấy báo cáo tài chính cấp công ty.

**Ý nghĩa vận hành:**
- Bảo mật hơn.
- Mỗi bộ phận tập trung vào đúng thông tin cần hành động.
- Dashboard trở thành điểm vào công việc, không chỉ là báo cáo tổng.

### A.2. Task hiện hỗ trợ 2 nguồn dữ liệu: Project hoặc Lead

Mô hình task đã được mở rộng thêm một bước quan trọng.

**Trước đây:**
- Task chỉ gắn với project.

**Hiện tại:**
- Task có thể gắn với project.
- Hoặc gắn trực tiếp với lead.

**Mục tiêu nghiệp vụ:**
- Cho phép giao việc sớm ngay từ lúc lead chưa chuyển thành project.
- Ví dụ: giao khảo sát, giao thiết kế sơ bộ, giao chuẩn bị báo giá hoặc kiểm tra hồ sơ đầu vào ngay ở giai đoạn lead.

**Hệ quả trong dữ liệu:**
- `project_tasks.project_id` trở thành optional.
- `project_tasks.lead_id` được bổ sung.
- Một task chỉ được phép gắn với đúng một nguồn tại một thời điểm.

### A.3. Chi phí theo task

Hệ thống hiện đã hỗ trợ ghi nhận chi phí trực tiếp vào task.

**Điểm mới:**
- Bảng `expenses` có thêm `task_id`.
- Trong chi tiết project, mỗi task hiển thị tổng chi phí đã gắn.
- Người dùng có thể mở dialog ngay trên task để thêm chi phí mới.

**Lợi ích:**
- Theo dõi được chi phí theo hạng mục thay vì chỉ theo project tổng.
- Tạo nền tảng cho báo cáo lợi nhuận theo task hoặc theo nhóm công việc trong giai đoạn tiếp theo.

### A.4. Admin có màn hình quản lý task toàn bộ nhân viên

Hệ thống hiện có màn hình riêng cho Admin để điều phối công việc trên toàn công ty.

**Điểm nổi bật của màn hình này:**
- Xem tất cả task trong hệ thống.
- Nhóm theo nguồn việc hoặc theo nhân viên.
- Theo dõi tiến độ hoàn thành theo từng nhóm.
- Lọc theo project, lead, assignee, trạng thái, ưu tiên, loại task.
- Add task trực tiếp trên màn hình.
- Add task ngay trong từng group.
- Edit task inline ngay tại list.
- Quick update status ngay trên hàng dữ liệu.
- Highlight task quá hạn.

**Mục đích:**
- Phục vụ vai trò điều phối công việc của Admin.
- Giúp nhìn nhanh xem bộ phận nào đang nghẽn, project nào đang tồn đọng, lead nào đã có việc nhưng chưa được xử lý tiếp.

### A.5. Menu Công việc đã chuyển thành sub-menu

Sidebar hiện hỗ trợ menu lồng cho phần công việc.

**Cấu trúc hiện tại:**
- `Công việc của tôi`
- `QL Công việc`

**Phân quyền:**
- `Công việc của tôi`: Admin, Design, Construction.
- `QL Công việc`: Admin only.

**Giá trị:**
- Tách rõ nhu cầu cá nhân và nhu cầu điều phối toàn công ty.
- Giảm cảm giác rối vì dồn quá nhiều use case vào một trang duy nhất.

### A.6. Lead assignment flow đã linh hoạt hơn

Việc gán Designer từ lead đã được nới điều kiện thực tế hơn.

**Hiện tại:**
- Admin có thể giao designer khi lead đang ở `pending` hoặc `reviewed`.
- Không cần chờ đúng một trạng thái trung gian mới thao tác được.
- Block giao designer chỉ hiện khi lead chưa có designer.

**Kết quả:**
- Hạn chế tình trạng nghiệp vụ bị kẹt bởi logic UI quá cứng.
- Phù hợp hơn với cách vận hành thực tế của đội ngũ.

---

## Phụ lục B. Điều chỉnh cấu trúc dữ liệu cần ghi nhớ

### B.1. Bảng `project_tasks`

Ngoài các thông tin đã có trước đó, cần lưu ý:
- `project_id`: có thể null
- `lead_id`: có thể null
- task phải thuộc **project hoặc lead**, không được để cả hai cùng null khi ghi dữ liệu hợp lệ

### B.2. Bảng `expenses`

Ngoài `project_id`, hiện đã có thêm:
- `task_id`: optional

Điều này cho phép:
- chi phí chung cho project
- hoặc chi phí riêng cho một task cụ thể

### B.3. Trường tổng hợp task response ở frontend

API task hiện chuẩn hóa thêm các trường:
- `source_type`
- `source_id`
- `source_name`
- `project_name`
- `lead_name`
- `total_expense`

Nhờ đó frontend có thể hiển thị thống nhất mà không cần viết hai luồng render khác nhau cho task project và task lead.

---

## Phụ lục C. Kế hoạch tiếp theo

Các hạng mục dưới đây là roadmap đề xuất cho giai đoạn tiếp theo, ưu tiên theo mức độ hữu ích trong vận hành.

### C.1. Hoàn thiện admin task operations

**Mục tiêu:** biến màn hình `QL Công việc` thành trung tâm điều phối thực thụ.

**Nên làm tiếp:**
- Delete task ngay trên màn hình Admin.
- Bulk actions cho nhiều task cùng lúc.
- Bộ lọc nhanh: quá hạn, sắp đến hạn, chưa có người phụ trách.
- Sort mạnh hơn theo deadline, priority, assignee.

### C.2. Kanban và Timeline view

**Mục tiêu:** tăng khả năng nhìn tiến độ theo chiều trực quan.

**Nên làm tiếp:**
- Chế độ Kanban theo trạng thái.
- Chế độ Timeline hoặc Gantt-lite theo deadline.
- Kéo thả đổi trạng thái nhanh.

### C.3. Notification nội bộ

**Mục tiêu:** giảm việc phụ thuộc vào người dùng tự kiểm tra màn hình.

**Nên làm tiếp:**
- Thông báo khi được giao task.
- Thông báo khi task sắp đến hạn hoặc quá hạn.
- Thông báo khi lead được giao designer.
- Thông báo khi thiết kế bị reject hoặc cần chỉnh sửa.

### C.4. Báo cáo điều hành cấp team

**Mục tiêu:** tăng góc nhìn quản trị thay vì chỉ xem hiệu suất cá nhân.

**Nên làm tiếp:**
- Báo cáo tiến độ theo project.
- Báo cáo lead funnel toàn hệ thống.
- Báo cáo chi phí theo loại task.
- Báo cáo theo team Sale / Design / Construction.

### C.5. Validation và test

**Mục tiêu:** tăng độ an toàn khi hệ thống bắt đầu có nhiều flow liên kết nhau.

**Nên làm tiếp:**
- Chuẩn hóa validate ở backend cho toàn bộ API tạo/sửa.
- Thêm test cho các flow dài:
  - lead → assign → design → convert
  - task → expense → dashboard
  - performance scoring

---

## D. Lịch sử phát triển — Các Phase đã hoàn thành

> Nội dung này được chuyển từ SPRINT_PLAN.md ngày 20/03/2026 sau khi toàn bộ sprint đã triển khai xong.

### Phase 1 (v1 → v2) — Nền tảng

| Sprint | Nội dung | Hoàn thành |
|--------|----------|------------|
| Sprint 1 | Nền tảng: Roles (Admin/Sale/Design/Construction) + Google Drive + API Security | 19/03/2026 |
| Sprint 2 | Core: Phiếu thu thập KH (Lead form) + Image upload | 19/03/2026 |
| Sprint 3 | Core: Quản lý hợp đồng + Project enhancement | 19/03/2026 |
| Sprint 4 | Bảo mật: Phone masking + Role-based UI | 19/03/2026 |
| Sprint 5 | Lead workflow + Convert lead → Customer+Project | 19/03/2026 |

### Phase 2 (v2 → v3) — Lead Workflow Pro

| Sprint | Nội dung | Hoàn thành |
|--------|----------|------------|
| Sprint 6 | Schema + API: Designer assignment, design status, design files | 19/03/2026 |
| Sprint 7 | Frontend: Lead workflow UI overhaul + Designer workspace | 19/03/2026 |
| Sprint 8 | Convert flow: Admin/Sale tạo hợp đồng từ lead + Polish | 19/03/2026 |

### Phase 3 (v3 → v4) — Task Management & Tiến Độ Dự Án

| Sprint | Nội dung | Hoàn thành |
|--------|----------|------------|
| Sprint 9 | Schema + API: ProjectTask model, CRUD, assign, status | 19/03/2026 |
| Sprint 10 | Frontend: Dashboard widgets, deadline alerts, project task progress | 19/03/2026 |

### Phase 4 (v4 → v5) — Báo Cáo Hiệu Suất Nhân Viên

| Sprint | Nội dung | Hoàn thành |
|--------|----------|------------|
| Sprint 11 | API: Scoring engine, performance dashboard, leaderboard | 19/03/2026 |
| Sprint 12 | Frontend: Performance dashboard, individual detail, self-view widget | 19/03/2026 |

### Phase 5 (v5 → v6) — Điều Hành & Theo Dõi

| Sprint | Nội dung | Hoàn thành |
|--------|----------|------------|
| Sprint 13 | Task Operations Pro: Filters, bulk actions, quick filters | 20/03/2026 |
| Sprint 14 | Kanban & Timeline View | 20/03/2026 |
| Sprint 15 | Notifications & Escalation | 20/03/2026 |
| Sprint 16 | Reporting 2.0 | 20/03/2026 |
| Sprint 17 | Data Quality & Validation Hardening | 20/03/2026 |
| Sprint 18 | Testing & Release Readiness | 20/03/2026 |

### Cập nhật thực tế 20/03/2026

Các hạng mục bổ sung triển khai theo yêu cầu vận hành:

1. **Dashboard theo role** — Admin xem toàn bộ, Sale/Design/Construction chỉ xem dữ liệu liên quan
2. **Chi phí theo task** — Expense gắn task_id, theo dõi chi prí từng hạng mục
3. **Giao designer trên leads** — Nới điều kiện giao designer từ reviewed sang pending/reviewed
4. **Admin quản lý task toàn công ty** — Màn hình QL Công việc với bulk actions, filters, inline edit
5. **Menu và route protection** — Sub-menu "Công việc", route guard /task-management
6. **Google Drive tổ chức folder** — Cấu trúc category/year/month/id-name
7. **Upload ảnh cho doanh thu, chi phí** — Receipt và Expense hỗ trợ upload ảnh
8. **Design-workspace gom về my-tasks** — Task detail dialog với history + upload thiết kế
9. **Design không CRUD project** — Chỉ xem, không thêm/sửa/xóa công trình
- Hoàn thiện checklist release, backup và restore.