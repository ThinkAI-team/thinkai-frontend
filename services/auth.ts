import { apiRequest } from './api';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface AuthResponse {
  token?: string;
  email: string;
  fullName: string;
  role: string;
  hasPassword?: boolean;
  isGoogleUser?: boolean;
  avatarUrl?: string;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const normalized = normalizeAuthResponse(response);
  if (normalized.token) {
    saveAuth(normalized);
  }
  return normalized;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const normalized = normalizeAuthResponse(response);
  saveAuth(normalized);
  return normalized;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('thinkai_access_token');
    localStorage.removeItem('thinkai_refresh_token');
    localStorage.removeItem('user');
  }
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  token: string,
  newPassword: string,
  confirmPassword: string
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  });
}

export async function googleLogin(idToken: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
  const normalized = normalizeAuthResponse(response);
  saveAuth(normalized);
  return normalized;
}

export async function updatePassword(
  currentPassword: string | null,
  newPassword: string,
  confirmPassword: string
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify({
      currentPassword: currentPassword || '',
      newPassword,
      confirmNewPassword: confirmPassword,
    }),
  });
}

export async function getCurrentUser(): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/me', {
    method: 'GET',
  });
  const normalized = normalizeAuthResponse(response);
  
  // Cập nhật lại user trong localStorage nếu có thay đổi
  if (typeof window !== 'undefined') {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      localStorage.setItem('user', JSON.stringify({
        ...user,
        email: normalized.email,
        fullName: normalized.fullName,
        role: normalized.role,
        hasPassword: normalized.hasPassword,
        isGoogleUser: normalized.isGoogleUser,
        avatarUrl: normalized.avatarUrl,
      }));
    }
  }
  
  return normalized;
}

function saveAuth(response: AuthResponse): void {
  if (!response.token) return;
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', response.token);
    localStorage.setItem('thinkai_access_token', response.token);
    localStorage.setItem('user', JSON.stringify({
      email: response.email,
      fullName: response.fullName,
      role: response.role,
      hasPassword: response.hasPassword,
      isGoogleUser: response.isGoogleUser,
      avatarUrl: response.avatarUrl,
    }));
  }
}

function normalizeRole(role?: string): string {
  if (!role) return 'STUDENT';
  const cleanRole = role.replace(/^ROLE_/, '').toUpperCase();
  if (cleanRole === 'ADMIN' || cleanRole === 'TEACHER' || cleanRole === 'STUDENT') {
    return cleanRole;
  }
  return 'STUDENT';
}

function normalizeAuthResponse(response: AuthResponse): AuthResponse {
  return {
    ...response,
    role: normalizeRole(response.role),
  };
}
