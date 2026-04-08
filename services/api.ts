const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:8081';
  }
})();
const AUTH_ENDPOINTS_NO_REDIRECT = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/google',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

interface ApiError {
  status: number;
  error?: string;
  message?: string;
  errors?: Record<string, string>;
  timestamp?: string;
}

export class ApiException extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(data: ApiError) {
    super(data.message || data.error || 'Lỗi không xác định');
    this.status = data.status;
    this.fieldErrors = data.errors;
  }
}

interface ApiWrapper<T> {
  status?: number;
  message?: string;
  data?: T;
}

function normalizeFieldErrors(
  errors?: Record<string, string | string[]>
): Record<string, string> | undefined {
  if (!errors) return undefined;
  const result: Record<string, string> = {};
  Object.entries(errors).forEach(([key, value]) => {
    result[key] = Array.isArray(value) ? value[0] || '' : value;
  });
  return result;
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const wrapper = payload as ApiWrapper<T>;
    if ('data' in wrapper && (typeof wrapper.status === 'number' || typeof wrapper.message === 'string')) {
      return wrapper.data as T;
    }
  }
  return payload as T;
}

function buildHeaders(
  incomingHeaders: HeadersInit | undefined,
  contentType?: string
): Headers {
  const headers = new Headers(incomingHeaders);
  if (contentType && !headers.has('Content-Type')) {
    headers.set('Content-Type', contentType);
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('thinkai_access_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return headers;
}

async function parseApiError(response: Response): Promise<ApiError> {
  try {
    const payload = await response.json();
    const normalized = payload as ApiError & {
      data?: { message?: string };
      errors?: Record<string, string | string[]>;
    };
    return {
      status: normalized.status || response.status,
      error: normalized.error || response.statusText || 'Server Error',
      message: normalized.message || normalized.data?.message,
      errors: normalizeFieldErrors(normalized.errors),
      timestamp: normalized.timestamp,
    };
  } catch {
    return {
      status: response.status,
      error: response.statusText || 'Server Error',
      message: `Lỗi máy chủ (${response.status})`,
    };
  }
}

async function parseApiSuccess<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  const payload = await response.json();
  return unwrapData<T>(payload);
}

async function requestCore<T>(
  endpoint: string,
  options: RequestInit,
  contentType?: string
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: buildHeaders(options.headers, contentType),
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    const errorData = await parseApiError(response);
    if (errorData.status === 401) {
      redirectToLoginIfNeeded(endpoint);
    }
    throw new ApiException(errorData);
  }

  return parseApiSuccess<T>(response);
}

function redirectToLoginIfNeeded(endpoint: string): void {
  if (typeof window === 'undefined') return;
  if (AUTH_ENDPOINTS_NO_REDIRECT.has(endpoint)) return;

  const currentPath = window.location.pathname;
  if (
    currentPath === '/login' ||
    currentPath === '/register' ||
    currentPath === '/forgot-password' ||
    currentPath === '/reset-password'
  ) {
    return;
  }

  const next = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
  window.location.replace(`/login?next=${next}`);
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return requestCore<T>(endpoint, options, 'application/json');
}

export async function apiRequestFormData<T>(
  endpoint: string,
  formData: FormData,
  options: Omit<RequestInit, 'body'> = {}
): Promise<T> {
  return requestCore<T>(
    endpoint,
    {
      ...options,
      body: formData,
    }
  );
}

export function normalizeMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  const raw = url.trim();
  if (!raw) return undefined;
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

  try {
    const parsed = new URL(raw);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      return `${API_ORIGIN}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
    return raw;
  } catch {
    if (raw.startsWith('/')) {
      return `${API_ORIGIN}${raw}`;
    }
    return `${API_ORIGIN}/${raw}`;
  }
}
