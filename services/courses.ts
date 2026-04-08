import { ApiException, apiRequest, normalizeMediaUrl } from './api';

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
  const payload = await apiRequest<CourseListResponse>(buildCourseListQuery(query));
  return {
    ...payload,
    content: payload.content.map((course) => ({
      ...course,
      thumbnail: normalizeMediaUrl(course.thumbnail),
    })),
  };
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
    thumbnailUrl: normalizeMediaUrl(payload.thumbnailUrl || payload.thumbnail),
    instructorName: payload.instructorName || payload.instructor?.fullName,
    lessons: payload.lessons || [],
    isEnrolled: typeof payload.isEnrolled === 'boolean' ? payload.isEnrolled : false,
  };
}

export async function enrollCourse(courseId: number): Promise<EnrollmentResponse> {
  return apiRequest<EnrollmentResponse>(`/courses/${courseId}/enroll`, { method: 'POST' });
}

export async function unenrollCourse(courseId: number): Promise<void> {
  await requestCartWithFallback<void>(
    [
      `/enrollments/${courseId}`,
      `/api/enrollments/${courseId}`,
      `/courses/${courseId}/enroll`,
      `/api/courses/${courseId}/enroll`,
    ],
    { method: 'DELETE' }
  );
}

export async function getMyCourses(): Promise<MyCourseItem[]> {
  const payload = await apiRequest<MyCourseItem[]>('/users/me/courses');
  return payload.map((course) => ({
    ...course,
    thumbnail: normalizeMediaUrl(course.thumbnail),
  }));
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

// ===================== CART =====================

export interface CartItem {
  id: number;
  courseId: number;
  courseTitle: string;
  thumbnailUrl: string;
  instructorName: string;
  price: number;
  addedAt: string;
}

export interface CartResponse {
  id: number;
  userId: number;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
}

function shouldFallbackEndpoint(error: unknown): boolean {
  if (!(error instanceof ApiException)) return false;
  const message = (error.message || '').toLowerCase();
  return (
    error.status === 404 ||
    error.status === 405 ||
    message.includes('no static resource') ||
    message.includes('method') && message.includes('not supported')
  );
}

function normalizeCart(payload: CartResponse): CartResponse {
  return {
    ...payload,
    items: (payload.items || []).map((item) => ({
      ...item,
      thumbnailUrl: normalizeMediaUrl(item.thumbnailUrl) || '',
    })),
  };
}

async function requestCartWithFallback<T>(
  candidates: string[],
  options: RequestInit
): Promise<T> {
  let lastError: unknown = null;
  for (let i = 0; i < candidates.length; i += 1) {
    const endpoint = candidates[i];
    try {
      return await apiRequest<T>(endpoint, options);
    } catch (error) {
      lastError = error;
      const canRetry = shouldFallbackEndpoint(error);
      const hasNext = i < candidates.length - 1;
      if (!canRetry || !hasNext) {
        throw error;
      }
    }
  }
  throw lastError;
}

export async function getCart(): Promise<CartResponse> {
  const payload = await requestCartWithFallback<CartResponse>(
    ['/api/v1/cart', '/v1/cart', '/cart', '/api/cart', '/api/api/v1/cart'],
    { method: 'GET', cache: 'no-store' }
  );
  return normalizeCart(payload);
}

export async function addToCart(courseId: number): Promise<CartResponse> {
  const payload = await requestCartWithFallback<CartResponse>(
    [
      '/api/v1/cart/items',
      '/v1/cart/items',
      '/cart/items',
      '/api/cart/items',
      '/api/api/v1/cart/items',
    ],
    { method: 'POST', body: JSON.stringify({ courseId }) } as RequestInit
  );
  return normalizeCart(payload);
}

export async function removeFromCart(courseId: number): Promise<CartResponse> {
  const payload = await requestCartWithFallback<CartResponse>(
    [
      `/api/v1/cart/items/${courseId}`,
      `/v1/cart/items/${courseId}`,
      `/cart/items/${courseId}`,
      `/api/cart/items/${courseId}`,
      `/api/api/v1/cart/items/${courseId}`,
    ],
    { method: 'DELETE' } as RequestInit
  );
  return normalizeCart(payload);
}

export async function clearCart(): Promise<void> {
  await requestCartWithFallback<void>(
    ['/api/v1/cart', '/v1/cart', '/cart', '/api/cart', '/api/api/v1/cart'],
    { method: 'DELETE' } as RequestInit
  );
}
