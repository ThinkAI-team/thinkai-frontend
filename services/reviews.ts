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

export async function getCourseReviews(courseId: number): Promise<CourseReview[]> {
  return apiRequest<CourseReview[]>(`/courses/${courseId}/reviews`);
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
