'use client';
import { useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { useIdentityStore } from '@/store/useIdentityStore';
import { CONTRACTS } from '@/lib/wagmi.config';

export function useOnChainIdentity() {
  const { address } = useAccount();
  const { setDID, setHandle, hydrateMockData } = useIdentityStore();

  const { data: identityData, isLoading, refetch } = useReadContract({
    address: CONTRACTS.IDENTITY_REGISTRY as `0x${string}`,
    abi: [
      {
        "inputs": [
          {
            "internalType": "address",
            "name": "",
            "type": "address"
          }
        ],
        "name": "identities",
        "outputs": [
          {
            "internalType": "string",
            "name": "handle",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "did",
            "type": "string"
          },
          {
            "internalType": "bytes32",
            "name": "proofHash",
            "type": "bytes32"
          },
          {
            "internalType": "uint64",
            "name": "timestamp",
            "type": "uint64"
          },
          {
            "internalType": "bool",
            "name": "active",
            "type": "bool"
          }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ],
    functionName: 'identities',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  useEffect(() => {
    if (address && identityData) {
      const [handle, didVal, proofHash, timestamp, active] = identityData as [string, string, string, bigint, boolean];
      if (active) {
        setHandle(handle);
        setDID(didVal, `did:metago:polygon:${address.toLowerCase()}`);
      } else {
        setDID(`did:metago:${address.toLowerCase()}`, `did:metago:polygon:${address.toLowerCase()}`);
      }
      hydrateMockData();
    }
  }, [address, identityData, setDID, setHandle, hydrateMockData]);

  return { isLoading, refresh: refetch };
}
