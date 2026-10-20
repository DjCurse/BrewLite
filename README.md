# BrewLite

BrewLite là ứng dụng đặt đồ uống trực tuyến không dùng tiền mặt.
Sử dụng các công nghệ: Next.js (Frontend) và NestJS, Prisma, PostgreSQL (Backend).

## Yêu cầu môi trường

- Node.js và npm.
- PostgreSQL đang chạy.
- Git để clone mã nguồn nếu chưa có project trên máy.

## 1. Cấu hình và chạy backend

### Bước 1: Cấu hình database

Tạo file `backend/.env` với nội dung:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/brewlite"
```

Thay `YOUR_PASSWORD` bằng mật khẩu PostgreSQL trên máy của bạn.

### Bước 2: Cài đặt và khởi chạy

Mở terminal tại thư mục gốc của dự án, sau đó chạy:

```bash
cd backend
npm install
npx prisma db push
npm run start:dev
```

Backend mặc định chạy tại `http://localhost:3001`.

Giữ terminal backend hoạt động trong khi chạy frontend.

## 2. Chạy frontend

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

## 3. Đăng nhập và đăng ký

Truy cập `http://localhost:3000/login`.

- Đăng nhập: gửi yêu cầu `POST /auth/login`.
- Đăng ký: gửi yêu cầu `POST /auth/register`.
- Dữ liệu gửi lên gồm `email` và `password` theo định dạng JSON.
- Khi đăng nhập thành công, frontend lưu JWT vào `localStorage` với khóa `access_token`.
- Khi đăng ký thành công, giao diện chuyển về form đăng nhập để người dùng đăng nhập.

Các chức năng này yêu cầu backend đang chạy và database đã được cấu hình đúng.

## 4. Kiểm tra build frontend

Tại terminal, chạy:

```bash
cd frontend
npm run build
```

Đảm bảo quá trình build hoàn tất thành công trước khi xác nhận hoàn thành task.

## Lưu ý

- Không commit file `.env` hoặc thông tin mật khẩu lên Git.
- Nếu gặp lỗi kết nối database, kiểm tra PostgreSQL, tên database và `DATABASE_URL`.
- Nếu frontend không gọi được API, kiểm tra cổng backend, `NEXT_PUBLIC_API_URL`.