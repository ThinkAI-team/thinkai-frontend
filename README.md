# ThinkAI Frontend

Nền tảng giáo dục thông minh với AI — Giao diện người dùng.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** CSS Modules
- **Design System:** Zen Harmony

## Tính năng đã hoàn thành

- 🏠 Trang chủ (Landing Page)
- 🔐 Đăng ký / Đăng nhập (kết nối API)
- 👤 Trang cá nhân (xem, sửa thông tin, đổi mật khẩu)
- 📧 Quên mật khẩu (gửi email reset)
- 📊 Dashboard
- 📚 Khóa học & Chi tiết khóa học
- 📝 Luyện thi & Kết quả
- 🤖 Gia sư AI
- ⚙️ Cài đặt
- 🏫 Phòng học (Learning Room)
- 💳 Thanh toán
- 🔧 API Service Layer

## Cài đặt & Chạy

```bash
# Cài dependencies
npm install

# Chạy development server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem.

## Biến môi trường

Tạo file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8081
```

## Cấu trúc thư mục

```
├── app/
│   ├── (auth)/          # Đăng ký, Đăng nhập, Quên mật khẩu
│   ├── (main)/          # Dashboard, Khóa học, Profile, ...
│   ├── admin/           # Trang quản trị
│   ├── globals.css      # CSS toàn cục & Design tokens
│   └── layout.tsx       # Root layout
├── components/
│   ├── layout/          # Navbar, Footer
│   └── ui/              # Button, Card
├── services/            # API layer (auth, user, api utilities)
└── lib/                 # Types, hooks, API clients
```

## Backend

Backend repository: [thinkai-backend](https://github.com/ThinkAI-team/thinkai-backend)