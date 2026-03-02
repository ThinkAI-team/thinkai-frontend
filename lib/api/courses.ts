import apiClient, { handleApiError } from "./client";
import type {
  Course,
  CourseDetail,
  PaginatedResponse,
  ApiResponse,
} from "../types";

interface CoursesQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  search?: string;
  sortBy?: "popular" | "newest" | "rating" | "price";
}

/**
 * Courses API endpoints
 */
export const coursesApi = {
  /**
   * Get paginated list of courses
   */
  getCourses: async (
    query: CoursesQuery = {},
  ): Promise<PaginatedResponse<Course>> => {
    try {
      const response = await apiClient.get<
        ApiResponse<PaginatedResponse<Course>>
      >("/api/courses", {
        params: query,
      });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get course detail by ID
   */
  getCourseById: async (id: number): Promise<CourseDetail> => {
    try {
      const response = await apiClient.get<ApiResponse<CourseDetail>>(
        `/api/courses/${id}`,
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get featured/popular courses
   */
  getFeaturedCourses: async (): Promise<Course[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Course[]>>(
        "/api/courses/featured",
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Enroll in a course
   */
  enrollCourse: async (courseId: number): Promise<void> => {
    try {
      await apiClient.post(`/api/courses/${courseId}/enroll`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get enrolled courses for current user
   */
  getEnrolledCourses: async (): Promise<Course[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Course[]>>(
        "/api/courses/enrolled",
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get course progress
   */
  getCourseProgress: async (
    courseId: number,
  ): Promise<{
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  }> => {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          completedLessons: number;
          totalLessons: number;
          percentage: number;
        }>
      >(`/api/courses/${courseId}/progress`);
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get course categories
   */
  getCategories: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get<ApiResponse<string[]>>(
        "/api/courses/categories",
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default coursesApi;
