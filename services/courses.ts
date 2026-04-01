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
  thumbnailUrl?: string;
  instructorName?: string;
  price?: number;
  progressPercent: number;
  lessons: CourseLessonItem[];
  isEnrolled?: boolean;
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
  const payload = await apiRequest<
    CourseDetailResponse & {
      thumbnail?: string;
      instructor?: CourseInstructorSummary;
    }
  >(`/courses/${courseId}`);

  return {
    ...payload,
    thumbnailUrl: payload.thumbnailUrl || payload.thumbnail,
    instructorName: payload.instructorName || payload.instructor?.fullName,
    lessons: payload.lessons || [],
    isEnrolled: typeof payload.isEnrolled === 'boolean' ? payload.isEnrolled : false,
  };
}

export async function enrollCourse(courseId: number): Promise<EnrollmentResponse> {
  return apiRequest<EnrollmentResponse>(`/courses/${courseId}/enroll`, { method: 'POST' });
}

export async function unenrollCourse(courseId: number): Promise<void> {
  return apiRequest<void>(`/enrollments/${courseId}`, { method: 'DELETE' });
}

export async function getMyCourses(): Promise<MyCourseItem[]> {
  return apiRequest<MyCourseItem[]>('/users/me/courses');
}

export interface PaymentResponse {
  id: number;
  orderCode: number;
  userId: number;
  courseId: number;
  amount: number;
  status: string;
  paymentLinkId?: string;
  checkoutUrl?: string;
  qrCode?: string;
  description?: string;
  completedAt?: string;
  createdAt: string;
}

export async function createPaymentLink(courseId: number): Promise<PaymentResponse> {
  return apiRequest<PaymentResponse>('/api/v1/payments/create', {
    method: 'POST',
    body: JSON.stringify({ courseId }),
  } as RequestInit);
}

export async function getPaymentStatus(orderCode: number): Promise<PaymentResponse> {
  return apiRequest<PaymentResponse>(`/api/v1/payments/${orderCode}`);
}

// ===================== REVIEWS =====================

export interface ReviewResponse {
  id: number;
  courseId: number;
  userId: number;
  userName: string;
  rating: number;
  reviewText: string;
  createdAt: string;
}

export interface ReviewsData {
  reviews: ReviewResponse[];
  averageRating: number;
  totalReviews: number;
}

export async function getCourseReviews(courseId: number): Promise<ReviewsData> {
  return apiRequest<ReviewsData>(`/courses/${courseId}/reviews`);
}

export async function createReview(courseId: number, rating: number, reviewText: string): Promise<ReviewResponse> {
  return apiRequest<ReviewResponse>(`/courses/${courseId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, reviewText }),
  } as RequestInit);
}

export async function checkHasReviewed(courseId: number): Promise<{ hasReviewed: boolean }> {
  return apiRequest<{ hasReviewed: boolean }>(`/courses/${courseId}/reviews/check`);
}
