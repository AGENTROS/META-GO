'use client';
import { useAccount, useSignMessage } from 'wagmi';
import { useState } from 'react';
import { SiweMessage } from 'siwe';

import { setJWTToken } from '@/lib/tokenManager';
import { BACKEND_URL, authenticatedFetch } from '@/lib/api';
import { getAddress } from 'viem';

export function useSIWE() {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [isLoading, setIsLoading] = useState(false);

  async function signIn() {
    if (!address || !chainId) throw new Error('Wallet not connected');
    setIsLoading(true);
    try {
      // Fetch real nonce from backend
      const nonceRes = await fetch(`${BACKEND_URL}/api/auth/nonce`);
      if (!nonceRes.ok) throw new Error('Failed to fetch nonce from backend');
      const { nonce } = await nonceRes.json();

      const checksumAddress = getAddress(address);

      const message = new SiweMessage({
        domain: window.location.host,
        address: checksumAddress,
        statement: 'Sign in to Meta Go - Sovereign Identity Protocol (Local Demo)',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
      });

      const prepared = message.prepareMessage();
      const signature = await signMessageAsync({ account: address, message: prepared });

      // Verify with backend
      const verifyRes = await fetch(`${BACKEND_URL}/api/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prepared, signature })
      });
      
      if (!verifyRes.ok) {
        throw new Error('Failed to verify signature with backend');
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


