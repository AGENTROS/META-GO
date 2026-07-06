'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/GlassCard';
import { Shield, ShieldAlert, Check, Loader2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAccount, useSignMessage, useWriteContract } from 'wagmi';
import { CONTRACTS } from '@/lib/wagmi.config';
import { hardhat } from 'wagmi/chains';
import { authenticatedFetch as fetch } from '@/lib/api';


function GuardianApproveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { writeContractAsync } = useWriteContract();

  const sessionId = searchParams.get('sessionId') || '';
  const [loading, setLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [hasApproved, setHasApproved] = useState(false);

  // Load session info on load
  useEffect(() => {
    if (!sessionId) return;
    const fetchSession = async () => {
      setLoading(true);
      try {
        const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
        const res = await fetch(`${backend}/api/recovery/session/${sessionId}`);
        if (!res.ok) throw new Error('Session not found');
        const data = await res.json();
        setSessionInfo(data);
      } catch (e) {
        console.error(e);
        toast.error('Failed to resolve recovery session details');
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [sessionId]);

  const handleApprove = async () => {
    if (!address) {
      toast.error('Connect your guardian wallet');
      return;
    }
    if (!sessionInfo || !sessionInfo.oldAddress) {
      toast.error('Session details not loaded');
      return;
    }

    setIsApproving(true);
    const toastId = toast.loading('Initiating approval transaction...');
    try {
      // 1. Submit on-chain approval
      const txHash = await writeContractAsync({
        address: CONTRACTS.IDENTITY_REGISTRY as `0x${string}`,
        abi: [
          {
            "inputs": [
              {
                "internalType": "address",
                "name": "_targetIdentity",
                "type": "address"
              }
            ],
            "name": "approveRecovery",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }
        ] as const,
        functionName: 'approveRecovery',
        args: [sessionInfo.oldAddress as `0x${string}`],
        account: address as `0x${string}`,
        chain: hardhat,
      });

      // 2. Submit signature & approval to backend to sync
      toast.loading('Syncing approval with database...', { id: toastId });
      const message = `Approve Meta Go social recovery for session: ${sessionId}`;
      const signature = await signMessageAsync({ account: address, message });

      const backend = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
      
      const res = await fetch(`${backend}/api/recovery/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          guardianAddress: address.toLowerCase(),
          signature
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Sync failed');
      }

      setHasApproved(true);
      toast.success('Your on-chain approval has been registered!', { id: toastId });
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Failed to approve', { id: toastId });
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <GlassCard className="p-8 space-y-6" intensity="high">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mb-2 border border-amber-500/20">
            <Shield size={24} className="animate-pulse" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Meta Go <span className="gradient-text">Guardian Attestation</span>
          </h1>
          <p className="text-xs text-zinc-550 dark:text-zinc-400">
            You are requested to authorize a social recovery migration for a trusted contact.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-[10px] font-mono text-zinc-450 uppercase">Syncing recovery session details...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-900/5 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-2.5">
              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-450 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                <span>RECOVERY ATTESTATION CONSOLE</span>
                <span className="text-amber-500 font-bold">ACTIVE</span>
              </div>
              <div className="text-[9px] font-mono text-zinc-500 space-y-1">
                <p>Session: <span className="text-zinc-700 dark:text-zinc-350">{sessionId}</span></p>
                <p className="leading-relaxed">
                  Attestation: This signature confirms that you approve migrating the associated DID to the new owner's wallet key.
                </p>
              </div>
            </div>

            {isConnected && address ? (
              <div className="space-y-4">
                <div className="p-3 bg-zinc-900/5 dark:bg-zinc-950/40 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                  <p className="text-[8px] font-mono text-zinc-450 uppercase">Connected Guardian</p>
                  <p className="text-xs font-mono font-bold text-zinc-800 dark:text-zinc-200 truncate">{address}</p>
                </div>

                {hasApproved ? (
                  <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-center space-y-2 text-emerald-500">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500 animate-bounce" />
                    <p className="text-xs font-bold">Attestation Registered</p>
                    <p className="text-[10px] text-zinc-450">
                      Consensus updated. You can safely close this browser window and return.
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Registering...
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Approve Recovery Transfer
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-center space-y-2 text-amber-500">
                  <ShieldAlert size={20} className="mx-auto" />
                  <p className="text-xs font-bold">Connect Wallet</p>
                  <p className="text-[10px] text-zinc-550 dark:text-zinc-400">
                    Please connect your guardian wallet address to verify your credentials.
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/auth?redirect=${encodeURIComponent(window.location.search)}`)}
                  className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-bold rounded-xl uppercase tracking-wider transition-all"
                >
                  Log in with Wallet
                </button>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

export default function GuardianApprovePage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <p className="text-xs font-mono text-zinc-450">Loading Recovery Attestation...</p>
        </div>
      }>
        <GuardianApproveContent />
      </Suspense>
    </div>
  );
}
