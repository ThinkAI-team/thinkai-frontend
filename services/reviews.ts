import { apiRequest } from './api';

export interface CourseReview {
  id: number;
  courseId: number;
  userId: number;
  userName?: string;
  rating: number;
  reviewText: string;
  createdAt?: string;
}

export interface CreateCourseReviewRequest {
  rating: number;
  reviewText: string;
}

interface ReviewsApiResponse {
  reviews: CourseReview[];
  averageRating: number;
  totalReviews: number;
}

export async function getCourseReviews(courseId: number): Promise<CourseReview[]> {
  const data = await apiRequest<ReviewsApiResponse>(`/courses/${courseId}/reviews`);
  return data.reviews || [];
}

export async function createCourseReview(
  courseId: number,
  payload: CreateCourseReviewRequest
): Promise<CourseReview> {
  return apiRequest<CourseReview>(`/courses/${courseId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
