'use client';
import { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useIdentityStore } from '@/store/useIdentityStore';

export function useOnChainIdentity() {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const { setDID, hydrateMockData } = useIdentityStore();

  const refresh = useCallback(async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const did = `did:metago:${address.toLowerCase()}`;
      const fullDID = `did:metago:polygon:${address.toLowerCase()}`;
      setDID(did, fullDID);
      hydrateMockData();
      await new Promise(r => setTimeout(r, 700));
    } finally {
      setIsLoading(false);
    }
  }, [address, setDID, hydrateMockData]);

  useEffect(() => {
    if (address) refresh();
  }, [address, refresh]);

  return { isLoading, refresh };
}
