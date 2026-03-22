const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

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
    throw new ApiException(await parseApiError(response));
  }

  return parseApiSuccess<T>(response);
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
