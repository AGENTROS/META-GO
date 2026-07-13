import { getJWTToken, setJWTToken } from './tokenManager';

export const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';

// Cache structure: key -> { data, timestamp }
const requestCache = new Map<string, { data: any; timestamp: number }>();
// In-flight requests: key -> Promise
const inFlightRequests = new Map<string, Promise<any>>();

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  skipCache?: boolean;
}

export async function authenticatedFetch(path: string, opts: FetchOptions = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : (API_URL || '') + path;
  let token = getJWTToken();
  const headers = new Headers(opts.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const timeout = opts.timeout ?? 10000; // 10s default timeout
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

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

      // Handle 401 Unauthorized (except on verification/login endpoints)
      if (response.status === 401 && !path.includes('/api/auth/refresh') && !path.includes('/api/auth/verify')) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const refreshRes = await fetch(`${API_URL}/api/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
            });
            if (refreshRes.ok) {
              const data = await refreshRes.json();
              if (data.token) {
                setJWTToken(data.token);
                onRefreshed(data.token);
                isRefreshing = false;
                
                // Retry request with new token
                headers.set('Authorization', `Bearer ${data.token}`);
                return fetch(url, {
                  ...opts,
                  credentials: 'include',
                  headers,
                });
              }
            }
          } catch (err) {
            console.error('Failed to auto-refresh token:', err);
          }
          isRefreshing = false;
        } else {
          // Wait for refresh to complete, then retry
          return new Promise<Response>((resolve, reject) => {
            subscribeTokenRefresh((newToken) => {
              headers.set('Authorization', `Bearer ${newToken}`);
              fetch(url, {
                ...opts,
                credentials: 'include',
                headers,
              }).then(resolve).catch(reject);
            });
          });
        }
      }

      return response;
    } catch (error) {
      if (attempt < maxRetries && !controller.signal.aborted) {
        attempt++;
        // Exponential backoff delay
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

  // 1. SWR Cache & Deduplication for GET requests
  if (isGet && !opts.skipCache) {
    const cached = requestCache.get(cacheKey);
    const inFlight = inFlightRequests.get(cacheKey);

    // If we have an active in-flight request, share the promise (deduplication)
    if (inFlight) {
      return inFlight;
    }

    if (cached) {
      const age = Date.now() - cached.timestamp;
      const isStale = age > 10000; // Stale after 10s

      if (isStale) {
        // Trigger background revalidation (Stale-While-Revalidate)
        const revalidatePromise = (async () => {
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
      
      // Return cached immediately (even if stale, SWR will refresh)
      return cached.data;
    }
  }

  // 2. Execute new request (or share active promise)
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
