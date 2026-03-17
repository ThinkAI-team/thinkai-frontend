const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

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
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Attach JWT token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('thinkai_access_token');
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        status: response.status,
        error: response.statusText || 'Server Error',
        message: `Lỗi máy chủ (${response.status})`,
      };
    }
    throw new ApiException(errorData);
  }

  return response.json();
}
