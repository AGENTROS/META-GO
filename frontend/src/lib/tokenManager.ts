const TOKEN_KEY = 'metago_jwt';

// In-memory cache for performance
let memoryToken: string | null = null;

export function setJWTToken(token: string | null): void {
  memoryToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      
      // Auto-populate cookies for server-side middleware and layouts
      try {
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
        
        document.cookie = `celestial_jwt=${token}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `celestial_auth=1; path=/; max-age=86400; SameSite=Lax`;
        
        if (payload.role === 'admin') {
          document.cookie = `celestial_admin=1; path=/; max-age=86400; SameSite=Lax`;
        } else {
          document.cookie = `celestial_admin=; Max-Age=0; path=/`;
        }
      } catch (e) {
        console.error('Failed to write JWT session cookies:', e);
      }
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      
      // Clear cookies on logout
      document.cookie = 'celestial_jwt=; Max-Age=0; path=/';
      document.cookie = 'celestial_auth=; Max-Age=0; path=/';
      document.cookie = 'celestial_admin=; Max-Age=0; path=/';
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
