import apiClient, { handleApiError } from "./client";
import type { Lesson, ApiResponse } from "../types";

interface LessonResource {
  id: number;
  title: string;
  type: "CODE" | "PDF" | "LINK";
  url: string;
}

interface LessonDetail extends Lesson {
  videoUrl?: string;
  content?: string;
  resources: LessonResource[];
}

/**
 * Lessons API endpoints
 */
export const lessonsApi = {
  /**
   * Get lesson detail
   */
  getLessonById: async (lessonId: number): Promise<LessonDetail> => {
    try {
      const response = await apiClient.get<ApiResponse<LessonDetail>>(
        `/api/lessons/${lessonId}`,
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Mark lesson as completed
   */
  completeLesson: async (lessonId: number): Promise<void> => {
    try {
      await apiClient.post(`/api/lessons/${lessonId}/complete`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get lesson resources
   */
  getLessonResources: async (lessonId: number): Promise<LessonResource[]> => {
    try {
      const response = await apiClient.get<ApiResponse<LessonResource[]>>(
        `/api/lessons/${lessonId}/resources`,
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update lesson progress (video position, etc.)
   */
  updateProgress: async (lessonId: number, progress: number): Promise<void> => {
    try {
      await apiClient.put(`/api/lessons/${lessonId}/progress`, { progress });
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default lessonsApi;
