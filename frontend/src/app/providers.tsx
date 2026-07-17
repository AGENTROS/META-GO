'use client';
import { ThemeProvider } from 'next-themes';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi.config';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { getJWTToken } from '@/lib/tokenManager';


import { LazyMotion, domMax } from 'framer-motion';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } }
  }));
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const handleRequestToken = (event: MessageEvent) => {
      if (event.data && event.data.type === 'metago:request-token') {
        const senderOrigin = event.origin;
        const rawOrigins = process.env.NEXT_PUBLIC_APPROVED_EMBED_ORIGINS || '';
        const APPROVED_ORIGINS = rawOrigins.split(',').map(o => o.trim()).filter(Boolean);
        const isAllowed = APPROVED_ORIGINS.includes(senderOrigin) || senderOrigin === window.location.origin;
        if (isAllowed) {
          const jwtToken = getJWTToken();
          if (jwtToken && event.source) {
            (event.source as Window).postMessage({
              type: 'metago:deliver-token',
              token: jwtToken,
              nonce: event.data.nonce
            }, senderOrigin);
          }
        }
      }
    };
    window.addEventListener('message', handleRequestToken);
    return () => window.removeEventListener('message', handleRequestToken);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <LazyMotion features={domMax} strict>
            {children}
          </LazyMotion>
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
