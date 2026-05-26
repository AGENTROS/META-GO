'use client';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { WalletConnector } from '@/components/auth/WalletConnector';
import { BiometricScanner } from '@/components/auth/BiometricScanner';
import { ZKPForge } from '@/components/auth/ZKPForge';
import { NeonButton } from '@/components/ui/NeonButton';
import { NeonInput } from '@/components/ui/NeonInput';
import { checkHandleAvailability } from '@/lib/bloomFilter';
import { CheckCircle2, Fingerprint, XCircle } from 'lucide-react';
import { useIdentityStore } from '@/store/useIdentityStore';

export default function EmbedPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const store = useIdentityStore();
  const [step, setStep] = useState(0);
  const [startedAt] = useState(Date.now());
  const [handle, setHandle] = useState('');
  const [handleStatus, setHandleStatus] = useState<'idle'|'checking'|'available'|'taken'>('idle');
  const [faceLandmarks, setFaceLandmarks] = useState<number[][] | null>(null);
  const [proofHash, setProofHash] = useState('');
  const [done, setDone] = useState(false);

  async function checkHandle(val: string) {
    setHandle(val);
    if (val.length < 3) { setHandleStatus('idle'); return; }
    setHandleStatus('checking');
    const { available } = await checkHandleAvailability(val);
    setHandleStatus(available ? 'available' : 'taken');
  }

  function finish(realProof: any, hash: string) {
    setProofHash(hash);
    const did = `did:metago:${address?.toLowerCase()}`;
    store.setHandle(handle);
    store.setDID(did, `did:metago:polygon:${address?.toLowerCase()}`);
    store.hydrateMockData();
    // Sync with backend (best effort) and trigger real on-chain mint
    const backend = process.env.NEXT_PUBLIC_BACKEND_URL || '';
    fetch(`${backend}/api/user/sync`, {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle, walletAddress: address, did,
        zkProof: {
          proofHash: hash,
          nullifier: realProof?.nullifier || `nul-${Date.now()}`,
          algorithm: realProof?.algorithm || 'simulation-bn128',
          isReal: !!realProof?.isReal,
          generatedAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
          integrityScore: realProof?.integrityScore || 85,
        },
      }),
    }).catch(() => {});

    setDone(true);
    // Post message to parent
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'metago:identity-forged',
        did, handle, proofHash: hash,
        durationMs: Date.now() - startedAt,
      }, '*');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-blue-950/20 flex flex-col">
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-blue-600/10 border border-blue-600/30 flex items-center justify-center">
          <Fingerprint size={14} className="text-blue-600" />
        </div>
        <span className="font-bold text-sm">Meta<span className="text-blue-600"> Go</span></span>
        <span className="ml-auto text-[10px] font-mono uppercase text-zinc-500">embed v1.0</span>
      </div>

      <main className="flex-1 px-6 py-6 overflow-y-auto">
        <div className="flex justify-between mb-4">
          {['Handle', 'Wallet', 'Face', 'ZK Proof', 'Done'].map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-blue-600 text-white' : 'bg-zinc-200 text-zinc-500'
              }`}>{i + 1}</div>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${i === step ? 'text-blue-600' : 'text-zinc-400'}`}>{s}</span>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Pick your handle</h2>
            <p className="text-xs text-zinc-500">This is your unique identifier on Meta Go.</p>
            <div className="relative">
              <NeonInput value={handle} onChange={e => checkHandle(e.target.value.toLowerCase())}
                placeholder="username" data-testid="embed-handle"
                icon={<span className="text-zinc-450 text-sm font-semibold">@</span>} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {handleStatus === 'checking' && <div className="w-3 h-3 border-2 border-zinc-300 border-t-blue-600 rounded-full animate-spin" />}
                {handleStatus === 'available' && <CheckCircle2 size={16} className="text-emerald-500" />}
                {handleStatus === 'taken' && <XCircle size={16} className="text-red-500" />}
              </div>
            </div>
            <NeonButton onClick={() => setStep(1)} disabled={handleStatus !== 'available'} className="w-full">Continue →</NeonButton>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Connect your wallet</h2>
            <WalletConnector onSuccess={() => setStep(2)} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Liveness scan</h2>
            <BiometricScanner onComplete={lm => { setFaceLandmarks(lm); setStep(3); }} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Generating proof…</h2>
            <ZKPForge faceLandmarks={faceLandmarks} walletAddress={address || ''}
              onComplete={(hash, realProof) => { finish(realProof, hash); setStep(4); }} />
          </div>
        )}

        {step === 4 && done && (
          <div className="text-center py-10">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Identity Forged</h2>
            <p className="text-xs text-zinc-500 mb-4 font-mono break-all">{proofHash}</p>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">@{handle} is now verified on the Meta Go protocol.</p>
          </div>
        )}
      </main>
    </div>
  );
}
