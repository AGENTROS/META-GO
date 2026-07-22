import { BACKEND_URL } from '@/lib/api';

// Production Bloom Filter client utility with built-in 300ms debounce
let debounceTimer: NodeJS.Timeout | null = null;

export async function checkHandleAvailability(handle: string): Promise<{ available: boolean }> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  return new Promise((resolve) => {
    debounceTimer = setTimeout(async () => {
      // Basic client-side validation first
      if (!/^[a-z0-9_]{3,20}$/.test(handle)) {
        resolve({ available: false });
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/api/identity/check-handle?handle=${encodeURIComponent(handle)}`);
        const data = await res.json();
        
        // Return availability status based on backend checks (Bloom Filter + DB)
        resolve({ available: data.status === 'AVAILABLE' });
      } catch (e) {
        console.error('Error contacting identity check-handle API:', e);
        // Fallback to available status on network errors so user is not blocked
        resolve({ available: true });
      }
    }, 300); // 300ms debounce window
  });
}
