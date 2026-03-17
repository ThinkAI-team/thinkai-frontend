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
        await apiClient.get<UserProfile>("/users/me");
      // Dùng authController backend, có thể trả trực tiếp ProfileResponse (KHÔNG bọc ApiResponse)
      // Wait, the backend returns direct body or mapped body. `ResponseEntity.ok(profile)` -> `response.data` is the object.
      // So no `.data.data` here. just return response.data
      return (response.data as any).data || response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    try {
      const response = await apiClient.put<User>(
        "/users/me",
        data,
      );
      return (response.data as any).data || response.data;
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
      await apiClient.put("/users/me/password", data); // UserController PUT /me/password
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

      const response = await apiClient.post<any>(
        "/users/avatar",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      return response.data.avatarUrl;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Get user achievements
   */
  getAchievements: async (): Promise<Achievement[]> => {
    try {
      const response = await apiClient.get<any>(
        "/users/achievements",
      );
      return response.data;
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
      const response = await apiClient.post<any>(`/users/connect/${provider}`);
      return response.data.redirectUrl;
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
      await apiClient.delete(`/users/connect/${provider}`);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default usersApi;
