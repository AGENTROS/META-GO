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
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8005';
        const res = await fetch(`${backend}/api/identity/check-handle?handle=${encodeURIComponent(handle)}`);
        const data = await res.json();
        
        // Return availability status based on backend checks (Bloom Filter + DB)
        resolve({ available: data.status === 'AVAILABLE' });
      } catch (e) {
        console.error('Error contacting identity check-handle API:', e);
        // Fallback to safe unavailable status on network errors
        resolve({ available: false });
      }
    }, 300); // 300ms debounce window
  });
}
