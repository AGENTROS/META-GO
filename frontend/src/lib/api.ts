import { getJWTToken, setJWTToken } from './tokenManager';

export const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

// Cache structure: key -> { data, timestamp }
const requestCache = new Map<string, { data: any; timestamp: number }>();
// In-flight requests: key -> Promise
const inFlightRequests = new Map<string, Promise<any>>();

let isRefreshing = false;
type TokenRefreshHandler = (token: string | null) => void;
let refreshSubscribers: TokenRefreshHandler[] = [];

function subscribeTokenRefresh(cb: TokenRefreshHandler) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipCache?: boolean;
}

async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      setJWTToken(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
      return null;
    }

    const data = await res.json();
    if (data?.token) {
      setJWTToken(data.token);
      return data.token;
    }
    return null;
  } catch (err) {
    console.error('Token refresh failed:', err);
    return null;
  }
}

export async function authenticatedFetch(path: string, opts: FetchOptions = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
  const headers = new Headers(opts.headers || {});
  const token = getJWTToken();

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const timeout = opts.timeout ?? 10000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort('Backend request timeout'), timeout);

  let attempt = 0;
  const maxRetries = opts.retries ?? 2;
  const delay = opts.retryDelay ?? 1000;

  const executeFetch = async (): Promise<Response> => {
    try {
      const response = await fetch(url, {
        ...opts,
        credentials: 'include',
        headers,
        signal: controller.signal,
      });
      clearTimeout(id);

      if (response.status === 401 && !path.includes('/api/auth/refresh') && !path.includes('/api/auth/verify')) {
        if (!isRefreshing) {
          isRefreshing = true;
          const newToken = await refreshToken();
          isRefreshing = false;
          onRefreshed(newToken);

          if (!newToken) {
            setJWTToken(null);
            if (typeof window !== 'undefined') {
              window.location.href = '/auth';
            }
            throw new Error('Unauthorized');
          }

          headers.set('Authorization', `Bearer ${newToken}`);
          return fetch(url, {
            ...opts,
            credentials: 'include',
            headers,
          });
        }

        return new Promise<Response>((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (!newToken) {
              setJWTToken(null);
              if (typeof window !== 'undefined') {
                window.location.href = '/auth';
              }
              reject(new Error('Unauthorized'));
              return;
            }
            headers.set('Authorization', `Bearer ${newToken}`);
            fetch(url, {
              ...opts,
              credentials: 'include',
              headers,
            }).then(resolve).catch(reject);
          });
        });
      }

      return response;
    } catch (error: any) {
      // Silently handle abort/timeout errors - backend is just not available
      if (error?.name === 'AbortError' || controller.signal.aborted) {
        clearTimeout(id);
        return new Response(JSON.stringify({ error: 'Backend unavailable' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (attempt < maxRetries && !controller.signal.aborted) {
        attempt++;
        await new Promise(r => setTimeout(r, delay * Math.pow(2, attempt)));
        return executeFetch();
      }
      clearTimeout(id);
      throw error;
    }
  };

  return executeFetch();
}

export async function apiCall(path: string, opts: FetchOptions = {}): Promise<any> {
  const cacheKey = `${opts.method || 'GET'}:${path}`;
  const isGet = !opts.method || opts.method.toUpperCase() === 'GET';

  if (isGet && !opts.skipCache) {
    const cached = requestCache.get(cacheKey);
    const inFlight = inFlightRequests.get(cacheKey);

    if (inFlight) {
      return inFlight;
    }

    if (cached) {
      const age = Date.now() - cached.timestamp;
      const isStale = age > 10000;

      if (isStale) {
        (async () => {
          try {
            const res = await authenticatedFetch(path, opts);
            if (res.ok) {
              const freshData = await res.json();
              requestCache.set(cacheKey, { data: freshData, timestamp: Date.now() });
            }
          } catch (e) {
            console.warn(`Background revalidation failed for ${path}:`, e);
          }
        })();
      }

      return cached.data;
    }
  }

  const promise = (async () => {
    const res = await authenticatedFetch(path, opts);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${path} failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    if (isGet) {
      requestCache.set(cacheKey, { data, timestamp: Date.now() });
    }
    return data;
  })();

  if (isGet) {
    inFlightRequests.set(cacheKey, promise);
    try {
      return await promise;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  }

  return promise;
}
