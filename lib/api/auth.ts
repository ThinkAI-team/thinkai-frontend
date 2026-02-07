import apiClient, { tokenHelpers, handleApiError } from "./client";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  ApiResponse,
} from "../types";

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        "/api/auth/login",
        data,
      );
      const { accessToken, refreshToken, user } = response.data.data;

      // Save tokens
      tokenHelpers.setTokens(accessToken, refreshToken);

      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        "/api/auth/register",
        data,
      );
      const { accessToken, refreshToken } = response.data.data;

      // Save tokens
      tokenHelpers.setTokens(accessToken, refreshToken);

      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Logout - clear tokens
   */
  logout: async (): Promise<void> => {
    try {
      await apiClient.post("/api/auth/logout");
    } catch (error) {
      // Ignore logout errors
    } finally {
      tokenHelpers.clearTokens();
    }
  },

  /**
   * Get current authenticated user
   */
  getMe: async (): Promise<User> => {
    try {
      const response = await apiClient.get<ApiResponse<User>>("/api/auth/me");
      return response.data.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!tokenHelpers.getAccessToken();
  },
};

export default authApi;
