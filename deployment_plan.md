# Kế hoạch triển khai (Deployment Plan)

Dự án **Hệ thống quản lý dự án thi công** sử dụng stack **Nuxt 3**, **Prisma ORM**, và **SQLite**. Việc triển khai cần tập trung vào sự đơn giản, độc lập và bảo quản an toàn cơ sở dữ liệu (chỉ là một tệp `sqlite.db`).

Phương án khuyến nghị là **Triển khai trên VPS sử dụng Docker (Docker Compose)**. Docker giúp môi trường chạy ổn định, không bị xung đột với các ứng dụng khác và dễ dàng khôi phục khi gặp sự cố cài đặt.

---

## 🚀 Các giai đoạn triển khai (Phases)

### Giai đoạn 1: Chuẩn bị môi trường (Pre-deployment)
1. **Chuẩn bị Máy chủ (VPS):**
   - Thuê một VPS cấu hình cơ bản (1 CPU, 1-2GB RAM, 25GB SSD) tại các nhà cung cấp như DigitalOcean, Linode, Vultr hoặc dùng server nội bộ doanh nghiệp.
   - Hệ điều hành: **Ubuntu 22.04 LTS** (hoặc 24.04).
2. **Cài đặt phần mềm trên VPS:**
   - Cài đặt `Docker` và `Docker Compose`.
   - Cài đặt `Git` để pull code hoặc cấu hình CI/CD (như GitHub Actions/GitLab CI).
3. **Cấu hình Tên miền (Domain) & SSL (HTTPS):**
   - Trỏ domain (ví dụ: `quanly.tencongty.com`) về địa chỉ IP của VPS thông qua bản ghi `A record`.

### Giai đoạn 2: Cấu hình Source Code và Build
1. **Thiết lập biến môi trường (`.env`):**
   - Định nghĩa các hằng số môi trường an toàn. Ví dụ: URL trỏ tới file cơ sở dữ liệu SQLite: `DATABASE_URL="file:/data/sqlite.db"`.
   - **Google Drive OAuth (tùy chọn):**
     ```
     GOOGLE_CLIENT_ID=<your-client-id>
     GOOGLE_CLIENT_SECRET=<your-client-secret>
     GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google-callback
     GOOGLE_REFRESH_TOKEN=<from-oauth-setup>
     GOOGLE_DRIVE_ROOT_FOLDER_ID=<drive-folder-id>
     ```
2. **Tạo `Dockerfile`:**
   - Cấu hình file image Docker dựa trên Node.js để build ứng dụng (sử dụng multi-stage build cho nhẹ file image).
   - Đảm bảo có câu lệnh `npx prisma generate` đính kèm.
3. **Tạo `docker-compose.yml`:**
   - Định nghĩa service cho Nuxt Application.
   - Cấu hình **Volumes** mapping thư mục trên máy chủ vật lý vào thư mục `/data` trong container. Điều này giúp database không bị xóa mất khi cập nhật phiên bản ứng dụng (container khởi động lại).
   - Thiết lập một reverse proxy (như **Caddy** hoặc **Nginx Proxy Manager**) để quản lý tự động chứng chỉ SSL cho tên miền. (Khuyến nghị dùng Caddy vì nó tự động cấp phát Let's Encrypt).

### Giai đoạn 3: Triển khai (Deployment)
1. Kéo mã nguồn về VPS và tạo các thư mục lưu database, `.env`.
2. Bật hệ thống bằng câu lệnh:
   ```bash
   docker-compose up -d --build
   ```
3. Chạy script đồng bộ cấu trúc cơ sở dữ liệu (`Prisma Migrate/Push`) trong container lần đầu:
   ```bash
   docker-compose exec app npx prisma db push
   ```
4. Kiểm tra ứng dụng, log lỗi (`docker-compose logs -f`), và truy cập vào đường dẫn tên miền để xác nhận hoạt động bình thường, cài đặt HTTPS thành công.

### Giai đoạn 4: Quản lý và Bảo trì
1. **Sao lưu dữ liệu (Backup SQLite) - Cực kì quan trọng:**
   - Do SQLite chỉ là 1 file `sqlite.db`, bạn cần thiết lập **cron job** chạy tự động mỗi ngày trên VPS để copy file này và nén lại (ví dụ `.zip`).
   - Tự động đẩy file nén lên một nơi lưu trữ an toàn (Google Drive, AWS S3, hoặc máy chủ backup khác) thông qua rclone.
2. **Giám sát hệ thống (Monitoring):**
   - Kiểm tra dung lượng ổ cứng để phòng việc logs phình to hoặc tràn dung lượng ổ cứng.
3. **Quy trình cập nhật:**
   - Khi có tính năng mới: `git pull` -> `docker-compose up -d --build` -> hệ thống update tự động không mất dữ liệu hiện tại do đã có volumes.

---

## 📋 Kế hoạch hành động chi tiết (To-do List)

- [ ] Định dạng và viết các file `Dockerfile` và `.dockerignore` tại root dự án.
- [ ] Soạn `docker-compose.yml` với service web và proxy (Caddy/Nginx).
- [ ] Cấu hình Prisma schema để chắc chắn đường dẫn database có thể tùy biến qua biến môi trường.
- [ ] Thử nghiệm build image docker ở dưới local để kiểm tra tính đúng đắn.
- [ ] Viết một shell script nhỏ (`backup.sh`) để nén file SQLite dự phòng.
- [ ] Thực thi đưa lên máy chủ thực tế (Production).
