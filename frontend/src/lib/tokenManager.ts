const TOKEN_KEY = 'metago_jwt';

// In-memory cache for performance
let memoryToken: string | null = null;

export function setJWTToken(token: string | null): void {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }
}

export function getJWTToken(): string | null {
  if (memoryToken) return memoryToken;
  // Restore from sessionStorage on page reload
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (stored) {
      memoryToken = stored;
      return stored;
    }
  }
  return null;
}
