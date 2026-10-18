import type { ApiResponse } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  statusCode: number;
  errors?: { field: string; message: string }[];

  constructor(message: string, statusCode: number, errors?: { field: string; message: string }[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

interface RequestOptions extends RequestInit {
  timeoutMs?: number;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { timeoutMs = 15000, headers = {}, ...rest } = options;

  const token = localStorage.getItem('govchain_token');
  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  try {
    const res = await fetch(url, {
      ...rest,
      headers: reqHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : null;

    if (!res.ok) {
      if (res.status === 401) {
        // Clear invalid or expired session
        localStorage.removeItem('govchain_token');
        localStorage.removeItem('govchain_user');
      }

      const errorMessage = data?.message || `Request failed with status ${res.status}`;
      throw new ApiError(errorMessage, res.status, data?.errors);
    }

    return data as ApiResponse<T>;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    if ((err as Error)?.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your network connection.', 408);
    }
    throw new ApiError(
      (err as Error)?.message || 'Network error occurred while connecting to GovChain API',
      0
    );
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'GET', ...options }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { method: 'DELETE', ...options }),

  // Multipart file upload
  uploadFiles: async <T>(files: File[]): Promise<ApiResponse<T>> => {
    const token = localStorage.getItem('govchain_token');
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const reqHeaders: Record<string, string> = {};
    if (token) reqHeaders['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/uploads`, {
      method: 'POST',
      headers: reqHeaders,
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new ApiError(data?.message || 'File upload failed', res.status, data?.errors);
    }
    return data;
  },
};
