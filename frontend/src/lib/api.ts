// Backend BFF URL helper - all /api/* calls go to FastAPI on port 8001 via platform routing.
import { getJWTToken } from './tokenManager';
export const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export async function apiCall(path: string, opts: RequestInit = {}) {
  const res = await authenticatedFetch(path, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function authenticatedFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : (API_URL || '') + path;
  const token = getJWTToken();
  const headers = new Headers(opts.headers || {});
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, {
    ...opts,
    credentials: 'include',
    headers,
  });
}
