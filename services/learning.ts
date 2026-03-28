import { apiRequest } from './api';

export interface LearningRoomLesson {
  id: number;
  title: string;
  type: 'VIDEO' | 'PDF' | 'TEXT' | 'QUIZ';
  duration?: string;
  isCompleted?: boolean;
  orderIndex?: number;
}

export interface LearningRoomLayout {
  id: number;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  progressPercent: number;
  lessons: LearningRoomLesson[];
}

export interface LessonDetail {
  id: number;
  title: string;
  type: 'VIDEO' | 'PDF' | 'TEXT' | 'QUIZ';
  contentUrl?: string | null;
  contentText?: string | null;
  durationSeconds?: number;
  orderIndex?: number;
  isCompleted: boolean;
  watchTimeSeconds?: number;
  currentTimeSeconds?: number;
  lessonProgressPercent?: number;
  courseId: number;
  courseTitle?: string;
  previousLessonId?: number | null;
  nextLessonId?: number | null;
}

export interface CompleteLessonRequest {
  watchTimeSeconds?: number;
}

export interface CompleteLessonResponse {
  lessonId: number;
  isCompleted: boolean;
  courseProgress: number;
}

export async function getLearningRoomLayout(courseId: number): Promise<LearningRoomLayout> {
  return apiRequest<LearningRoomLayout>(`/courses/${courseId}/learn`);
}

export async function getLessonDetail(lessonId: number): Promise<LessonDetail> {
  return apiRequest<LessonDetail>(`/courses/lessons/${lessonId}`);
}

export async function completeLesson(
  lessonId: number,
  payload: CompleteLessonRequest = {}
): Promise<CompleteLessonResponse> {
  return apiRequest<CompleteLessonResponse>(`/courses/lessons/${lessonId}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// === Video Progress Tracking ===

export interface UpdateVideoProgressRequest {
  watchTimeSeconds: number;
  currentTimeSeconds?: number;
}

export interface UpdateVideoProgressResponse {
  lessonId: number;
  watchTimeSeconds: number;
  currentTimeSeconds: number;
  isCompleted: boolean;
  lessonProgressPercent: number;
  courseProgressPercent: number;
}

export async function updateVideoProgress(
  lessonId: number,
  payload: UpdateVideoProgressRequest
): Promise<UpdateVideoProgressResponse> {
  return apiRequest<UpdateVideoProgressResponse>(`/courses/lessons/${lessonId}/progress`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
