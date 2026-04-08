  import { apiRequest, apiRequestFormData, normalizeMediaUrl } from './api';

export interface TeacherDashboardStats {
  totalCourses: number;
  totalStudents: number;
  completedStudents: number;
  completionRate: number;
}

export interface TeacherCourse {
  id: number;
  title: string;
  description?: string;
  thumbnailUrl?: string | null;
  price: number;
  instructorId?: number;
  isPublished?: boolean;
  status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt?: string;
  updatedAt?: string;
}

export interface TeacherCourseRequest {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  price: number;
}

export interface TeacherCoursePage {
  content: TeacherCourse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface LessonRequest {
  title: string;
  type: 'VIDEO' | 'PDF' | 'QUIZ';
  contentUrl?: string;
  contentText?: string;
  durationSeconds?: number;
  orderIndex?: number;
}

export interface LessonOrderUpdate {
  lessonId: number;
  orderIndex: number;
}

export interface QuestionBankRequest {
  examType: string;
  section: string;
  part: string;
  content: string;
  options?: string;
  correctAnswer: string;
  explanation?: string;
  audioUrl?: string;
  imageUrl?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags?: string[];
}

export interface ExamRequest {
  courseId: number;
  title: string;
  examType?: string;
  description?: string;
  timeLimitMinutes: number;
  passingScore: number;
  isRandomOrder?: boolean;
  partConfig?: Record<string, number>;
}

export interface TeacherQuestionBank {
  id: number;
  examType?: string;
  section?: string;
  part?: string;
  content: string;
  correctAnswer?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  tags?: string[];
}

export interface TeacherExam {
  id: number;
  courseId: number;
  title: string;
  examType?: string;
  description?: string;
  timeLimitMinutes?: number;
  passingScore?: number;
  isRandomOrder?: boolean;
}

function buildPageQuery(basePath: string, page = 0, size = 10): string {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return `${basePath}?${params.toString()}`;
}

export async function getTeacherDashboard(): Promise<TeacherDashboardStats> {
  return apiRequest<TeacherDashboardStats>('/teacher/dashboard');
}

export async function createTeacherCourse(payload: TeacherCourseRequest): Promise<TeacherCourse> {
  const course = await apiRequest<TeacherCourse>('/teacher/courses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return {
    ...course,
    thumbnailUrl: normalizeMediaUrl(course.thumbnailUrl),
  };
}

export async function getTeacherCourses(page = 0, size = 10): Promise<TeacherCoursePage> {
  const payload = await apiRequest<TeacherCoursePage>(buildPageQuery('/teacher/courses', page, size));
  return {
    ...payload,
    content: payload.content.map((course) => ({
      ...course,
      thumbnailUrl: normalizeMediaUrl(course.thumbnailUrl),
    })),
  };
}

export async function getTeacherCourse(courseId: number): Promise<TeacherCourse> {
  const course = await apiRequest<TeacherCourse>(`/teacher/courses/${courseId}`);
  return {
    ...course,
    thumbnailUrl: normalizeMediaUrl(course.thumbnailUrl),
  };
}

export async function updateTeacherCourse(courseId: number, payload: TeacherCourseRequest): Promise<TeacherCourse> {
  const course = await apiRequest<TeacherCourse>(`/teacher/courses/${courseId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return {
    ...course,
    thumbnailUrl: normalizeMediaUrl(course.thumbnailUrl),
  };
}

export async function deleteTeacherCourse(courseId: number): Promise<void> {
  return apiRequest<void>(`/teacher/courses/${courseId}`, {
    method: 'DELETE',
  });
}

export async function publishTeacherCourse(courseId: number): Promise<TeacherCourse> {
  return apiRequest<TeacherCourse>(`/teacher/courses/${courseId}/publish`, {
    method: 'PUT',
  });
}

export async function createTeacherLesson(courseId: number, payload: LessonRequest): Promise<unknown> {
  return apiRequest<unknown>(`/teacher/courses/${courseId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadTeacherLessonFile(courseId: number, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const payload = await apiRequestFormData<{ url: string }>(
    `/teacher/courses/${courseId}/lessons/upload`,
    formData,
    { method: 'POST' }
  );
  return {
    url: normalizeMediaUrl(payload.url) || payload.url,
  };
}

export async function uploadTeacherCourseThumbnail(courseId: number, file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const payload = await apiRequestFormData<{ url: string }>(
    `/teacher/courses/${courseId}/thumbnail`,
    formData,
    { method: 'POST' }
  );
  return {
    url: normalizeMediaUrl(payload.url) || payload.url,
  };
}

export async function reorderTeacherLessons(
  courseId: number,
  lessonOrders: LessonOrderUpdate[]
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`/teacher/courses/${courseId}/lessons/order`, {
    method: 'PUT',
    body: JSON.stringify({ lessonOrders }),
  });
}

export async function createTeacherQuestion(payload: QuestionBankRequest): Promise<unknown> {
  return apiRequest<TeacherQuestionBank>('/teacher/questions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function importTeacherQuestions(file: File): Promise<{ message: string; count: number }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiRequestFormData<{ message: string; count: number }>(
    '/teacher/questions/import',
    formData,
    { method: 'POST' }
  );
}

export async function getTeacherQuestionBank(page = 0, size = 10): Promise<{
  content: TeacherQuestionBank[];
  totalElements: number;
  totalPages: number;
}> {
  return apiRequest<{
    content: TeacherQuestionBank[];
    totalElements: number;
    totalPages: number;
  }>(buildPageQuery('/teacher/questions/bank', page, size));
}

export async function getTeacherQuestionDetail(questionId: number): Promise<TeacherQuestionBank> {
  return apiRequest<TeacherQuestionBank>(`/teacher/questions/${questionId}`);
}

export async function createTeacherExam(payload: ExamRequest): Promise<TeacherExam> {
  return apiRequest<TeacherExam>('/teacher/exams', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getTeacherExams(page = 0, size = 10): Promise<{
  content: TeacherExam[];
  totalElements: number;
  totalPages: number;
}> {
  return apiRequest<{
    content: TeacherExam[];
    totalElements: number;
    totalPages: number;
  }>(buildPageQuery('/teacher/exams', page, size));
}
