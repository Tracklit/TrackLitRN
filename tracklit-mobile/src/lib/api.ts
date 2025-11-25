import { env } from '@/config/env';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type CredentialsMode = 'omit' | 'same-origin' | 'include';

interface RequestOptions {
  method?: HttpMethod;
  data?: unknown;
  headers?: Record<string, string>;
  rawResponse?: boolean;
}

const defaultHeaders = {
  Accept: 'application/json',
};

export async function apiRequest<T = any>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', data, headers, rawResponse } = options;
  const url = path.startsWith('http') ? path : `${env.API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      ...defaultHeaders,
      ...(data ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include' as CredentialsMode,
  });

  if (rawResponse) {
    return response as unknown as T;
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const errorMessage =
      payload?.error ||
      payload?.message ||
      response.statusText ||
      'Request failed';
    throw new Error(errorMessage);
  }

  return payload as T;
}

