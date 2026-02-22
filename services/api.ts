const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface ApiError {
  status: number;
  error: string;
  message?: string;
  errors?: Record<string, string>;
  timestamp?: string;
}

export class ApiException extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(data: ApiError) {
    super(data.message || data.error);
    this.status = data.status;
    this.fieldErrors = data.errors;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Attach JWT token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new ApiException(errorData);
  }

  return response.json();
}
