'use client';
import { ThemeProvider } from 'next-themes';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi.config';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } }
  }));
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
          <Toaster
            position="top-right"
            toastOptions={{
              style: { background: 'rgb(24,24,27)', color: '#fff', fontSize: '13px', fontWeight: 600, borderRadius: '10px', border: '1px solid rgba(63,63,70,0.5)' },
              success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
