import { apiRequest } from './api';

export interface DashboardEnrolledCourse {
  courseId: number;
  title: string;
  thumbnailUrl?: string;
  progressPercent: number;
  totalLessons: number;
  completedLessons: number;
  lastAccessedAt?: string;
}

export interface DashboardNextLesson {
  lessonId: number;
  lessonTitle: string;
  courseTitle: string;
  type: 'VIDEO' | 'PDF' | 'TEXT' | 'QUIZ';
}

export interface DashboardData {
  greeting: string;
  totalEnrolledCourses: number;
  averageProgress: number;
  enrolledCourses: DashboardEnrolledCourse[];
  nextLesson?: DashboardNextLesson | null;
}

export async function getDashboard(): Promise<DashboardData> {
  return apiRequest<DashboardData>('/users/me/dashboard');
}
