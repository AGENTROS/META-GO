'use client';
import { useAccount, useSignMessage } from 'wagmi';
import { useState } from 'react';
import { SiweMessage } from 'siwe';

import { setJWTToken } from '@/lib/tokenManager';

export function useSIWE() {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isLoading, setIsLoading] = useState(false);

  async function signIn() {
    if (!address || !chainId) throw new Error('Wallet not connected');
    setIsLoading(true);
    try {
      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const nonceRes = await fetch(`${backend}/api/auth/nonce`, { credentials: 'include' });
      if (!nonceRes.ok) throw new Error('Failed to fetch nonce');
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

      const verifyRes = await fetch(`${backend}/api/auth/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prepared, signature }),
      });
      if (!verifyRes.ok) throw new Error('SIWE verification failed');
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
