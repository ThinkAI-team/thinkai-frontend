# Frontend API Contract Matrix

Updated: 2026-03-22  
Scope: `thinkai-frontend/services/*` vs `thinkai-docs/API-docs/*`

## Sources

- [Auth_Profile_API.md](/home/binhminh/Developer/DA/thinkai-docs/API-docs/BinhMinh/Auth_Profile_API.md)
- [Course_Catalog_API.md](/home/binhminh/Developer/DA/thinkai-docs/API-docs/HoangMinh/Course_Catalog_API.md)
- [Learning_Room_Dashboard_API.md](/home/binhminh/Developer/DA/thinkai-docs/API-docs/AnhKhoa/Learning_Room_Dashboard_API.md)
- [Smart_Exam_API.md](/home/binhminh/Developer/DA/thinkai-docs/API-docs/MaiPhap/Smart_Exam_API.md)
- [AI_Tutor_API.md](/home/binhminh/Developer/DA/thinkai-docs/API-docs/ThuyTrang/AI_Tutor_API.md)
- [api_teacher.md](/home/binhminh/Developer/DA/thinkai-docs/API-docs/TrongNghia/api_teacher.md)
- [Admin_Panel_API.md](/home/binhminh/Developer/DA/thinkai-docs/API-docs/ThaiNguyen/Admin_Panel_API.md)

Status legend:

- `MATCH`: Endpoint/method khớp docs.
- `DRIFT`: Frontend và docs lệch contract.
- `UNDOCUMENTED`: Frontend dùng endpoint chưa có trong docs module.
- `DUPLICATE`: Trùng chức năng trong nhiều service function.

## Auth & Profile

| Frontend function | FE contract | Doc contract | Status | Note |
|---|---|---|---|---|
| `register` | `POST /auth/register` | `POST /auth/register` | `MATCH` | FE có gửi thêm `role?`; docs mô tả mặc định STUDENT. |
| `login` | `POST /auth/login` | `POST /auth/login` | `MATCH` | - |
| `googleLogin` | `POST /auth/google` | `POST /auth/google` | `MATCH` | - |
| `forgotPassword` | `POST /auth/forgot-password` | `POST /auth/forgot-password` | `MATCH` | - |
| `resetPassword` | `POST /auth/reset-password` | `POST /auth/reset-password` | `MATCH` | - |
| `getCurrentUser` | `GET /auth/me` | `GET /auth/me` | `MATCH` | - |
| `getProfile` | `GET /users/me` | `GET /users/me` | `MATCH` | - |
| `updateProfile` | `PUT /users/me` | `PUT /users/me` | `MATCH` | - |
| `updatePassword` | `PUT /users/me/password` | `PUT /users/me/password` | `MATCH` | - |
| `changePassword` | `PUT /users/me/password` | `PUT /users/me/password` | `DUPLICATE` | Trùng với `updatePassword`. |

## Course, Learning, Review, Dashboard

| Frontend function | FE contract | Doc contract | Status | Note |
|---|---|---|---|---|
| `getCourses` | `GET /courses` (+query) | `GET /courses` | `MATCH` | - |
| `getCourseDetail` | `GET /courses/{courseId}` | `GET /courses/{id}` | `MATCH` | Khác tên path variable, không ảnh hưởng contract. |
| `enrollCourse` | `POST /courses/{courseId}/enroll` | `POST /courses/{id}/enroll` | `MATCH` | - |
| `getMyCourses` | `GET /users/me/courses` | `GET /users/me/courses` | `MATCH` | - |
| `getDashboard` | `GET /users/me/dashboard` | `GET /users/me/dashboard` | `MATCH` | - |
| `getLearningRoomLayout` | `GET /courses/{courseId}/learn` | `GET /courses/{courseId}/learn` | `MATCH` | - |
| `getLessonDetail` | `GET /courses/lessons/{lessonId}` | `GET /courses/lessons/{lessonId}` | `MATCH` | - |
| `completeLesson` | `POST /courses/lessons/{lessonId}/complete` | `POST /courses/lessons/{lessonId}/complete` | `MATCH` | - |
| `getCourseReviews` | `GET /courses/{courseId}/reviews` | `GET /courses/{id}/reviews` | `MATCH` | - |
| `createCourseReview` | `POST /courses/{courseId}/reviews` | `POST /courses/{id}/reviews` | `MATCH` | - |

## Smart Exam

| Frontend function | FE contract | Doc contract | Status | Note |
|---|---|---|---|---|
| `getCourseExams` | `GET /exams/{courseId}/exams` | `GET /exams/{id}/exams` | `MATCH` | - |
| `startExam` | `POST /exams/{examId}/start` (+`userId?`) | `POST /exams/{id}/start` | `MATCH` | FE có hỗ trợ query `userId`, docs chưa nêu. |
| `submitExam` | `POST /exams/{examId}/submit` | `POST /exams/{id}/submit` | `MATCH` | - |
| `getExamHistory` | `GET /exams/history` (+`userId?`) | `GET /exams/history` | `MATCH` | FE có hỗ trợ query `userId`, docs chưa nêu. |
| `getExamResult` | `GET /exams/attempts/{attemptId}/result` | `GET /exams/results/{resultId}` | `DRIFT` | Endpoint kết quả trong docs không khớp FE hiện tại. |

## AI Tutor

| Frontend function | FE contract | Doc contract | Status | Note |
|---|---|---|---|---|
| `sendChatMessage` | `POST /ai-tutor/chat` | `POST /ai/chat` | `DRIFT` | FE dùng namespace `ai-tutor`. |
| `summarizeLesson` | `POST /ai-tutor/summarize` | `POST /ai/summarize` | `DRIFT` | FE dùng namespace `ai-tutor`. |
| `getChatHistory` | `GET /ai/chat/history` | `GET /ai/chat/history` | `MATCH` | - |
| `getChatDetail` | `GET /ai/chat/{id}` | `GET /ai/chat/{id}` | `MATCH` | - |
| `deleteChat` | `DELETE /ai/chat/{id}` | `DELETE /ai/chat/{id}` | `MATCH` | - |
| `getAISettings` | `GET /ai/settings` | `GET /ai/settings` | `MATCH` | - |
| `updateAISettings` | `PUT /ai/settings` | `PUT /ai/settings` | `DRIFT` | FE chỉ gửi `language`, `responseLength`; docs có thêm `communicationStyle`. |
| `sendMessageFeedback` | `POST /ai/chat/{messageId}/feedback` body `{rating}` | `POST /ai/chat/{messageId}/feedback` body `{feedbackType, comment?}` | `DRIFT` | Payload lệch format docs. |

## Teacher Portal

| Frontend function | FE contract | Doc contract | Status | Note |
|---|---|---|---|---|
| `getTeacherDashboard` | `GET /teacher/dashboard` | `GET /teacher/dashboard` | `MATCH` | - |
| `createTeacherCourse` | `POST /teacher/courses` | `POST /teacher/courses` | `MATCH` | - |
| `getTeacherCourses` | `GET /teacher/courses` (+paging) | `GET /teacher/courses` | `MATCH` | - |
| `getTeacherCourse` | `GET /teacher/courses/{id}` | `GET /teacher/courses/{id}` | `MATCH` | - |
| `updateTeacherCourse` | `PUT /teacher/courses/{id}` | `PUT /teacher/courses/{id}` | `MATCH` | - |
| `deleteTeacherCourse` | `DELETE /teacher/courses/{id}` | `DELETE /teacher/courses/{id}` | `MATCH` | - |
| `publishTeacherCourse` | `PUT /teacher/courses/{id}/publish` | `PUT /teacher/courses/{id}/publish` | `MATCH` | - |
| `createTeacherLesson` | `POST /teacher/courses/{courseId}/lessons` | `POST /teacher/courses/{courseId}/lessons` | `MATCH` | - |
| `uploadTeacherLessonFile` | `POST /teacher/courses/{courseId}/lessons/upload` (multipart) | `POST /teacher/courses/{courseId}/lessons/upload` | `MATCH` | - |
| `reorderTeacherLessons` | `PUT /teacher/courses/{courseId}/lessons/order` | `PUT /teacher/courses/{courseId}/lessons/order` | `MATCH` | - |
| `createTeacherQuestion` | `POST /teacher/questions` | `POST /teacher/questions` | `MATCH` | - |
| `importTeacherQuestions` | `POST /teacher/questions/import` (multipart) | `POST /teacher/questions/import` | `MATCH` | - |
| `getTeacherQuestionBank` | `GET /teacher/questions/bank` (+paging) | `GET /teacher/questions/bank` | `MATCH` | - |
| `getTeacherQuestionDetail` | `GET /teacher/questions/{id}` | `GET /teacher/questions/{id}` | `MATCH` | - |
| `createTeacherExam` | `POST /teacher/exams` | `POST /teacher/exams` | `MATCH` | - |
| `getTeacherExams` | `GET /teacher/exams` (+paging) | `GET /teacher/exams` | `MATCH` | - |

## Admin Panel

| Frontend function | FE contract | Doc contract | Status | Note |
|---|---|---|---|---|
| `getAdminDashboard` | `GET /admin/dashboard` | `GET /admin/dashboard` | `MATCH` | - |
| `getAdminUsers` | `GET /admin/users` (+query) | `GET /admin/users` | `MATCH` | - |
| `updateAdminUserStatus` | `PUT /admin/users/{userId}/status` | `PUT /admin/users/{userId}/status` | `MATCH` | - |
| `updateAIPrompts` | `PUT /admin/settings/ai-prompts` | `PUT /admin/settings/ai-prompts` | `MATCH` | - |
| `createAdminCourse` | `POST /admin/courses` | `POST /admin/courses` | `MATCH` | - |
| `updateAdminCourse` | `PUT /admin/courses/{courseId}` | `PUT /admin/courses/{courseId}` | `MATCH` | - |
| `deleteAdminCourse` | `DELETE /admin/courses/{courseId}` | `DELETE /admin/courses/{courseId}` | `MATCH` | - |
| `getAdminCourses` | `GET /admin/courses` (+query) | Không thấy trong Admin docs hiện tại | `UNDOCUMENTED` | FE đang dùng để render danh sách course trong Admin UI. |

## High-Risk Items To Resolve

1. Chuẩn hóa contract AI (`/ai-tutor/*` vs `/ai/*`) giữa docs và backend đang chạy.
2. Chuẩn hóa endpoint kết quả thi (`/exams/attempts/{attemptId}/result` vs `/exams/results/{resultId}`).
3. Chốt format payload feedback AI (`rating` số vs `feedbackType/comment`).
4. Bổ sung tài liệu Admin `GET /admin/courses` và query schema tương ứng.

## Local Backend Snapshot Check (Optional Cross-check)

Quick scan trên `thinkai-backend` local cho thấy:

- Smart Exam (`/exams/attempts/{attemptId}/result`) hiện khớp với FE.
- AI chat/summarize hiện ở `/ai-tutor/chat`, `/ai-tutor/summarize`; lịch sử/settings ở `/ai/chat/*`, `/ai/settings`.
- Module Admin trong local backend đang thấy endpoint `GET /admin/stats` (khác docs và FE).  
  Điểm này cần xác nhận backend branch/team đang dùng để test tích hợp.
