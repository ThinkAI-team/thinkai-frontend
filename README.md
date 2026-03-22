# ThinkAI Frontend

ThinkAI Frontend là giao diện web cho nền tảng học tập thông minh, nơi **học viên**, **giảng viên** và **quản trị viên** làm việc trên cùng một hệ thống nhưng theo các luồng riêng biệt, rõ ràng.

Mục tiêu của dự án:

- Giảm ma sát khi học và quản lý nội dung học tập
- Đồng bộ dữ liệu theo thời gian thực với backend API
- Giữ trải nghiệm UI nhất quán theo phong cách Zen hiện đại

## Tính năng nổi bật

### Student Workspace

- Theo dõi tiến độ học tập tại `/dashboard`
- Khám phá khóa học, đăng ký, vào phòng học `learn/[lessonId]`
- Làm bài thi thông minh và xem kết quả
- Sử dụng AI Tutor để hỏi đáp và tóm tắt nội dung học
- Quản lý hồ sơ, bảo mật, cấu hình trải nghiệm trong `settings`

### Teacher Workspace

- Dashboard giảng dạy riêng tại `/teacher`
- Quản lý khóa học, bài học, upload tài nguyên
- Quản lý question bank và import CSV
- Tạo đề thi theo cấu hình thực tế

### Admin Workspace

- Theo dõi thống kê hệ thống
- Quản lý người dùng và trạng thái tài khoản
- Quản lý khóa học toàn hệ thống
- Cấu hình AI prompts

## Công nghệ sử dụng

- **Next.js 15 (App Router)**
- **React 19 + TypeScript**
- **CSS Modules**
- **Service layer API-first** (`services/*`)
- **Theme SSR-safe** (cookie + localStorage + `html[data-theme]`)

## Kiến trúc frontend

```txt
app/
  (auth)/                 # login/register/forgot/reset
  (main)/                 # student workspace
  teacher/                # teacher workspace
  admin/                  # admin workspace
  [slug]/                 # static info pages (about/blog/contact/...)
  layout.tsx              # root layout + theme bootstrap

components/
  layout/                 # Navbar, Footer
  ui/                     # Button, Card, PageState

services/
  api.ts                  # fetch wrapper + JWT + error normalize
  auth.ts user.ts courses.ts reviews.ts learning.ts
  exams.ts ai-tutor.ts teacher.ts admin.ts

lib/
  types/
  utils/format.ts         # format date/currency dùng chung
```

Nguyên tắc quan trọng: page/component **không gọi API trực tiếp**, chỉ đi qua `services/*`.

## Trạng thái tích hợp API

Dự án đang dùng API thật cho các luồng chính.  
Ma trận đối chiếu contract chi tiết:

- [docs/API_CONTRACT_MATRIX.md](./docs/API_CONTRACT_MATRIX.md)

## Bắt đầu nhanh

### 1) Yêu cầu môi trường

- Node.js 20+
- npm 10+

### 2) Cài đặt

```bash
npm install
```

### 3) Tạo file môi trường

`.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### 4) Chạy local

```bash
npm run dev
```

Mặc định frontend chạy tại: `http://localhost:3000`

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Quy ước UI/UX hiện tại

- Action buttons thống nhất qua `components/ui/Button`
- Avatar dùng `next/image`
- Date/currency format thống nhất qua `lib/utils/format.ts`
- Accessibility cơ bản cho tab/list/active state (`aria-current`, `role=tablist/tab/tabpanel`, `aria-checked`)

## Troubleshooting nhanh

### 1) Lỗi hydration mismatch theme

- Theme đã được đồng bộ SSR/client trong `app/layout.tsx`.
- Nếu còn cảnh báo: clear cache, hard refresh, thử Incognito để loại trừ browser extension.

### 2) Frontend không gọi được backend

Kiểm tra:

1. Backend chạy đúng `:8081`
2. `NEXT_PUBLIC_API_URL` đúng môi trường
3. CORS backend cho phép origin frontend

## Chất lượng code

- Gate hiện tại: `npm run lint` + `npm run build`
- Khuyến nghị bổ sung E2E smoke test cho:
  - Auth + role redirect
  - Teacher create course/question/exam
  - Student học khóa học và làm bài thi
  - Admin quản lý user/course

## Team workflow gợi ý

Khi có thay đổi contract backend:

1. Cập nhật `services/*`
2. Rà soát UI affected pages
3. Cập nhật `docs/API_CONTRACT_MATRIX.md`
4. Chạy lại `lint + build` trước khi tạo PR
