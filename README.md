# ThinkAI Frontend

Nền tảng giáo dục thông minh với AI — Giao diện người dùng.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** CSS Modules + Zen Harmony Design System
- **State:** React Hooks (useState, useEffect)
- **API:** Custom fetch wrapper (`services/api.ts`)

## Cấu trúc thư mục

```
app/
├── (auth)/              # Trang xác thực
│   ├── login/           # Đăng nhập
│   ├── register/        # Đăng ký
│   ├── forgot-password/ # Quên mật khẩu
│   └── reset-password/  # Đặt lại mật khẩu
├── (main)/              # Trang chính (cần đăng nhập)
│   ├── dashboard/       # Tổng quan học tập
│   ├── courses/         # Khóa học
│   ├── exams/           # Luyện thi
│   ├── profile/         # Trang cá nhân
│   ├── settings/        # Cài đặt
│   ├── ai-tutor/        # Gia sư AI
│   ├── learn/           # Phòng học
│   └── payment/         # Thanh toán
├── admin/               # Quản trị viên
└── page.tsx             # Trang chủ

components/
├── layout/              # Navbar, Footer
└── ui/                  # Button, Card (reusable)

services/
├── api.ts               # API client (fetch wrapper + JWT + FormData)
├── auth.ts              # Đăng ký, đăng nhập, quên mật khẩu
├── user.ts              # Profile, đổi mật khẩu
├── courses.ts           # Luồng khóa học học viên
├── exams.ts             # Luồng luyện thi
├── ai-tutor.ts          # Luồng AI tutor
├── teacher.ts           # Luồng teacher workspace
└── admin.ts             # Luồng admin

lib/
└── types/               # TypeScript interfaces dùng chung
```

Chuẩn hiện tại: `app/*` và `components/*` chỉ dùng API qua `services/*`.

## Cài đặt & Chạy

```bash
# Cài dependencies
npm install

# Chạy dev server
npm run dev

# Build production
npm run build
```

Mặc định frontend chạy tại **http://localhost:3000**

## Kết nối Backend

Cấu hình API URL trong file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8081
```

Nếu không có file `.env.local`, mặc định sẽ kết nối tới `http://localhost:8081`.

## Tính năng đã triển khai

| Tính năng | Trang | API |
|-----------|-------|-----|
| Đăng ký | `/register` | ✅ |
| Đăng nhập | `/login` | ✅ |
| Trang cá nhân | `/profile` | ✅ |
| Đổi mật khẩu | `/profile` | ✅ |
| Quên mật khẩu | `/forgot-password` | ✅ |
| Đặt lại mật khẩu | `/reset-password` | ✅ |
| Dashboard | `/dashboard` | Mock |
| Khóa học | `/courses` | Mock |
| Luyện thi | `/exams` | Mock |
| Gia sư AI | `/ai-tutor` | Mock |
| Cài đặt | `/settings` | Mock |
| Thanh toán | `/payment` | Mock |

## Đội ngũ

**ThinkAI Team** — Đồ án môn học
