import apiClient, { handleApiError } from "./client";
import type { User, UserProfile, Achievement, ApiResponse } from "../types";

/**
 * Users API endpoints
 */
export const usersApi = {
  /**
   * Get user profile with achievements
   */
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response =
        await apiClient.get<ApiResponse<UserProfile>>("/api/users/profile");
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    try {
      const response = await apiClient.put<ApiResponse<User>>(
        "/api/users/profile",
        data,
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update password
   */
  updatePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> => {
    try {
      await apiClient.put("/api/users/password", data);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Upload avatar
   */
  uploadAvatar: async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await apiClient.post<ApiResponse<{ avatarUrl: string }>>(
        "/api/users/avatar",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      return response.data.data.avatarUrl;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get user achievements
   */
  getAchievements: async (): Promise<Achievement[]> => {
    try {
      const response = await apiClient.get<ApiResponse<Achievement[]>>(
        "/api/users/achievements",
      );
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Connect social account
   */
  connectSocialAccount: async (
    provider: "google" | "github",
  ): Promise<string> => {
    try {
      const response = await apiClient.post<
        ApiResponse<{ redirectUrl: string }>
      >(`/api/users/connect/${provider}`);
      return response.data.data.redirectUrl;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Disconnect social account
   */
  disconnectSocialAccount: async (
    provider: "google" | "github",
  ): Promise<void> => {
    try {
      await apiClient.delete(`/api/users/connect/${provider}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default usersApi;
