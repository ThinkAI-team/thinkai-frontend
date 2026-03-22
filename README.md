# ThinkAI Frontend

Frontend cho nền tảng ThinkAI (Student, Teacher, Admin) xây dựng bằng Next.js App Router.

Tài liệu này phản ánh trạng thái hiện tại của codebase trong thư mục `thinkai-frontend`.

## 1) Tổng quan

- Framework: Next.js 15 + React 19 + TypeScript
- Giao diện: CSS Modules + shared UI components
- API layer: `services/*` dùng `services/api.ts` (fetch wrapper, auth header, error normalize)
- Theme: `light/dark` đồng bộ qua `cookie + localStorage + html[data-theme]`
- Mục tiêu: tách rõ luồng Student / Teacher / Admin nhưng giữ chung trải nghiệm UI

## 2) Trạng thái tích hợp API

Frontend đã chuyển sang luồng API thật cho các module chính.  
Ma trận đối chiếu contract chi tiết nằm ở:

- [docs/API_CONTRACT_MATRIX.md](./docs/API_CONTRACT_MATRIX.md)

Tóm tắt nhanh:

- Auth/Profile: phần lớn `MATCH`
- Course/Learning/Review/Dashboard: `MATCH`
- Teacher Portal: gần như `MATCH`
- Admin Panel: đa số `MATCH`, có điểm `UNDOCUMENTED` ở `GET /admin/courses`
- Smart Exam & AI Tutor: còn một số `DRIFT` cần chốt với backend/docs

## 3) Luồng theo vai trò

- Student: `/dashboard`, `/courses`, `/learn/[lessonId]`, `/exams`, `/ai-tutor`, `/profile`, `/settings`, `/payment`
- Teacher: `/teacher`, `/teacher/courses`, `/teacher/questions`, `/teacher/exams`
- Admin: `/admin`
- Marketing/info pages: dynamic route `/[slug]` (about, blog, contact, faq, privacy, terms, help, calendar)

## 4) Cấu trúc dự án

```txt
app/
  (auth)/
  (main)/
    components/
  teacher/
    components/
  admin/
  [slug]/
  layout.tsx
  page.tsx

components/
  layout/
  ui/

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
  utils/
```

Rule chính: page/component không gọi `fetch` trực tiếp tới backend, chỉ gọi qua `services/*`.

## 5) Cài đặt & chạy local

Yêu cầu:

- Node.js 20+
- npm 10+

Chạy dự án:

```bash
npm install
npm run dev
```

Frontend mặc định chạy tại `http://localhost:3000`.

## 6) Environment variables

Tạo file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

Ghi chú:

- Nếu thiếu `NEXT_PUBLIC_API_URL`, frontend fallback về `http://localhost:8081`.
- Google Sign-In cần `NEXT_PUBLIC_GOOGLE_CLIENT_ID` hợp lệ.

## 7) Scripts

```bash
npm run dev    # chạy local
npm run lint   # eslint
npm run build  # build production
npm run start  # chạy build production
```

## 8) Quy ước UI/UX hiện tại

- Dùng `components/ui/Button` cho toàn bộ action button
- Avatar chuyển sang `next/image`
- Date/currency format dùng utility chung: `lib/utils/format.ts`
- Tab/list quan trọng có `aria-*` cơ bản (`aria-current`, `role=tablist/tab/tabpanel`, `aria-checked`)

## 9) Troubleshooting nhanh

### Hydration mismatch với theme

Đã xử lý bằng cơ chế SSR theme từ cookie trong `app/layout.tsx`.  
Nếu vẫn gặp mismatch:

1. Xóa cache browser
2. Hard refresh
3. Thử lại ở cửa sổ ẩn danh để loại trừ extension can thiệp DOM

### Không gọi được backend

Kiểm tra:

1. Backend đang chạy ở `:8081`
2. `NEXT_PUBLIC_API_URL` đúng
3. CORS backend cho phép origin frontend

## 10) Chất lượng & kiểm thử

- Đã dùng `lint + build` làm gate chính trước khi merge
- Chưa có bộ test tự động đầy đủ (unit/e2e) trong repo
- Khuyến nghị thêm e2e smoke cho các luồng:
  - Login/Register theo role
  - Teacher tạo course/question/exam
  - Student xem course/làm exam
  - Admin quản lý users/courses

## 11) Team note

Khi update API contract:

1. Sửa service trong `services/*`
2. Cập nhật `docs/API_CONTRACT_MATRIX.md`
3. Chạy lại `lint + build`
