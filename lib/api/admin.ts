import apiClient, { handleApiError } from './client';
import type { 
  AdminStats,
  AdminUser,
  Course,
  PaginatedResponse,
  ApiResponse 
} from '../types';

interface AdminUserQuery {
  page?: number;
  pageSize?: number;
  role?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  status?: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  search?: string;
}

interface AdminCourseQuery {
  page?: number;
  pageSize?: number;
  status?: 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';
  search?: string;
}

/**
 * Admin API endpoints
 */
export const adminApi = {
  /**
   * Get dashboard stats
   */
  getStats: async (): Promise<AdminStats> => {
    try {
      const response = await apiClient.get<ApiResponse<AdminStats>>('/api/admin/stats');
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get users with filters
   */
  getUsers: async (query: AdminUserQuery = {}): Promise<PaginatedResponse<AdminUser>> => {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<AdminUser>>>(
        '/api/admin/users',
        { params: query }
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update user status
   */
  updateUserStatus: async (userId: number, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => {
    try {
      await apiClient.put(`/api/admin/users/${userId}/status`, { status });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update user role
   */
  updateUserRole: async (userId: number, role: 'STUDENT' | 'TEACHER' | 'ADMIN'): Promise<void> => {
    try {
      await apiClient.put(`/api/admin/users/${userId}/role`, { role });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get courses for admin
   */
  getCourses: async (query: AdminCourseQuery = {}): Promise<PaginatedResponse<Course>> => {
    try {
      const response = await apiClient.get<ApiResponse<PaginatedResponse<Course>>>(
        '/api/admin/courses',
        { params: query }
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Approve/Reject course
   */
  reviewCourse: async (courseId: number, action: 'approve' | 'reject'): Promise<void> => {
    try {
      await apiClient.post(`/api/admin/courses/${courseId}/review`, { action });
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get revenue reports
   */
  getRevenueReport: async (period: 'day' | 'week' | 'month' | 'year'): Promise<{
    labels: string[];
    data: number[];
    total: number;
  }> => {
    try {
      const response = await apiClient.get<ApiResponse<{
        labels: string[];
        data: number[];
        total: number;
      }>>('/api/admin/reports/revenue', { params: { period } });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get user growth report
   */
  getUserGrowthReport: async (period: 'day' | 'week' | 'month' | 'year'): Promise<{
    labels: string[];
    data: number[];
    total: number;
  }> => {
    try {
      const response = await apiClient.get<ApiResponse<{
        labels: string[];
        data: number[];
        total: number;
      }>>('/api/admin/reports/users', { params: { period } });
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Export report as CSV
   */
  exportReport: async (type: 'users' | 'courses' | 'revenue'): Promise<Blob> => {
    try {
      const response = await apiClient.get(`/api/admin/reports/export/${type}`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default adminApi;
