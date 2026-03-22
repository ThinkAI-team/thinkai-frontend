# ThinkAI Frontend

[![Status](https://img.shields.io/badge/status-active-22c55e)]()
[![Version](https://img.shields.io/badge/version-2.0-blue)]()
[![API](https://img.shields.io/badge/API%20Base-8081-f97316)]()

![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js)
![React](https://img.shields.io/badge/React-19-20232A?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![CSS Modules](https://img.shields.io/badge/CSS-Modules-1572B6?logo=css3)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)

> Frontend cho nền tảng học tập thông minh ThinkAI, phục vụ đồng thời học viên, giảng viên và quản trị viên trên cùng một hệ thống.

---

## Project Introduction

### Vision

ThinkAI Frontend được xây dựng để giảm ma sát trong toàn bộ hành trình học tập: học, luyện thi, quản lý nội dung, theo dõi tiến độ và tương tác với AI Tutor.

### User Roles

- Student: học khóa học, làm bài thi, theo dõi tiến độ, sử dụng AI Tutor.
- Teacher: quản lý khóa học, lesson, question bank, đề thi.
- Admin: quản lý users, courses, dashboard tổng quan và AI prompts.

---

## Core Features

### Student Workspace

- Dashboard học tập tại `/dashboard`
- Khóa học và phòng học tại `/courses`, `/learn/[lessonId]`
- Luyện thi tại `/exams`
- AI Tutor tại `/ai-tutor`
- Hồ sơ và cài đặt tại `/profile`, `/settings`

### Teacher Workspace

- Tổng quan tại `/teacher`
- Quản lý khóa học tại `/teacher/courses`
- Quản lý ngân hàng câu hỏi tại `/teacher/questions`
- Quản lý đề thi tại `/teacher/exams`

### Admin Workspace

- Tổng quan quản trị tại `/admin`
- Quản lý người dùng
- Quản lý khóa học
- Cấu hình AI prompts

---

## Technology Stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend Framework | Next.js 15 (App Router) | React 19, dynamic routes |
| Language | TypeScript | Strict typing |
| Styling | CSS Modules | Design tokens + shared UI |
| Data/API | Fetch wrapper (`services/api.ts`) | JWT header, unwrap data, normalize error |
| Runtime | Node.js 20+ | Local development & build |

---

## Project Structure

```txt
app/
  (auth)/                 # login/register/forgot/reset
  (main)/                 # student workspace
  teacher/                # teacher workspace
  admin/                  # admin workspace
  [slug]/                 # static info pages
  layout.tsx              # SSR theme bootstrap

components/
  layout/                 # Navbar, Footer
  ui/                     # Button, Card, PageState

services/
  api.ts
  auth.ts
  user.ts
  courses.ts
  reviews.ts
  learning.ts
  exams.ts
  ai-tutor.ts
  teacher.ts
  admin.ts

lib/
  types/
  utils/format.ts
```

Nguyên tắc: page/component chỉ gọi API qua `services/*`.

---

## API Integration

Trạng thái tích hợp API được theo dõi tại:

- [docs/API_CONTRACT_MATRIX.md](./docs/API_CONTRACT_MATRIX.md)

Tài liệu này mô tả `MATCH / DRIFT / UNDOCUMENTED` giữa frontend contract và API docs team.

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+

### Install

```bash
npm install
```

### Environment

Tạo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### Run

```bash
npm run dev
```

Frontend chạy tại `http://localhost:3000`.

---

## Available Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

---

## UI and Engineering Notes

- Toàn bộ action button dùng `components/ui/Button`
- Avatar dùng `next/image`
- Format ngày/tiền dùng `lib/utils/format.ts`
- Theme đồng bộ SSR/client qua cookie + localStorage
- A11y cơ bản cho tab/navigation (`aria-current`, `tablist`, `tabpanel`)

---

## Troubleshooting

### Hydration mismatch theme

- Theme đã được xử lý SSR-safe trong `app/layout.tsx`.
- Nếu còn warning: hard refresh, clear cache, thử Incognito.

### Cannot reach backend

Kiểm tra:

1. Backend đang chạy ở `:8081`
2. `NEXT_PUBLIC_API_URL` đúng
3. CORS backend cho phép origin frontend

---

## Quality Gate

Trước khi push/PR:

```bash
npm run lint
npm run build
```

Khuyến nghị bổ sung E2E smoke test cho các luồng role-based quan trọng.

---

## Team Workflow

Khi thay đổi API contract:

1. Cập nhật `services/*`
2. Rà soát các page bị ảnh hưởng
3. Cập nhật `docs/API_CONTRACT_MATRIX.md`
4. Chạy lại `lint + build`
