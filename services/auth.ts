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
  token: string;
  email: string;
  fullName: string;
  role: string;
  hasPassword?: boolean;
  isGoogleUser?: boolean;
  avatarUrl?: string;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const { role, ...payload } = data;
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  saveAuth(response);
  return response;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  saveAuth(response);
  return response;
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

  saveAuth(response);
  return response;
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
  
  // Cập nhật lại user trong localStorage nếu có thay đổi
  if (typeof window !== 'undefined') {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      localStorage.setItem('user', JSON.stringify({
        ...user,
        email: response.email,
        fullName: response.fullName,
        hasPassword: response.hasPassword,
        isGoogleUser: response.isGoogleUser,
      }));
    }
  }
  
  return response;
}

function saveAuth(response: AuthResponse): void {
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
