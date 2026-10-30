# BrewLite

BrewLite là ứng dụng đặt đồ uống trực tuyến không dùng tiền mặt.
Sử dụng các công nghệ: Next.js (Frontend) và NestJS, Prisma, PostgreSQL (Backend).

## Yêu cầu môi trường

- Node.js và npm.
- PostgreSQL đang chạy (nếu chạy Local) hoặc Docker Desktop (đã cài đặt WSL 2 nếu chạy qua Docker).
- Git để clone mã nguồn nếu chưa có project trên máy.

---

## 1. Cấu hình và chạy backend (Local)

### Bước 1: Cấu hình database

Tạo file `backend/.env` với nội dung:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/brewlite"
JWT_SECRET="brewlite_super_secret_jwt_2026"
PORT=3001
```

Thay `YOUR_PASSWORD` bằng mật khẩu PostgreSQL trên máy của bạn.

### Bước 2: Cài đặt và khởi chạy

Mở terminal tại thư mục gốc của dự án, sau đó chạy:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run start:dev
```

Backend mặc định chạy tại `http://localhost:3001`.
Giữ terminal backend hoạt động trong khi chạy frontend.

---

## 2. Chạy frontend (Local)

Mở một terminal khác tại thư mục gốc của dự án và chạy:

```bash
cd frontend
npm install
npm run dev
```

Mở trình duyệt tại `http://localhost:3000`.

Frontend mặc định gọi API tại `http://localhost:3001`. Nếu backend chạy ở địa chỉ khác, tạo file `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Thay URL bằng địa chỉ backend thực tế nếu cần. Sau khi thay đổi biến môi trường, khởi động lại frontend.

---

## 3. Đăng nhập và đăng ký

Truy cập `http://localhost:3000/login`.

- Đăng nhập: gửi yêu cầu `POST /auth/login`.
- Đăng ký: gửi yêu cầu `POST /auth/register`.
- Dữ liệu gửi lên gồm `email` và `password` theo định dạng JSON.
- Khi đăng nhập thành công, frontend lưu JWT vào `localStorage` với khóa `access_token`.
- Khi đăng ký thành công, giao diện chuyển về form đăng nhập để người dùng đăng nhập.

Các chức năng này yêu cầu backend đang chạy và database đã được cấu hình đúng.

---

## 4. Kiểm tra build frontend & backend

Tại terminal, chạy:

```bash
cd backend
npm run build

cd ../frontend
npm run build
```

Đảm bảo quá trình build hoàn tất thành công trước khi xác nhận hoàn thành task.

---

## 5. Chạy toàn bộ hệ thống bằng Docker Compose (Task 9)

### Bước 1: Chuẩn bị môi trường Docker

1. Đảm bảo máy đã cài đặt WSL 2 (nếu vừa cài đặt WSL, hãy **Restart** máy tính).
2. Mở ứng dụng **Docker Desktop** và đợi trạng thái chuyển sang **Engine running** (màu xanh lá).
3. Tắt các tiến trình Backend (`3001`) hoặc Frontend (`3000`) đang chạy ở terminal Local để tránh trùng cổng.

### Bước 2: Khởi chạy các container

Mở terminal tại thư mục gốc của dự án (`BrewLite`) và chạy:

```bash
docker compose up --build
```

Hệ thống sẽ tự động dựng đồng thời 3 dịch vụ:
- **Database PostgreSQL (`brewlite-db`):** Cổng `5432`
- **Backend NestJS (`brewlite-backend`):** `http://localhost:3001`
- **Frontend Next.js (`brewlite-frontend`):** `http://localhost:3000`

Để dừng hệ thống Docker, nhấn `Ctrl + C` tại terminal hoặc chạy:

```bash
docker compose down
```

---

## 6. Kiểm thử tự động nghiệp vụ nâng cao (Task 10)

Chạy bộ Unit/Integration Test chứng minh các nghiệp vụ của Task 10 (Order State Machine `assertTransition`, Thanh toán Idempotent với `Idempotency-Key`, Kiểm soát tồn kho đồng thời với Optimistic Locking, và Mã giảm giá/Điểm thưởng Loyalty):

```bash
cd backend
npx jest src/orders/task10-business.spec.ts
```

---

## Lưu ý

- Không commit file `.env` hoặc thông tin mật khẩu lên Git.
- Nếu gặp lỗi kết nối database, kiểm tra PostgreSQL, tên database và `DATABASE_URL`.
- Nếu chạy Docker báo lỗi trùng cổng `5432` (do PostgreSQL trên máy thật đang chạy ngầm), hãy tắt dịch vụ PostgreSQL trên Windows hoặc đổi cấu hình cổng của service `postgres` trong `docker-compose.yml` từ `'5432:5432'` thành `'5433:5432'`.
- Nếu frontend không gọi được API, kiểm tra cổng backend và biến `NEXT_PUBLIC_API_URL`.