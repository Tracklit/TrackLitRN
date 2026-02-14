import { env } from '@/config/env';
import { getToken } from './tokenStorage';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  data?: unknown;
  headers?: Record<string, string>;
  rawResponse?: boolean;
  skipAuth?: boolean; // Skip adding auth header (for login/register)
}

const defaultHeaders = {
  Accept: 'application/json',
};

// Debug mode - set to true to see API calls in console
const DEBUG_API = __DEV__;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

function isRetryable(status: number, isHtml: boolean): boolean {
  return isHtml || status === 502 || status === 503 || status === 504;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Make an API request with automatic JWT authentication and retry on transient errors
 */
export async function apiRequest<T = any>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', data, headers, rawResponse, skipAuth } = options;
  const url = path.startsWith('http') ? path : `${env.API_BASE_URL}${path}`;

  const requestHeaders: Record<string, string> = {
    ...defaultHeaders,
    ...(data ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
  };

  let hasToken = false;
  if (!skipAuth) {
    const token = await getToken();
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
      hasToken = true;
    }
  }

  if (DEBUG_API) {
    console.log(`[API] ${method} ${path}`, {
      hasToken,
      skipAuth,
      baseUrl: env.API_BASE_URL,
    });
  }

  let lastError: any = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (DEBUG_API) {
        console.log(`[API] ${method} ${path} -> ${response.status}${attempt > 0 ? ` (retry ${attempt})` : ''}`);
      }

      if (rawResponse) {
        return response as unknown as T;
      }

      const text = await response.text();
      let payload = null;

      const isHtml = text.trimStart().startsWith('<!DOCTYPE') || text.trimStart().startsWith('<html');

      try {
        payload = text && !isHtml ? JSON.parse(text) : null;
      } catch (parseError) {
        if (DEBUG_API) {
          console.log(`[API] Failed to parse response:`, text.substring(0, 200));
        }
      }

      if (isHtml || !response.ok) {
        if (isRetryable(response.status, isHtml) && attempt < MAX_RETRIES) {
          if (DEBUG_API) {
            console.log(`[API] Retryable error (${response.status}), retrying in ${RETRY_DELAY_MS}ms...`);
          }
          await wait(RETRY_DELAY_MS);
          continue;
        }

        const errorMessage = isHtml
          ? 'Server is currently unavailable. Please try again in a moment.'
          : payload?.error ||
            payload?.message ||
            response.statusText ||
            'Request failed';

        if (DEBUG_API) {
          console.log(`[API] Error ${response.status}:`, errorMessage);
        }

        const error = new Error(errorMessage) as Error & {
          status?: number;
          payload?: unknown;
          isServerDown?: boolean;
        };
        error.status = isHtml ? 503 : response.status;
        error.payload = payload ?? text;
        error.isServerDown = isHtml;
        throw error;
      }

      return payload as T;
    } catch (error: any) {
      lastError = error;
      if (error?.isServerDown !== undefined) {
        throw error;
      }
      if (attempt < MAX_RETRIES) {
        if (DEBUG_API) {
          console.log(`[API] Network error, retrying in ${RETRY_DELAY_MS}ms...`, error?.message);
        }
        await wait(RETRY_DELAY_MS);
        continue;
      }
      if (DEBUG_API) {
        console.log(`[API] Network error for ${method} ${path}:`, error);
      }
      throw error;
    }
  }

  throw lastError;
}
