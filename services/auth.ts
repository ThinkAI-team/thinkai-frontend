import { apiRequest } from './api';

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: string;
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
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
    localStorage.removeItem('user');
  }
}

function saveAuth(response: AuthResponse): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify({
      email: response.email,
      fullName: response.fullName,
      role: response.role,
    }));
  }
}

