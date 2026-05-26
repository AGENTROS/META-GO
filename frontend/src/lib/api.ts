// Backend BFF URL helper - all /api/* calls go to FastAPI on port 8001 via platform routing.
export const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export async function apiCall(path: string, opts: RequestInit = {}) {
  const url = path.startsWith('http') ? path : (API_URL || '') + path;
  const res = await fetch(url, {
    ...opts,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}
