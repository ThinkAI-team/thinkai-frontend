import { apiRequest } from './api';

export interface CourseListQuery {
  page?: number;
  size?: number;
  keyword?: string;
  priceMin?: number;
  priceMax?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export interface CourseInstructorSummary {
  id: number;
  fullName: string;
  avatarUrl?: string;
}

export interface CourseListItem {
  id: number;
  title: string;
  thumbnail?: string;
  price: number;
  instructor: CourseInstructorSummary;
  lessonsCount: number;
  enrolledCount: number;
}

export interface CourseListResponse {
  content: CourseListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CourseLessonItem {
  id: number;
  title: string;
  type: 'VIDEO' | 'PDF' | 'TEXT' | 'QUIZ';
  duration?: string;
  isCompleted?: boolean;
  orderIndex?: number;
}

export interface CourseDetailResponse {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  price: number;
  instructor: CourseInstructorSummary;
  isEnrolled: boolean;
  progressPercent: number;
  lessons: CourseLessonItem[];
}

export interface EnrollmentResponse {
  enrollmentId: number;
  courseId: number;
  enrolledAt: string;
}

export interface MyCourseItem {
  id: number;
  title: string;
  thumbnail?: string;
  price: number;
  progressPercent: number;
  enrolledAt: string;
  nextLesson?: {
    id: number;
    title: string;
  } | null;
}

function buildCourseListQuery(query: CourseListQuery): string {
  const params = new URLSearchParams();
  if (typeof query.page === 'number') params.set('page', String(query.page));
  if (typeof query.size === 'number') params.set('size', String(query.size));
  if (query.keyword) params.set('keyword', query.keyword);
  if (typeof query.priceMin === 'number') params.set('priceMin', String(query.priceMin));
  if (typeof query.priceMax === 'number') params.set('priceMax', String(query.priceMax));
  if (query.sortBy) params.set('sortBy', query.sortBy);
  if (query.sortDir) params.set('sortDir', query.sortDir);

  const qs = params.toString();
  return qs ? `/courses?${qs}` : '/courses';
}

export async function getCourses(query: CourseListQuery = {}): Promise<CourseListResponse> {
  return apiRequest<CourseListResponse>(buildCourseListQuery(query));
}

export async function getCourseDetail(courseId: number): Promise<CourseDetailResponse> {
  return apiRequest<CourseDetailResponse>(`/courses/${courseId}`);
}

export async function enrollCourse(courseId: number): Promise<EnrollmentResponse> {
  return apiRequest<EnrollmentResponse>(`/courses/${courseId}/enroll`, { method: 'POST' });
}

export async function getMyCourses(): Promise<MyCourseItem[]> {
  return apiRequest<MyCourseItem[]>('/users/me/courses');
}
