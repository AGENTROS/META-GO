'use client';
import { useAccount, useSignMessage } from 'wagmi';
import { useState } from 'react';
import { SiweMessage } from 'siwe';

import { setJWTToken } from '@/lib/tokenManager';
import { BACKEND_URL, authenticatedFetch } from '@/lib/api';

export function useSIWE() {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isLoading, setIsLoading] = useState(false);

  async function signIn() {
    if (!address || !chainId) throw new Error('Wallet not connected');
    setIsLoading(true);
    try {
      const backend = BACKEND_URL;
      console.debug('[useSIWE] BACKEND_URL=', backend);
      // Use centralized authenticatedFetch to handle CORS, retries and refresh orchestration
      let nonceRes: Response;
      try {
        nonceRes = await authenticatedFetch('/api/auth/nonce', { method: 'GET' });
      } catch (err) {
        console.error('[useSIWE] authenticatedFetch nonce failed:', err);
        throw new Error('Network error fetching nonce');
      }
      if (!nonceRes.ok) {
        const txt = await nonceRes.text().catch(() => '');
        console.error('[useSIWE] nonce response not ok', nonceRes.status, txt);
        throw new Error('Failed to fetch nonce');
      }
      const { nonce } = await nonceRes.json();

      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Meta Go - Sovereign Identity Protocol',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
      });

      const prepared = message.prepareMessage();
      const signature = await signMessageAsync({ account: address, message: prepared });

      let verifyRes: Response;
      try {
        verifyRes = await authenticatedFetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: prepared, signature }),
        });
      } catch (err) {
        console.error('[useSIWE] authenticatedFetch verify failed:', err);
        throw new Error('Network error during SIWE verify');
      }
      if (!verifyRes.ok) {
        const txt = await verifyRes.text().catch(() => '');
        console.error('[useSIWE] verify response not ok', verifyRes.status, txt);
        throw new Error('SIWE verification failed');
      }
      const data = await verifyRes.json();
      if (data.token) {
        setJWTToken(data.token);
      }
      return data;
    } finally {
      setIsLoading(false);
    }
  }

  return { signIn, isLoading };
}


